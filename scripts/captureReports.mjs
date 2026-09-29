import { chromium } from 'playwright-core';
import sparticuzChromium from '@sparticuz/chromium';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Inicializa a instância do Chromium:
 * - Em ambiente Vercel / Linux Serverless: utiliza @sparticuz/chromium + playwright-core.
 * - Em ambiente local (Windows/macOS): utiliza o Chromium do Playwright local.
 */
export async function launchChromium() {
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.platform === 'linux'
  );

  if (isServerless) {
    console.log('[Playwright] Inicializando @sparticuz/chromium (Serverless Vercel)...');
    return await chromium.launch({
      args: sparticuzChromium.args,
      executablePath: await sparticuzChromium.executablePath(),
      headless: true
    });
  }

  // Ambiente de desenvolvimento local
  console.log('[Playwright] Inicializando Chromium local...');
  try {
    const pw = await import('playwright');
    return await pw.chromium.launch({ headless: true });
  } catch {
    return await chromium.launch({ headless: true });
  }
}

/**
 * Captura um relatório específico utilizando Playwright (Chromium real) a 1920x1080 @3x,
 * salva o screenshot PNG de alta fidelidade e converte para PDF na proporção exata 16:9 (300 x 168.75 mm).
 *
 * @param {Object} options
 * @param {string} options.route - Rota relativa (ex: '/relatorio/ativos')
 * @param {string} [options.pngPath] - Caminho opcional para salvar o PNG em disco (ignorado em serverless)
 * @param {string} [options.pdfPath] - Caminho opcional para salvar o PDF em disco (ignorado em serverless)
 * @param {string} [options.baseUrl='http://localhost:5173'] - URL base do servidor
 * @param {import('playwright-core').Browser} [options.browserInstance] - Instância de navegador opcional para reuso
 * @returns {Promise<{ pngPath: string, pdfPath: string, width: number, height: number, pdfBuffer: Buffer, pngBuffer: Buffer }>}
 */
export async function captureReportWithPlaywright({
  route,
  pngPath,
  pdfPath,
  baseUrl = 'http://localhost:5173',
  browserInstance = null
}) {
  const shouldCloseBrowser = !browserInstance;
  const browser = browserInstance || await launchChromium();

  try {
    // 1. Configura viewport oficial de 1920x1080 com deviceScaleFactor: 3 (5760x3240 px)
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 3,
      colorScheme: 'light'
    });

    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', err => {
      console.error('[Playwright Page Error]:', err.message);
      pageErrors.push(err.message);
    });

    const targetUrl = route.startsWith('http') ? route : `${baseUrl}${route}`;

    console.log(`[Playwright] Navegando para: ${targetUrl}`);
    // Utiliza domcontentloaded para não ficar retido por WebSockets contínuos (HMR / Supabase) ou streaming de tiles
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 2. Aguarda o elemento raiz oficial do relatório estar montado no DOM e visível
    try {
      await page.waitForSelector('#pdf-report', { state: 'attached', timeout: 60000 });
      await page.waitForSelector('#pdf-report', { state: 'visible', timeout: 30000 });
    } catch (selectorErr) {
      const currentUrl = page.url();
      const pageTextSnippet = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 300) : '').catch(() => '');
      throw new Error(`Timeout aguardando #pdf-report na rota ${route} (URL atual: ${currentUrl}). Erros na página: ${pageErrors.join(' | ') || pageTextSnippet || selectorErr.message}`);
    }

    // 3. Aguarda ausência de loaders ou estado de carregamento de dados
    await page.waitForFunction(() => {
      const hasSpinner = document.querySelector('.animate-spin') !== null;
      const hasLoadingText = document.body && document.body.innerText.includes('Carregando dados...');
      return !hasSpinner && !hasLoadingText;
    }, { timeout: 45000 }).catch(() => {
      console.warn('[Playwright] Timeout aguardando desaparecimento de loaders, prosseguindo com captura.');
    });

    // 4. Aguarda resolução de fontes, decodificação de imagens, vetores e requestAnimationFrame
    await page.evaluate(async () => {
      // Fontes
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (e) {}
      }

      // Imagens e tiles do mapa
      const imgs = Array.from(document.querySelectorAll('#pdf-report img'));
      await Promise.all(imgs.map(async (img) => {
        if (!img.complete) {
          await new Promise((res) => {
            img.onload = res;
            img.onerror = res;
            setTimeout(res, 4000);
          });
        }
        if (img.decode) {
          try { await img.decode(); } catch (e) {}
        }
      }));

      // Dois frames de animação consecutivos para Recharts e Leaflet
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
    });

    // 5. Esconde apenas elementos temporários/indesejados sem alterar conteúdo
    await page.addStyleTag({
      content: `
        body, #pdf-report {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        body::-webkit-scrollbar, #pdf-report::-webkit-scrollbar {
          display: none !important;
        }
        .recharts-tooltip-wrapper, .leaflet-tooltip {
          display: none !important;
        }
        * {
          cursor: default !important;
        }
      `
    });

    // 6. Delay de estabilização final para Leaflet tiles e vetores
    await page.waitForTimeout(1500);

    // 7. Captura screenshot real do elemento #pdf-report em formato PNG @3x
    const reportLocator = page.locator('#pdf-report');
    const pngBuffer = await reportLocator.screenshot({
      type: 'png',
      scale: 'device',
      animations: 'disabled'
    });

    // 8. Salva o PNG (ignora em ambientes serverless com disco somente-leitura)
    if (pngPath) {
      try {
        const resolvedPngPath = path.isAbsolute(pngPath) ? pngPath : path.resolve(ROOT_DIR, pngPath);
        fs.mkdirSync(path.dirname(resolvedPngPath), { recursive: true });
        fs.writeFileSync(resolvedPngPath, pngBuffer);
        console.log(`[Playwright] PNG salvo em: ${resolvedPngPath} (${pngBuffer.length} bytes)`);
      } catch (e) {
        console.warn('[Playwright] Não foi possível salvar PNG em disco (esperado em ambiente serverless):', e.message);
      }
    }

    // 9. Gera o PDF proporcional 16:9 via jsPDF com a imagem do screenshot
    const pdfWidth = 300; // mm
    const pdfHeight = 168.75; // mm (300 * 9 / 16)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: true
    });

    const base64Png = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    pdf.addImage(base64Png, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    if (pdfPath) {
      try {
        const resolvedPdfPath = path.isAbsolute(pdfPath) ? pdfPath : path.resolve(ROOT_DIR, pdfPath);
        fs.mkdirSync(path.dirname(resolvedPdfPath), { recursive: true });
        fs.writeFileSync(resolvedPdfPath, pdfBuffer);
        console.log(`[Playwright] PDF salvo em: ${resolvedPdfPath} (${pdfBuffer.length} bytes)`);
      } catch (e) {
        console.warn('[Playwright] Não foi possível salvar PDF em disco (esperado em ambiente serverless):', e.message);
      }
    }

    await context.close().catch(() => {});

    return {
      pngPath,
      pdfPath,
      width: 5760,
      height: 3240,
      pdfBuffer,
      pngBuffer
    };
  } finally {
    if (shouldCloseBrowser && browser) {
      await browser.close().catch(() => {});
    }
  }
}

