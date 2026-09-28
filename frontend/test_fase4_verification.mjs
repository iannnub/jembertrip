import { chromium } from 'playwright';

async function verifyFase4() {
  console.log('--- FASE 4 VERIFICATION ---');
  
  // 1. Check live Vercel
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));

  console.log('Navigating to https://jembertrip.vercel.app ...');
  await page.goto('https://jembertrip.vercel.app', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Check window.gtag and window.dataLayer
  const gaCheck = await page.evaluate(() => {
    return {
      hasGtag: typeof window.gtag === 'function',
      hasDataLayer: Array.isArray(window.dataLayer),
      dataLayerLength: window.dataLayer ? window.dataLayer.length : 0,
      scripts: Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s.includes('googletagmanager'))
    };
  });
  console.log('GA4 Environment Check on Live:', gaCheck);

  // Trigger search on home page to test event
  const searchInput = await page.$('input[placeholder*="Cari pantai"]');
  if (searchInput) {
    await searchInput.fill('Papuma');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    console.log('Search triggered on page.');
  }

  // Check dataLayer events
  const dataLayerEvents = await page.evaluate(() => {
    return (window.dataLayer || []).map(item => {
      try {
        return Array.from(item);
      } catch (e) {
        return item;
      }
    });
  });
  console.log('DataLayer snapshot:', JSON.stringify(dataLayerEvents, null, 2));

  await browser.close();
  console.log('Browser check complete.');
}

verifyFase4().catch(e => {
  console.error('Verification error:', e);
  process.exit(1);
});
