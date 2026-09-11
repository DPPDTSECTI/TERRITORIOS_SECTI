import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  // Set sessionStorage to prevent Joyride tour from blocking the view
  await page.addInitScript(() => {
    sessionStorage.setItem('hasSeenTour', 'true');
    localStorage.setItem('hasSeenTour', 'true');
  });

  console.log('Navigating to http://localhost:5173/territorios...');
  await page.goto('http://localhost:5173/territorios', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  // Take normal mode screenshot
  const normalPath = path.join(ROOT_DIR, 'scratch', 'dashboard_normal.png');
  await page.screenshot({ path: normalPath, fullPage: false });
  console.log('Normal mode screenshot saved to:', normalPath);

  // Click on Semiárido toggle button if exists
  const semiaridoButton = page.locator('button:has-text("Semiárido"), button[title*="Semiárido"], button:has-text("Semiárido")').first();
  if (await semiaridoButton.count() > 0) {
    await semiaridoButton.click();
    await page.waitForTimeout(1200);
    const semiPath = path.join(ROOT_DIR, 'scratch', 'dashboard_semiarido.png');
    await page.screenshot({ path: semiPath, fullPage: false });
    console.log('Semiárido mode screenshot saved to:', semiPath);
  }

  await browser.close();
}

run().catch(console.error);
