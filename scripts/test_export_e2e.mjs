import { chromium } from 'playwright';

async function testExportButton() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  await page.goto('http://localhost:5173/relatorio/sintese', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const exportBtn = page.locator('button:has-text("Exportar PDF")').first();
  console.log('Button found:', await exportBtn.count());

  // Setup download listener
  const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(e => null);

  await exportBtn.click();
  console.log('Export button clicked');

  const download = await downloadPromise;
  if (download) {
    const filename = download.suggestedFilename();
    console.log('Download triggered successfully! Filename:', filename);
    const path = await download.path();
    console.log('Downloaded file path:', path);
  } else {
    console.log('No download event, checking if completed...');
  }

  await page.waitForTimeout(2000);
  await browser.close();
}

testExportButton().catch(console.error);
