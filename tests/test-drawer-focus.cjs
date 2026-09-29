const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

async function testDrawerFocus() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('https://jembertrip.vercel.app', { waitUntil: 'networkidle' });

  console.log('Clicking hamburger button...');
  const btn = await page.$('button[aria-label="Buka menu navigasi"]');
  await btn.click();
  await page.waitForTimeout(500);

  const drawer = await page.$('.fixed.inset-0');
  console.log('Drawer backdrop/panel found:', !!drawer);

  const steps = [];
  for (let i = 1; i <= 8; i++) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      return {
        tag: el.tagName.toLowerCase(),
        text: el.innerText ? el.innerText.trim().replace(/\s+/g, ' ').substring(0, 30) : '',
        ariaLabel: el.getAttribute('aria-label'),
        inDrawer: !!el.closest('.fixed')
      };
    });
    steps.push({ step: i, ...active });
    console.log(`Tab ${i}:`, active);
  }

  console.log('Testing Escape key to close drawer...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const drawerAfterEscape = await page.evaluate(() => !!document.querySelector('.fixed.inset-0'));
  console.log('Drawer still open after pressing Escape:', drawerAfterEscape);

  await browser.close();
  return { steps, closesOnEscape: !drawerAfterEscape };
}

testDrawerFocus().catch(console.error);
