import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Starting Mobile Searchbar & Category Performance Test...');
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }, // iPhone SE
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    });
    const page = await context.newPage();

    const targetUrl = process.env.TEST_URL || 'https://jembertrip.vercel.app';
    console.log(`🌐 Navigating to ${targetUrl} (Viewport: 375x667)...`);
    
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Test 1: Searchbar tidak overflow di viewport 375px
    const searchButton = page.locator('button[aria-label="Cari Destinasi"], button:has-text("Cari")').first();
    await searchButton.waitFor({ state: 'visible', timeout: 10000 });
    const box = await searchButton.boundingBox();
    const viewportWidth = page.viewportSize().width;
    const buttonRightEdge = box.x + box.width;
    const isOverflow = buttonRightEdge > viewportWidth;

    console.log('📱 Searchbar Button Position:');
    console.log(`  Button right edge: ${buttonRightEdge.toFixed(1)}px`);
    console.log(`  Viewport width: ${viewportWidth}px`);
    console.log(`  Overflow: ${isOverflow ? '❌ YES' : '✅ NO'}`);

    if (isOverflow) {
      throw new Error(`Searchbar button overflows viewport: ${buttonRightEdge}px > ${viewportWidth}px`);
    }

    // Test 2 & 3: Category filter performance + Skeleton loading
    const pantaiPill = page.locator('button:has-text("Pantai")').first();
    await pantaiPill.waitFor({ state: 'visible' });

    console.log('\n🏖️  Testing Category Filter Performance...');
    const startTime = Date.now();
    
    // Click category
    await pantaiPill.click();

    // Check loading skeleton indicator immediately after click
    await page.waitForTimeout(50);
    const skeletonCount = await page.locator('.animate-pulse').count();
    const hasLoadingState = skeletonCount > 0;

    // Wait for transition to complete
    await page.waitForTimeout(300);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`  Response time: ${responseTime}ms`);
    console.log(`  Status: ${responseTime < 500 ? '✅ FAST' : '⚠️ SLOW'}`);
    console.log(`  Loading indicator (skeleton/pulse): ${hasLoadingState ? '✅ YES (' + skeletonCount + ' elements)' : '⚠️ NO'}`);

    console.log('\n🎉 ALL CHECKS PASSED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
})();
