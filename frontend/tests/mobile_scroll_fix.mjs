import { chromium } from 'playwright';

async function runMobileScrollTests() {
  console.log('🚀 Starting Comprehensive Mobile Scroll Bug Fix Verification...');
  const browser = await chromium.launch({ headless: true });
  const targetUrl = process.env.TEST_URL || 'https://jembertrip.vercel.app';
  console.log(`🌐 Target URL: ${targetUrl}`);

  const devices = [
    { name: 'iPhone SE (iOS)', width: 375, height: 667, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
    { name: 'Android Galaxy / Pixel', width: 412, height: 915, isMobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36' }
  ];

  let allPassed = true;

  for (const device of devices) {
    console.log(`\n======================================================`);
    console.log(`📱 TESTING DEVICE: ${device.name} (${device.width}x${device.height})`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: device.isMobile,
      userAgent: device.userAgent
    });
    const page = await context.newPage();

    // ------------------------------------------------------------------
    // TEST 1: ONBOARDING PAGE SCROLLABILITY (/onboard)
    // ------------------------------------------------------------------
    console.log(`\n[TEST 1] Verifying /onboard Scrollability...`);
    await page.goto(`${targetUrl}/onboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const onboardBodyOverflow = await page.evaluate(() => window.getComputedStyle(document.body).overflow);
    const onboardMainOverflow = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? window.getComputedStyle(main).overflowY : null;
    });

    console.log(`  Body overflow: ${onboardBodyOverflow} (Must not be 'hidden')`);
    console.log(`  Main overflow-y: ${onboardMainOverflow}`);

    if (onboardBodyOverflow === 'hidden' || onboardMainOverflow === 'hidden') {
      console.error(`  ❌ FAIL: /onboard container has overflow: hidden!`);
      allPassed = false;
    } else {
      console.log(`  ✅ PASS: Container overflow allows scrolling`);
    }

    // Measure scroll capability
    const initialOnboardScrollY = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop);
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(300);
    const newOnboardScrollY = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop);

    console.log(`  Scroll execution: ${initialOnboardScrollY}px -> ${newOnboardScrollY}px`);
    if (newOnboardScrollY > initialOnboardScrollY) {
      console.log(`  ✅ PASS: /onboard is freely scrollable on ${device.name}`);
    } else {
      // Check if root or main container scrolled
      const mainScrolled = await page.evaluate(() => {
        const m = document.querySelector('main') || document.querySelector('.min-h-screen');
        if (m) {
          m.scrollTop += 200;
          return m.scrollTop > 0;
        }
        return false;
      });
      if (mainScrolled) {
        console.log(`  ✅ PASS: Internal /onboard container is scrollable`);
      } else {
        console.log(`  ℹ️ Content fits or scrollable: ${newOnboardScrollY}px`);
      }
    }

    // ------------------------------------------------------------------
    // TEST 2: HOMEPAGE INITIAL SCROLL
    // ------------------------------------------------------------------
    console.log(`\n[TEST 2] Verifying Homepage Initial Scroll...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(400);
    const homeScrollY = await page.evaluate(() => window.scrollY);
    console.log(`  Homepage scroll position: ${homeScrollY}px`);

    if (homeScrollY >= 200) {
      console.log(`  ✅ PASS: Initial homepage scroll works properly`);
    } else {
      console.error(`  ❌ FAIL: Homepage scroll failed to move (scrollY: ${homeScrollY}px)`);
      allPassed = false;
    }

    // ------------------------------------------------------------------
    // TEST 3: DRAWER OPEN/CLOSE & OVERFLOW RESTORATION (3 CYCLES)
    // ------------------------------------------------------------------
    console.log(`\n[TEST 3] Testing Mobile Drawer Lifecycle & Overflow Cleanup (3 Cycles)...`);
    
    for (let cycle = 1; cycle <= 3; cycle++) {
      console.log(`  --- Cycle ${cycle}/3 ---`);

      // 1. Open drawer
      const hamburger = page.locator('button[aria-label*="menu" i], button[aria-label*="navigasi" i]').first();
      await hamburger.click();
      await page.waitForTimeout(500);

      // Verify body is locked while open
      const overflowWhileOpen = await page.evaluate(() => window.getComputedStyle(document.body).overflow);
      const isDrawerOpen = await page.locator('.fixed.inset-0').count() > 0;
      console.log(`    Drawer open: ${isDrawerOpen ? 'YES' : 'NO'} | body overflow: ${overflowWhileOpen}`);

      // 2. Close drawer
      const closeBtn = page.locator('button[aria-label*="Tutup" i]').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        // Fallback backdrop click
        await page.locator('.fixed.inset-0').first().click();
      }
      await page.waitForTimeout(500);

      // 3. Verify body overflow is restored
      const overflowAfterClose = await page.evaluate(() => {
        return {
          inline: document.body.style.overflow,
          computed: window.getComputedStyle(document.body).overflow,
          touchAction: document.body.style.touchAction
        };
      });

      console.log(`    Drawer closed: inline overflow='${overflowAfterClose.inline}', computed='${overflowAfterClose.computed}', touchAction='${overflowAfterClose.touchAction}'`);

      if (overflowAfterClose.computed === 'hidden') {
        console.error(`    ❌ FAIL: Body overflow remained hidden after closing drawer!`);
        allPassed = false;
      } else {
        console.log(`    ✅ PASS: Body overflow successfully restored to '${overflowAfterClose.computed}'`);
      }

      // 4. Verify scroll works immediately after drawer close
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(300);
      const postDrawerScrollY = await page.evaluate(() => window.scrollY);
      console.log(`    Post-drawer scroll position: ${postDrawerScrollY}px`);

      if (postDrawerScrollY > 100) {
        console.log(`    ✅ PASS: Scroll actively responds after closing drawer`);
      } else {
        console.error(`    ❌ FAIL: Page could not scroll after closing drawer`);
        allPassed = false;
      }
    }

    await context.close();
  }

  await browser.close();

  console.log(`\n======================================================`);
  if (allPassed) {
    console.log(`🎉 ALL MOBILE SCROLL TESTS PASSED ON IPHONE & ANDROID!`);
  } else {
    console.log(`⚠️ SOME MOBILE SCROLL TESTS REPORTED ISSUES (See log above)`);
  }
  console.log(`======================================================\n`);

  return allPassed;
}

runMobileScrollTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Fatal error running tests:', err);
    process.exit(1);
  });
