import { chromium } from 'playwright';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'scratch', 'redesign');

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'sobre', path: '/sobre' },
  { name: 'territorios', path: '/territorios' },
  { name: 'ativos', path: '/ativos' },
  { name: 'cadeia', path: '/cadeia' },
  { name: 'cursos', path: '/cursos' },
  { name: 'relatorio', path: '/relatorio' },
  { name: 'admin', path: '/admin' }
];

const RESOLUTIONS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 }
];

const THEMES = ['light', 'dark'];

function pingServer(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.request(
        {
          hostname: u.hostname,
          port: u.port,
          path: '/',
          method: 'HEAD',
          timeout: timeoutMs
        },
        (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 500);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function ensureServerRunning() {
  // Check if 4173 (preview) or 5173 (dev) is already responding
  if (await pingServer('http://127.0.0.1:4173')) {
    console.log('[Server] Conectado ao servidor ativo em http://127.0.0.1:4173 (preview)');
    return { url: 'http://127.0.0.1:4173', proc: null };
  }
  if (await pingServer('http://localhost:5173')) {
    console.log('[Server] Conectado ao servidor ativo em http://localhost:5173 (dev)');
    return { url: 'http://localhost:5173', proc: null };
  }

  console.log('[Server] Iniciando servidor de pré-visualização (vite preview --port 4173)...');
  const proc = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: ROOT_DIR,
    shell: true,
    stdio: 'ignore'
  });

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await pingServer('http://127.0.0.1:4173')) {
      console.log('[Server] Servidor de pré-visualização pronto em http://127.0.0.1:4173');
      return { url: 'http://127.0.0.1:4173', proc };
    }
  }

  throw new Error('Falha ao iniciar o servidor local para captura.');
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const { url: baseUrl, proc } = await ensureServerRunning();

  let browser = null;
  const issues = [];
  let totalCaptures = 0;

  try {
    console.log('[Playwright] Inicializando Chromium...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();

    console.log(`\n============================================================`);
    console.log(`INICIANDO CAPTURAS DE QA (8 Rotas x 3 Resoluções x 2 Temas)`);
    console.log(`Destino: scratch/redesign/`);
    console.log(`============================================================\n`);

    for (const route of ROUTES) {
      console.log(`--> Visitando rota: ${route.path} (${route.name})`);

      for (const res of RESOLUTIONS) {
        await page.setViewportSize({ width: res.width, height: res.height });

        for (const theme of THEMES) {
          const targetUrl = `${baseUrl}${route.path}?theme=${theme}`;
          
          try {
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
          } catch (e) {
            console.warn(`[WARN] Timeout ao carregar ${targetUrl}:`, e.message);
          }

          // Alterna classe no document.documentElement e ajusta localStorage
          await page.evaluate((t) => {
            if (t === 'dark') {
              document.documentElement.classList.add('dark');
              localStorage.setItem('secti-theme', 'dark');
              localStorage.setItem('theme', 'dark');
            } else {
              document.documentElement.classList.remove('dark');
              localStorage.setItem('secti-theme', 'light');
              localStorage.setItem('theme', 'light');
            }
            // Remove overlay do Joyride se ativo
            const overlays = document.querySelectorAll('.react-joyride__overlay, .react-joyride__spotlight');
            overlays.forEach((el) => el.remove());
          }, theme);

          // Aguarda estabilização de fontes e transições
          await page.waitForTimeout(900);

          // Medição de overflow horizontal
          const overflowData = await page.evaluate(() => {
            const docEl = document.documentElement;
            const scrollWidth = docEl.scrollWidth;
            const innerWidth = window.innerWidth;
            const hasOverflow = scrollWidth > innerWidth + 1;

            let culprit = null;
            if (hasOverflow) {
              const all = document.querySelectorAll('*');
              for (const el of all) {
                const box = el.getBoundingClientRect();
                if (box.right > innerWidth + 2) {
                  const tag = el.tagName.toLowerCase();
                  const cls = (el.className && typeof el.className === 'string') ? el.className.split(' ').slice(0, 3).join('.') : '';
                  culprit = `<${tag} class="${cls}"> (right: ${Math.round(box.right)}px)`;
                  break;
                }
              }
            }

            return {
              scrollWidth,
              innerWidth,
              hasOverflow,
              culprit
            };
          });

          const filename = `${route.name}_${res.width}x${res.height}_${theme}.png`;
          const filePath = path.join(OUTPUT_DIR, filename);

          await page.screenshot({ path: filePath, fullPage: false });
          totalCaptures++;

          if (overflowData.hasOverflow) {
            const issueMsg = `[OVERFLOW DETECTADO] Rota ${route.path} @ ${res.width}x${res.height} (${theme}): scrollWidth ${overflowData.scrollWidth} > innerWidth ${overflowData.innerWidth}. Elemento: ${overflowData.culprit}`;
            console.error(`  [X] ${filename} - ${issueMsg}`);
            issues.push({ route: route.path, resolution: `${res.width}x${res.height}`, theme, issue: issueMsg });
          } else {
            console.log(`  [OK] ${filename} (scrollWidth: ${overflowData.scrollWidth} <= ${overflowData.innerWidth})`);
          }
        }
      }
    }

    console.log(`\n============================================================`);
    console.log(`TOTAL DE CAPTURAS: ${totalCaptures} capturas concluídas com sucesso.`);
    console.log(`PROBLEMAS DE OVERFLOW: ${issues.length}`);
    if (issues.length > 0) {
      console.log(`Resumo dos problemas encontrados:`);
      issues.forEach((iss) => console.log(` - ${iss.issue}`));
    } else {
      console.log(`Nenhum overflow horizontal detectado em nenhuma resolução ou tema!`);
    }
    console.log(`============================================================\n`);

  } finally {
    if (browser) {
      await browser.close();
    }
    if (proc) {
      console.log('[Server] Encerrando servidor de pré-visualização...');
      proc.kill();
    }
  }

  if (issues.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('[ERRO FATAL NO SCRIPT DE CAPTURA]:', err);
  process.exit(1);
});
