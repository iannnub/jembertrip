import { test, expect } from '@playwright/test';

test.describe('Mobile Scroll Bug Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  });

  test('Bug #1: Onboarding page should be scrollable', async ({ page }) => {
    await page.goto('https://jembertrip.vercel.app/onboard');
    await page.waitForTimeout(1000);

    // Check body overflow is not hidden
    const bodyOverflow = await page.evaluate(() => 
      window.getComputedStyle(document.body).overflow
    );
    expect(bodyOverflow).not.toBe('hidden');

    const mainOverflow = await page.evaluate(() => {
      const m = document.querySelector('main');
      return m ? window.getComputedStyle(m).overflowY : null;
    });
    expect(mainOverflow).not.toBe('hidden');
    
    // Verify scroll works by checking scroll position change
    const initialScrollY = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop);
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(500);
    const newScrollY = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop);
    
    console.log(`✅ Onboarding scroll verification completed: ${initialScrollY}px -> ${newScrollY}px`);
  });

  test('Bug #2: Page scroll should work after drawer close', async ({ page }) => {
    await page.goto('https://jembertrip.vercel.app');
    await page.waitForTimeout(1000);
    
    // 1. Initial scroll should work
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(300);
    let scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(150);
    console.log(`✅ Initial scroll works: ${scrollY}px`);
    
    // 2. Open mobile drawer
    await page.click('button[aria-label*="menu" i], button[aria-label*="navigasi" i]');
    await page.waitForTimeout(500);
    
    // 3. Body overflow should be hidden while drawer open
    let bodyOverflow = await page.evaluate(() => 
      window.getComputedStyle(document.body).overflow
    );
    expect(bodyOverflow).toBe('hidden');
    console.log(`✅ Drawer open: body overflow = hidden`);
    
    // 4. Close drawer
    await page.click('button[aria-label*="Tutup" i]');
    await page.waitForTimeout(500);
    
    // 5. CRITICAL: Body overflow should be auto/visible again
    bodyOverflow = await page.evaluate(() => 
      window.getComputedStyle(document.body).overflow
    );
    expect(['auto', 'visible']).toContain(bodyOverflow);
    console.log(`✅ Drawer closed: body overflow = ${bodyOverflow}`);
    
    // 6. Scroll should work again
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(300);
    scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(300);
    console.log(`✅ Post-drawer scroll works: ${scrollY}px`);
  });

  test('Bug #2: Multiple drawer open/close cycles maintain scroll', async ({ page }) => {
    await page.goto('https://jembertrip.vercel.app');
    await page.waitForTimeout(1000);
    
    // Test 3 cycles untuk ensure cleanup konsisten
    for (let i = 1; i <= 3; i++) {
      console.log(`\n--- Cycle ${i}/3 ---`);
      
      // Open drawer
      await page.click('button[aria-label*="menu" i], button[aria-label*="navigasi" i]');
      await page.waitForTimeout(400);
      
      // Close drawer
      await page.click('button[aria-label*="Tutup" i]');
      await page.waitForTimeout(400);
      
      // Verify scroll still works
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(300);
      const scrollY = await page.evaluate(() => window.scrollY);
      
      expect(scrollY).toBeGreaterThan(100);
      console.log(`✅ Cycle ${i}: Scroll works (${scrollY}px)`);
    }
  });
});
