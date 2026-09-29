const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('https://jembertrip.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
    
    const content = await page.content();
    console.log('GitHub Link:', content.includes('github.com/iannnub'));
    console.log('Instagram Link:', content.includes('instagram.com/iannnub'));
    console.log('TikTok Link:', content.includes('tiktok.com/@iannnub'));
    console.log('LinkedIn Link:', content.includes('linkedin.com/in/iannnub'));

    const footer = await page.$('footer');
    if (footer) {
      await footer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.resolve(__dirname, '../docs/social-assets/verified_footer_social.png') });
      console.log('Footer screenshot saved successfully!');
    }
    await browser.close();
  } catch (err) {
    console.error('Error:', err);
  }
})();
