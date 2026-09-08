import { chromium } from 'playwright';
import fs from 'fs';

async function testNativePrint() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('http://localhost:5173/relatorio/ativos?territorio=bahia&modo=normal', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Apply the corrected print styles:
  // 1. @page with exact 16:9 ratio (either 1920px 1080px, or 16in 9in with 100% width/height)
  // 2. html, body, and #pdf-report taking 100% width and height without overflow
  await page.addStyleTag({
    content: `
      @page {
        size: 1920px 1080px;
        margin: 0;
      }
      @media print {
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        html, body {
          width: 1920px !important;
          height: 1080px !important;
          min-width: 1920px !important;
          min-height: 1080px !important;
          max-width: 1920px !important;
          max-height: 1080px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #f8fafc !important;
        }
        #pdf-report {
          width: 1920px !important;
          height: 1080px !important;
          min-width: 1920px !important;
          min-height: 1080px !important;
          max-width: 1920px !important;
          max-height: 1080px !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          padding: 24px 32px !important;
        }
        .print\\:hidden, [data-html2canvas-ignore="true"] {
          display: none !important;
        }
      }
    `
  });

  // Emulate print media and take screenshot
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({ path: 'scripts/native_print_fixed.png' });
  console.log('Saved scripts/native_print_fixed.png');

  // Also generate PDF
  const pdfBuffer = await page.pdf({
    printBackground: true,
    preferCSSPageSize: true
  });
  fs.writeFileSync('scripts/native_print_fixed.pdf', pdfBuffer);
  console.log('Saved scripts/native_print_fixed.pdf, size:', pdfBuffer.length);

  await browser.close();
}

testNativePrint().catch(console.error);
