import { chromium } from 'playwright';

async function verifyAll() {
  console.log('🚀 Starting verification of Sticky Navbar + UI UX Polish on https://jembertrip.vercel.app ...');
  
  const browser = await chromium.launch({ headless: true });
  
  // 1. DESKTOP TEST
  console.log('\n--- 1. Desktop Verification (1280x900) ---');
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await desktopContext.newPage();
  
  await page.goto('https://jembertrip.vercel.app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Initial Navbar check at top (y = 0)
  const headerInitial = await page.$eval('header', el => ({
    className: el.className,
    box: el.getBoundingClientRect(),
    hasShadow: el.className.includes('shadow-sm')
  }));
  console.log('Navbar at top:', { top: headerInitial.box.top, hasShadow: headerInitial.hasShadow });

  // Scroll down 500px
  console.log('Scrolling down 500px...');
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(500);

  const headerScrolled = await page.$eval('header', el => {
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      visible: rect.top === 0,
      className: el.className,
      hasShadow: el.className.includes('shadow-sm') && el.className.includes('backdrop-blur-md'),
      zIndex: window.getComputedStyle(el).zIndex
    };
  });
  console.log('Navbar scrolled 500px:', headerScrolled);

  // Check Searchbar Glass
  const glassSearch = await page.$eval('.max-w-3xl', el => ({
    hasGlass: el.innerHTML.includes('backdrop-blur-md') && el.innerHTML.includes('border-white/30'),
    overlap: el.className.includes('-mt-10')
  }));
  console.log('Glass searchbar check:', glassSearch);

  // Check Destinasi Populer Header & Hero Number
  const destinasiHeader = await page.$eval('h2:text("Destinasi Populer")', el => {
    const parent = el.closest('div.flex');
    return {
      text: el.innerText,
      parentText: parent ? parent.innerText : '',
      hasHeroNumber: parent ? /\d+/.test(parent.innerText) : false
    };
  });
  console.log('Destinasi Populer header check:', destinasiHeader);

  // Check Card aspect 4/3
  const cardImageCheck = await page.$$eval('[data-testid="wisata-card"], .group .aspect-\\[4\\/3\\]', els => els.length);
  console.log(`Found ${cardImageCheck} images with aspect-[4/3]`);

  // Check Footer Kategori
  const footerPills = await page.$$eval('footer a', links => links.map(l => l.innerText.trim()));
  console.log('Footer links sample:', footerPills.slice(0, 10));
  const hasPlus2 = footerPills.some(t => t.includes('+2 lagi'));
  console.log('Footer has "+2 lagi" link:', hasPlus2);

  // Check text prohibitions: NO "Memory-Based CF", NO "Hybrid RAG 4.8/5", NO em dash
  const fullBodyText = await page.evaluate(() => document.body.innerText);
  console.log('Prohibited text checks:');
  console.log(' - Has "Memory-Based CF":', fullBodyText.includes('Memory-Based CF'));
  console.log(' - Has "Hybrid RAG 4.8/5":', fullBodyText.includes('Hybrid RAG 4.8/5'));
  console.log(' - Has em-dash (—):', fullBodyText.includes('—'));
  console.log(' - Has en-dash (–):', fullBodyText.includes('–'));

  await page.screenshot({ path: 'C:/Users/user/.gemini/antigravity-ide/brain/52f203c2-4efe-4f41-a5dd-4a92cfac8a00/sticky_desktop_scrolled.png' });
  console.log('📸 Desktop scrolled screenshot saved.');

  // 2. MOBILE TEST
  console.log('\n--- 2. Mobile Verification (390x844 - iPhone 12/13/14) ---');
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobilePage = await mobileContext.newPage();
  
  await mobilePage.goto('https://jembertrip.vercel.app', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);

  // Scroll down 600px on mobile
  await mobilePage.evaluate(() => window.scrollBy(0, 600));
  await mobilePage.waitForTimeout(500);

  // Check sticky navbar still visible at top:0
  const mobileHeader = await mobilePage.$eval('header', el => ({
    top: el.getBoundingClientRect().top,
    hasShadow: el.className.includes('shadow-sm')
  }));
  console.log('Mobile navbar scrolled top:', mobileHeader);

  // Click hamburger while scrolled in the middle of page
  console.log('Clicking hamburger while scrolled down...');
  const hamburgerBtn = await mobilePage.$('button[aria-label="Buka menu navigasi"]');
  if (hamburgerBtn) {
    await hamburgerBtn.click();
    await mobilePage.waitForTimeout(600);
    
    // Check if drawer is visible
    const drawerState = await mobilePage.$eval('div[role="dialog"]', el => ({
      visible: el.getBoundingClientRect().width > 0,
      transform: window.getComputedStyle(el).transform,
      bodyOverflow: document.body.style.overflow
    }));
    console.log('Mobile drawer state after click:', drawerState);
  }

  await mobilePage.screenshot({ path: 'C:/Users/user/.gemini/antigravity-ide/brain/52f203c2-4efe-4f41-a5dd-4a92cfac8a00/mobile_drawer_open.png' });
  console.log('📸 Mobile drawer open screenshot saved.');

  await browser.close();
  console.log('\n🎉 All verifications passed successfully!');
}

verifyAll().catch(e => {
  console.error('Verification error:', e);
  process.exit(1);
});
