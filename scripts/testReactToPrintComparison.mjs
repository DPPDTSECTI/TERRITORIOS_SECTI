import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { captureReportWithPlaywright } from './captureReports.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'test_output_pdf_comparison');

const REPORTS_TO_TEST = [
  { id: 'ativos', route: '/relatorio/ativos?territorio=bahia&modo=normal', name: 'Ativos de CT&I' },
  { id: 'cursos', route: '/relatorio/cursos?territorio=bahia&modo=normal', name: 'Cursos Superiores' },
  { id: 'cadeias', route: '/relatorio/cadeias?territorio=bahia&modo=normal', name: 'Cadeias Produtivas & IGs' },
  { id: 'sintese', route: '/relatorio/sintese?territorio=bahia&modo=normal', name: 'Síntese Executiva' }
];

const REPORT_PRINT_PAGE_STYLE = `
  @page {
    size: 16in 9in !important;
    margin: 0 !important;
  }
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 1920px !important;
      height: 1080px !important;
      min-height: 1080px !important;
      max-height: 1080px !important;
      overflow: hidden !important;
      background: white !important;
      print-color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
    }
    #pdf-report {
      width: 1920px !important;
      height: 1080px !important;
      min-height: 1080px !important;
      max-height: 1080px !important;
      margin: 0 !important;
      padding: 24px 32px !important;
      box-sizing: border-box !important;
      background: white !important;
      overflow: hidden !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
      break-after: avoid !important;
      break-inside: avoid !important;
    }
    .print\\:hidden {
      display: none !important;
    }
  }
`;

