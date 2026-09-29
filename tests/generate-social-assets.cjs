const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

async function captureSocialAssets() {
  const outputDir = path.resolve(__dirname, '../docs/social-assets');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Desktop Context (Retina quality: deviceScaleFactor 2)
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2
    });
    const desktopPage = await desktopContext.newPage();

    console.log('Capturing 01_homepage_hero...');
    await desktopPage.goto('https://jembertrip.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForTimeout(2000);
    await desktopPage.screenshot({
      path: path.join(outputDir, '01_homepage_hero.png'),
      fullPage: false
    });

    console.log('Capturing 02_cakjember_chat...');
    try {
      await desktopPage.goto('https://jembertrip.vercel.app/chat', { waitUntil: 'networkidle', timeout: 30000 });
      await desktopPage.waitForTimeout(2000);
      await desktopPage.screenshot({
        path: path.join(outputDir, '02_cakjember_chat.png'),
        fullPage: false
      });
    } catch (e) {
      console.warn('Chat screenshot fallback warning:', e.message);
    }

    console.log('Capturing 03_detail_wisata...');
    try {
      await desktopPage.goto('https://jembertrip.vercel.app/wisata/1', { waitUntil: 'networkidle', timeout: 30000 });
      await desktopPage.waitForTimeout(2000);
      await desktopPage.screenshot({
        path: path.join(outputDir, '03_detail_wisata.png'),
        fullPage: false
      });
    } catch (e) {
      console.warn('Wisata detail screenshot fallback warning:', e.message);
    }

    await desktopContext.close();

    // 2. Mobile Context (iPhone 14)
    console.log('Capturing 04_mobile_view...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('https://jembertrip.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
    await mobilePage.waitForTimeout(2000);
    await mobilePage.screenshot({
      path: path.join(outputDir, '04_mobile_view.png'),
      fullPage: false
    });

    // Mobile Drawer Open
    console.log('Capturing 05_mobile_drawer...');
    try {
      const menuBtn = await mobilePage.$('button[aria-label*="menu" i], button:has(svg)');
      if (menuBtn) {
        await menuBtn.click();
        await mobilePage.waitForTimeout(500);
        await mobilePage.screenshot({
          path: path.join(outputDir, '05_mobile_drawer.png'),
          fullPage: false
        });
      }
    } catch (e) {
      console.warn('Mobile drawer open warning:', e.message);
    }

    await mobileContext.close();
    console.log('Social assets generated successfully in docs/social-assets/');
  } finally {
    await browser.close();
  }
}

captureSocialAssets().catch(err => {
  console.error('Error generating social assets:', err);
  process.exit(1);
});