// Execução direta como script de linha de comando para gerar todos os 4 relatórios
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    console.log('====================================================');
    console.log('Iniciando captura oficial de relatórios com Playwright');
    console.log('Viewport: 1920x1080 CSS | deviceScaleFactor: 3 (@3x)');
    console.log('====================================================');

    const browser = await launchChromium();

    const reports = [
      {
        name: 'sintese',
        route: '/relatorio/sintese',
        debugPng: 'relatorio_sintese_debug.png',
        png: 'relatorio_sintese.png',
        pdf: 'relatorio_sintese.pdf'
      },
      {
        name: 'ativos',
        route: '/relatorio/ativos',
        debugPng: 'relatorio_ativos_debug.png',
        png: 'relatorio_ativos.png',
        pdf: 'relatorio_ativos.pdf'
      },
      {
        name: 'cursos',
        route: '/relatorio/cursos',
        debugPng: 'relatorio_cursos_debug.png',
        png: 'relatorio_cursos.png',
        pdf: 'relatorio_ensino.pdf'
      },
      {
        name: 'cadeias',
        route: '/relatorio/cadeias',
        debugPng: 'relatorio_cadeias_debug.png',
        png: 'relatorio_cadeias.png',
        pdf: 'relatorio_cadeias.pdf'
      }
    ];

    try {
      for (const rep of reports) {
        console.log(`\n>>> Capturando ${rep.name.toUpperCase()} (${rep.route})...`);
        const result = await captureReportWithPlaywright({
          route: rep.route,
          pngPath: rep.debugPng,
          pdfPath: rep.pdf,
          browserInstance: browser
        });

        // Cria também a cópia padrão sem sufixo debug
        if (rep.png) {
          fs.copyFileSync(path.resolve(ROOT_DIR, rep.debugPng), path.resolve(ROOT_DIR, rep.png));
        }

        console.log(`✓ Concluído: ${rep.debugPng} e ${rep.pdf}`);
      }
      console.log('\n====================================================');
      console.log('Todos os 4 relatórios capturados com sucesso!');
      console.log('====================================================');
    } catch (err) {
      console.error('Erro na captura dos relatórios:', err);
      process.exit(1);
    } finally {
      await browser.close();
    }
  })();
}
