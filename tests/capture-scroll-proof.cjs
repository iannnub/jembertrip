const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

async function captureProof() {
  const browser = await chromium.launch({ headless: true });
  const screenshotsDir = path.resolve(__dirname, '../reports/production-testing-2026-09-29/screenshots');

  // 1. iPhone SE 375x667 Onboarding Scrolled
  const iphoneCtx = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    deviceScaleFactor: 2
  });
  const page = await iphoneCtx.newPage();
  await page.goto('https://jembertrip.vercel.app/onboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Select 3 categories
  const buttons = await page.$$('button[type="button"]');
  if (buttons.length >= 3) {
    await buttons[0].click();
    await buttons[1].click();
    await buttons[2].click();
  }
  await page.waitForTimeout(500);

  // Scroll down to show submit button
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight || 500));
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(screenshotsDir, 'onboarding-scrolled-iphone-se.png') });
  console.log('Saved onboarding-scrolled-iphone-se.png');

  // 2. Android 412x915 Onboarding Scrolled
  const androidCtx = await browser.newContext({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    deviceScaleFactor: 2
  });
  const pageAndroid = await androidCtx.newPage();
  await pageAndroid.goto('https://jembertrip.vercel.app/onboard', { waitUntil: 'networkidle' });
  await pageAndroid.waitForTimeout(1000);
  await pageAndroid.screenshot({ path: path.join(screenshotsDir, 'onboarding-android-412px.png') });
  console.log('Saved onboarding-android-412px.png');

  await browser.close();
}

captureProof().catch(console.error);