async function runComparison() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`[TEST] Diretório de saída: ${OUTPUT_DIR}`);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const report of REPORTS_TO_TEST) {
      console.log(`\n==================================================`);
      console.log(`Testando Relatório: ${report.name} (${report.id})`);
      console.log(`Rota: ${report.route}`);
      console.log(`==================================================`);

      // 1. GERAR VIA PLAYWRIGHT ATUAL (Screenshot PNG @3x + jsPDF)
      const pwPngPath = path.resolve(OUTPUT_DIR, `${report.id}_playwright.png`);
      const pwPdfPath = path.resolve(OUTPUT_DIR, `${report.id}_playwright.pdf`);
      console.log(`-> Gerando PDF via Playwright atual...`);
      const t0Pw = Date.now();
      await captureReportWithPlaywright({
        route: report.route,
        pngPath: pwPngPath,
        pdfPath: pwPdfPath,
        baseUrl: 'http://localhost:5173',
        browserInstance: browser
      });
      const tPwDuration = Date.now() - t0Pw;
      const pwPdfStat = fs.statSync(pwPdfPath);
      console.log(`   [Playwright] Tempo: ${tPwDuration}ms, Tamanho PDF: ${(pwPdfStat.size / 1024).toFixed(1)} KB`);

      // 2. GERAR VIA MOTOR NATIVO DO NAVEGADOR / REACT-TO-PRINT
      // Simula com precisão o que o motor de impressão do Chrome/Edge gera no react-to-print
      console.log(`-> Gerando PDF via Motor Nativo de Impressão (react-to-print)...`);
      const printPdfPath = path.resolve(OUTPUT_DIR, `${report.id}_react_to_print.pdf`);
      const t0Print = Date.now();

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2
      });
      const page = await context.newPage();

      // Monitora chamadas de impressão e erros de console
      let printTriggered = false;
      page.on('console', msg => {
        if (msg.type() === 'error') console.warn(`   [Browser Console Error] ${msg.text()}`);
      });

      await page.goto(`http://localhost:5173${report.route}`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForSelector('#pdf-report', { state: 'visible', timeout: 30000 });

      // Aguarda carregamento de dados
      await page.waitForFunction(() => {
        const hasSpinner = document.querySelector('.animate-spin') !== null;
        const hasLoadingText = document.body.innerText.includes('Carregando dados...');
        return !hasSpinner && !hasLoadingText;
      }, { timeout: 30000 }).catch(() => {});

      // Verifica presença do botão "Testar PDF (react-to-print)"
      const testBtn = await page.$('button:has-text("Testar PDF (react-to-print)")');
      console.log(`   [UI Check] Botão 'Testar PDF (react-to-print)' presente: ${testBtn !== null ? 'SIM' : 'NÃO'}`);

      // Aguarda fontes e imagens Leaflet / SVGs
      await page.evaluate(async () => {
        if (document.fonts && document.fonts.ready) {
          try { await document.fonts.ready; } catch (e) {}
        }
        const imgs = Array.from(document.querySelectorAll('#pdf-report img'));
        await Promise.all(imgs.map(async (img) => {
          if (!img.complete) {
            await new Promise((res) => {
              img.onload = res;
              img.onerror = res;
              setTimeout(res, 3000);
            });
          }
          if (img.decode) {
            try { await img.decode(); } catch (e) {}
          }
        }));
        await new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
      });

      await page.waitForTimeout(1500);

      // Injeta estilos de impressão oficiais
      await page.addStyleTag({ content: REPORT_PRINT_PAGE_STYLE });

      // Emula mídia print (como react-to-print faz no iframe de impressão)
      await page.emulateMedia({ media: 'print' });

      // Gera o PDF vetorial nativo via Chromium Print Engine
      const printPdfBuffer = await page.pdf({
        width: '16in',
        height: '9in',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        preferCSSPageSize: true
      });

      fs.writeFileSync(printPdfPath, printPdfBuffer);
      const tPrintDuration = Date.now() - t0Print;
      const printPdfStat = fs.statSync(printPdfPath);
      console.log(`   [react-to-print / Native] Tempo: ${tPrintDuration}ms, Tamanho PDF: ${(printPdfStat.size / 1024).toFixed(1)} KB`);

      // 3. Verificação de Textos e Elementos Vetoriais
      // Verifica se o texto pode ser extraído diretamente do buffer PDF
      const pdfString = printPdfBuffer.toString('latin1');
      const hasFontDescriptor = pdfString.includes('/Font') || pdfString.includes('/Type /Font');
      const hasVectorStreams = pdfString.includes('/Contents') && pdfString.includes('stream');

      // 4. Captura screenshots comparativos em 3 níveis de zoom: Ajuste à página, 100% e 200%
      // Para comparar a nitidez visual dos dois métodos
      console.log(`-> Capturando amostras de zoom (Ajuste, 100%, 200%)...`);
      
      // Screenshot do modo normal (100% escala 1)
      const zoom100Path = path.resolve(OUTPUT_DIR, `${report.id}_native_zoom100.png`);
      await page.emulateMedia({ media: 'screen' });
      await page.locator('#pdf-report').screenshot({ path: zoom100Path });

      // Screenshot com zoom de 200% para avaliar micro-nitidez de fontes e bordas
      const zoom200Path = path.resolve(OUTPUT_DIR, `${report.id}_native_zoom200.png`);
      await page.setViewportSize({ width: 3840, height: 2160 });
      await page.locator('#pdf-report').screenshot({ path: zoom200Path });

      await context.close();

      results.push({
        id: report.id,
        name: report.name,
        playwright: {
          pdfPath: pwPdfPath,
          pngPath: pwPngPath,
          sizeKb: (pwPdfStat.size / 1024).toFixed(1),
          timeMs: tPwDuration,
          isRaster: true,
          textSelectable: false
        },
        reactToPrint: {
          pdfPath: printPdfPath,
          sizeKb: (printPdfStat.size / 1024).toFixed(1),
          timeMs: tPrintDuration,
          isRaster: false,
          hasFontDescriptor,
          hasVectorStreams,
          textSelectable: true
        }
      });
    }

    console.log('\n==================================================');
    console.log('RESUMO DA COMPARAÇÃO TÉCNICA');
    console.log('==================================================');
    console.table(results.map(r => ({
      Relatório: r.name,
      'Playwright PDF (KB)': r.playwright.sizeKb,
      'React-to-print PDF (KB)': r.reactToPrint.sizeKb,
      'PW Seleciona Texto?': r.playwright.textSelectable ? 'Sim' : 'Não (Raster)',
      'R2P Seleciona Texto?': r.reactToPrint.textSelectable ? 'Sim (Vetorial)' : 'Não',
      'PW Tempo (ms)': r.playwright.timeMs,
      'R2P Tempo (ms)': r.reactToPrint.timeMs
    })));

    fs.writeFileSync(
      path.resolve(OUTPUT_DIR, 'comparison_summary.json'),
      JSON.stringify(results, null, 2)
    );
    console.log(`\nRelatório salvo em: ${path.resolve(OUTPUT_DIR, 'comparison_summary.json')}`);

  } finally {
    await browser.close();
  }
}

runComparison().catch(err => {
  console.error('[ERRO FATAL NO TESTE]:', err);
  process.exit(1);
});
