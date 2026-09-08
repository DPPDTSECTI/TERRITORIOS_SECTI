import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  await page.goto('http://localhost:5173/relatorio/sintese', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Run exportReportToPdf directly inside page context
  const res = await page.evaluate(async () => {
    try {
      const { exportReportToPdf } = await import('/src/utils/exportCanvasPdf.js');
      const el = document.getElementById('pdf-report');
      console.log('Found element #pdf-report:', !!el);
      await exportReportToPdf(el, 'relatorio_sintese_test.pdf', { scale: 2 });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message, stack: e.stack };
    }
  });

  console.log('Result of exportReportToPdf:', res);
  await browser.close();
}

test().catch(console.error);
