// frontend/tests/launch_verification.mjs
import { chromium } from 'playwright';

const PROD_URL = 'https://jembertrip.vercel.app';
const TIMEOUT = 30000;

async function runTests() {
  console.log('🚀 JemberTrip Launch Verification Suite\n');
  console.log(`Target: ${PROD_URL}\n`);
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ headless: true });
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  try {
    // TEST 1: GA4 Setup Verification
    console.log('\n📊 TEST 1: GA4 Analytics Setup');
    const page1 = await browser.newPage();
    await page1.goto(PROD_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    
    const hasGtag = await page1.evaluate(() => typeof window.gtag === 'function');
    const hasDataLayer = await page1.evaluate(() => Array.isArray(window.dataLayer));
    const dataLayerLength = await page1.evaluate(() => window.dataLayer?.length || 0);
    const htmlContent = await page1.content();
    const hasMeasurementId = (htmlContent.includes('gtag/js?id=G-') && !htmlContent.includes('%VITE_GA_MEASUREMENT_ID%')) || (hasGtag && hasDataLayer && dataLayerLength > 0);
    
    const ga4Pass = hasGtag && hasDataLayer && dataLayerLength > 0 && hasMeasurementId;
    results.tests.push({ name: 'GA4 Setup', pass: ga4Pass });
    
    console.log(`  gtag function: ${hasGtag ? '✅' : '❌'}`);
    console.log(`  dataLayer exists: ${hasDataLayer ? '✅' : '❌'}`);
    console.log(`  dataLayer events: ${dataLayerLength} ${dataLayerLength > 0 ? '✅' : '❌'}`);
    console.log(`  Measurement ID set: ${hasMeasurementId ? '✅' : '❌'}`);
    console.log(`  RESULT: ${ga4Pass ? '✅ PASS' : '❌ FAIL'}`);
    
    if (ga4Pass) results.passed++; else results.failed++;
    await page1.close();

    // TEST 2: Image Loading (Critical)
    console.log('\n🖼️  TEST 2: Image Loading (Incognito Simulation)');
    const context2 = await browser.newContext({ 
      viewport: { width: 1280, height: 900 },
      ignoreHTTPSErrors: true
    });
    const page2 = await context2.newPage();
    await page2.goto(PROD_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page2.waitForTimeout(2000);
    
    // Scroll down gradually to trigger lazy-loaded images
    await page2.evaluate(async () => {
      for (let i = 0; i < 8; i++) {
        window.scrollBy(0, 1000);
        await new Promise(r => setTimeout(r, 250));
      }
      window.scrollTo(0, 0);
    });
    await page2.waitForTimeout(2000);

    const imageStats = await page2.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const total = images.length;
      const loaded = images.filter(img => img.complete && img.naturalWidth > 0).length;
      const broken = images.filter(img => img.complete && img.naturalWidth === 0).length;
      const placeholders = images.filter(img => img.alt && img.alt.includes('Gambar tidak tersedia')).length;
      return { total, loaded, broken, placeholders };
    });
    
    const imagePass = imageStats.loaded > 20 && imageStats.broken === 0 && imageStats.placeholders === 0;
    results.tests.push({ name: 'Image Loading', pass: imagePass });
    
    console.log(`  Total images: ${imageStats.total}`);
    console.log(`  Loaded: ${imageStats.loaded} ${imageStats.loaded > 20 ? '✅' : '❌'}`);
    console.log(`  Broken: ${imageStats.broken} ${imageStats.broken === 0 ? '✅' : '❌'}`);
    console.log(`  Placeholders: ${imageStats.placeholders} ${imageStats.placeholders === 0 ? '✅' : '❌'}`);
    console.log(`  RESULT: ${imagePass ? '✅ PASS' : '❌ FAIL'}`);
    
    if (imagePass) results.passed++; else results.failed++;
    await context2.close();

    // TEST 3: Mobile Navbar & Drawer
    console.log('\n📱 TEST 3: Mobile Navbar & Drawer');
    const context3 = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page3 = await context3.newPage();
    await page3.goto(PROD_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    
    const hamburgerExists = await page3.locator('button[aria-label*="menu"], button[aria-label*="navigasi"], button:has(svg)').count() > 0;
    
    if (hamburgerExists) {
      await page3.locator('button[aria-label*="menu"], button[aria-label*="navigasi"]').first().click();
      await page3.waitForTimeout(500);
      
      const drawerVisible = await page3.evaluate(() => {
        const drawer = document.querySelector('[role="dialog"], [class*="drawer"], nav[class*="mobile"]');
        if (!drawer) return false;
        const style = window.getComputedStyle(drawer);
        return style.transform !== 'none' || style.display !== 'none';
      });
      
      const backdropExists = await page3.evaluate(() => {
        const backdrop = Array.from(document.querySelectorAll('div')).find(el => {
          const bg = window.getComputedStyle(el).backgroundColor;
          return bg.includes('rgba') && el.offsetWidth > 100 && el.offsetHeight > 100;
        });
        return !!backdrop;
      });
      
      const mobilePass = hamburgerExists && drawerVisible && backdropExists;
      results.tests.push({ name: 'Mobile Navbar', pass: mobilePass });
      
      console.log(`  Hamburger icon: ${hamburgerExists ? '✅' : '❌'}`);
      console.log(`  Drawer visible: ${drawerVisible ? '✅' : '❌'}`);
      console.log(`  Backdrop exists: ${backdropExists ? '✅' : '❌'}`);
      console.log(`  RESULT: ${mobilePass ? '✅ PASS' : '❌ FAIL'}`);
      
      if (mobilePass) results.passed++; else results.failed++;
    } else {
      console.log(`  Hamburger icon: ❌ NOT FOUND`);
      console.log(`  RESULT: ❌ FAIL`);
      results.tests.push({ name: 'Mobile Navbar', pass: false });
      results.failed++;
    }
    await context3.close();

    // TEST 4: Sticky Navbar on Scroll
    console.log('\n📌 TEST 4: Sticky Navbar on Scroll');
    const page4 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page4.goto(PROD_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    
    const initialTop = await page4.evaluate(() => {
      const header = document.querySelector('header, nav');
      return header ? header.getBoundingClientRect().top : -1;
    });
    
    await page4.evaluate(() => window.scrollBy(0, 500));
    await page4.waitForTimeout(500);
    
    const scrolledTop = await page4.evaluate(() => {
      const header = document.querySelector('header, nav');
      if (!header) return -1;
      const rect = header.getBoundingClientRect();
      const style = window.getComputedStyle(header);
      return { top: rect.top, position: style.position, hasShadow: style.boxShadow !== 'none' || header.className.includes('shadow-sm') };
    });
    
    const stickyPass = scrolledTop.top === 0 && scrolledTop.position === 'sticky' && scrolledTop.hasShadow;
    results.tests.push({ name: 'Sticky Navbar', pass: stickyPass });
    
    console.log(`  Initial top: ${initialTop}`);
    console.log(`  Scrolled top: ${scrolledTop.top} ${scrolledTop.top === 0 ? '✅' : '❌'}`);
    console.log(`  Position: ${scrolledTop.position} ${scrolledTop.position === 'sticky' ? '✅' : '❌'}`);
    console.log(`  Has shadow: ${scrolledTop.hasShadow ? '✅' : '❌'}`);
    console.log(`  RESULT: ${stickyPass ? '✅ PASS' : '❌ FAIL'}`);
    
    if (stickyPass) results.passed++; else results.failed++;
    await page4.close();

    // TEST 5: Bundle Size & Performance
    console.log('\n⚡ TEST 5: Bundle Size & Performance');
    const page5 = await browser.newPage();
    const responses = [];
    page5.on('response', async response => {
      if (response.url().includes('/assets/') && response.url().match(/\.(js|css)$/)) {
        let size = parseInt(response.headers()['content-length'] || 0);
        if (!size) {
          try {
            const buf = await response.body();
            size = buf.length;
          } catch (e) {}
        }
        responses.push({ url: response.url(), size });
      }
    });
    
    await page5.goto(PROD_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page5.waitForTimeout(2000);
    
    const totalSize = responses.reduce((sum, r) => sum + r.size, 0);
    const totalSizeKB = Math.round(totalSize / 1024);
    const mainJS = responses.find(r => r.url.includes('index-') && r.url.endsWith('.js'));
    const mainSizeKB = mainJS ? Math.round(mainJS.size / 1024) : 0;
    
    const perfPass = totalSizeKB < 600 && mainSizeKB < 350;
    results.tests.push({ name: 'Bundle Size', pass: perfPass });
    
    console.log(`  Total bundle: ${totalSizeKB} KB ${totalSizeKB < 600 ? '✅' : '❌'} (target < 600KB)`);
    console.log(`  Main JS: ${mainSizeKB} KB ${mainSizeKB < 350 ? '✅' : '❌'} (target < 350KB)`);
    console.log(`  RESULT: ${perfPass ? '✅ PASS' : '❌ FAIL'}`);
    
    if (perfPass) results.passed++; else results.failed++;
    await page5.close();

    // TEST 6: Chat AI Page Load
    console.log('\n💬 TEST 6: Chat AI Page Accessibility');
    const page6 = await browser.newPage();
    try {
      await page6.goto(`${PROD_URL}/chat`, { waitUntil: 'networkidle', timeout: TIMEOUT });
      await page6.waitForTimeout(2000);
      
      const chatPageContent = await page6.evaluate(() => {
        const hasInput = !!document.querySelector('input[placeholder*="Tanya"], textarea[placeholder*="Tanya"]');
        const hasGreeting = document.body.innerText.toLowerCase().includes('cak jember') || document.body.innerText.includes('Halo');
        return { hasInput, hasGreeting };
      });
      
      const chatPass = chatPageContent.hasInput && chatPageContent.hasGreeting;
      results.tests.push({ name: 'Chat AI Page', pass: chatPass });
      
      console.log(`  Input box exists: ${chatPageContent.hasInput ? '✅' : '❌'}`);
      console.log(`  Greeting message: ${chatPageContent.hasGreeting ? '✅' : '❌'}`);
      console.log(`  RESULT: ${chatPass ? '✅ PASS' : '❌ FAIL'}`);
      
      if (chatPass) results.passed++; else results.failed++;
    } catch (e) {
      console.log(`  Error loading /chat: ${e.message}`);
      console.log(`  RESULT: ❌ FAIL`);
      results.tests.push({ name: 'Chat AI Page', pass: false });
      results.failed++;
    }
    await page6.close();

  } catch (error) {
    console.error(`\n❌ Test suite error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Final Report
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 FINAL REPORT\n');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  const passRate = Math.round((results.passed / (results.passed + results.failed)) * 100);
  console.log(`Pass Rate: ${passRate}%`);
  
  console.log('\nTest Breakdown:');
  results.tests.forEach(t => {
    console.log(`  ${t.pass ? '✅' : '❌'} ${t.name}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🚦 GO/NO-GO DECISION:\n');
  
  if (passRate >= 85 && results.failed <= 1) {
    console.log('✅ GO LIVE - Production ready!');
    console.log('\nNext steps:');
    console.log('1. git tag -a v1.0.0-production -m "Launch 2026-09-28"');
    console.log('2. git push origin v1.0.0-production');
    console.log('3. Post announcement');
    return 0;
  } else {
    console.log('❌ NO-GO - Critical issues found');
    console.log('\nBlocking issues:');
    results.tests.filter(t => !t.pass).forEach(t => {
      console.log(`  - ${t.name}`);
    });
    console.log('\nAction required: Fix critical bugs before launch');
    return 1;
  }
}

runTests().then(code => process.exit(code));
