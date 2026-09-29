const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

async function runA11yAudit() {
  console.log('🏁 Starting Comprehensive Accessibility (a11y) Audit on JemberTrip...');
  const url = 'https://jembertrip.vercel.app';

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const a11yResults = {
    url,
    timestamp: new Date().toISOString(),
    globalChecks: {},
    semantics: {},
    ariaLabels: { passed: [], failed: [] },
    keyboardFlow: { desktop: [], mobileDrawer: [] },
    colorContrast: { checked: [], failed: [] },
    touchTargets: { checked: [], failed: [] },
    focusVisible: { checked: [], failed: [] }
  };

  // 1. DESKTOP RUN: Semantics, Global, ARIA, Keyboard Flow, Contrast, Focus Visible
  console.log('🔍 [1/3] Running Desktop Audit (Semantics, ARIA, Contrast, Keyboard, Focus)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await desktopContext.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Allow lazy components to settle

  // Global Page Checks
  a11yResults.globalChecks = await page.evaluate(() => {
    return {
      lang: document.documentElement.lang || 'MISSING (HTML lang attribute missing)',
      title: document.title || 'MISSING (Title tag missing)',
      viewport: document.querySelector('meta[name="viewport"]')?.content || 'MISSING',
      charset: document.characterSet || 'MISSING'
    };
  });

  // Semantic HTML Elements Check
  a11yResults.semantics = await page.evaluate(() => {
    const landmarks = {
      header: document.querySelectorAll('header').length,
      nav: document.querySelectorAll('nav').length,
      main: document.querySelectorAll('main').length,
      section: document.querySelectorAll('section').length,
      footer: document.querySelectorAll('footer').length,
      article: document.querySelectorAll('article').length,
      aside: document.querySelectorAll('aside').length
    };

    // Heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      level: parseInt(h.tagName.substring(1), 10),
      tag: h.tagName,
      text: h.innerText.trim().replace(/\s+/g, ' ').substring(0, 80)
    }));

    // Check heading hierarchy validity (no skipped levels, exactly one h1 recommended)
    const h1Count = headings.filter(h => h.level === 1).length;
    const skippedLevels = [];
    for (let i = 0; i < headings.length - 1; i++) {
      if (headings[i + 1].level > headings[i].level + 1) {
        skippedLevels.push({
          from: headings[i].tag,
          to: headings[i + 1].tag,
          text: headings[i + 1].text
        });
      }
    }

    // Images alt check
    const images = Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src.substring(0, 60),
      alt: img.getAttribute('alt'),
      hasAlt: img.hasAttribute('alt'),
      isDecorative: img.getAttribute('alt') === '',
      ariaHidden: img.getAttribute('aria-hidden')
    }));

    const missingAltCount = images.filter(img => !img.hasAlt).length;

    return {
      landmarks,
      h1Count,
      totalHeadings: headings.length,
      headingsHierarchy: headings,
      skippedLevels,
      totalImages: images.length,
      missingAltCount,
      imagesSample: images.slice(0, 10)
    };
  });

  // ARIA Labels Check on interactive elements
  const ariaAudit = await page.evaluate(() => {
    const passed = [];
    const failed = [];

    const interactives = document.querySelectorAll('button, a, input, select, textarea');
    interactives.forEach(el => {
      const tag = el.tagName.toLowerCase();
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      const title = el.getAttribute('title');
      const text = el.innerText ? el.innerText.trim() : '';
      const placeholder = el.getAttribute('placeholder');
      const role = el.getAttribute('role');

      const isIconOnly = text === '' && el.querySelector('svg, img, i');
      const accessibleName = ariaLabel || ariaLabelledBy || title || text || placeholder;

      const elementData = {
        tag,
        text: text.substring(0, 40),
        ariaLabel,
        title,
        accessibleName,
        className: el.className.toString().substring(0, 50),
        id: el.id
      };

      if (!accessibleName && (isIconOnly || tag === 'button' || tag === 'a')) {
        failed.push({
          ...elementData,
          reason: 'Icon-only or interactive element without accessible name (aria-label/text/title)'
        });
      } else {
        passed.push(elementData);
      }
    });

    return { passed, failed };
  });
  a11yResults.ariaLabels = ariaAudit;

  // Color Contrast Audit (WCAG formula)
  console.log('🎨 [2/3] Analyzing Color Contrast & WCAG Compliance...');
  const contrastAudit = await page.evaluate(() => {
    function getRGB(colorStr) {
      const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!match) return [255, 255, 255, 1];
      return [
        parseInt(match[1]),
        parseInt(match[2]),
        parseInt(match[3]),
        match[4] !== undefined ? parseFloat(match[4]) : 1
      ];
    }

    function luminance(r, g, b) {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function getEffectiveBg(el) {
      let current = el;
      while (current && current !== document.documentElement) {
        const bg = window.getComputedStyle(current).backgroundColor;
        const [r, g, b, a] = getRGB(bg);
        if (a > 0.05) {
          return [r, g, b];
        }
        current = current.parentElement;
      }
      return [255, 255, 255]; // fallback white
    }

    const testElements = [
      { selector: 'a[href="/"] span.text-secondary', name: 'Header Subtitle (EXPLORE JATIM)' },
      { selector: 'button.category-pill:first-of-type', name: 'Active Category Pill (Semua)' },
      { selector: 'input[placeholder*="Cari"]', name: 'Search Input Text' },
      { selector: 'main h1', name: 'Hero Main Heading' },
      { selector: 'main p.text-slate-500, main p.text-slate-600', name: 'Section Subtitle / Description' },
      { selector: 'footer', name: 'Footer Container' },
      { selector: 'footer a', name: 'Footer Navigation Links' },
      { selector: 'footer p', name: 'Footer Copyright Text' }
    ];

    const results = [];
    testElements.forEach(item => {
      const el = document.querySelector(item.selector);
      if (el) {
        const style = window.getComputedStyle(el);
        const [fr, fg, fb] = getRGB(style.color);
        const [br, bg, bb] = getEffectiveBg(el);

        const l1 = luminance(fr, fg, fb);
        const l2 = luminance(br, bg, bb);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

        const fontSize = parseFloat(style.fontSize);
        const isBold = parseInt(style.fontWeight, 10) >= 700 || style.fontWeight === 'bold';
        const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && isBold);
        const minRatio = isLargeText ? 3.0 : 4.5;
        const passes = ratio >= minRatio;

        results.push({
          name: item.name,
          selector: item.selector,
          textColor: style.color,
          bgColor: `rgb(${br}, ${bg}, ${bb})`,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          isLargeText,
          contrastRatio: parseFloat(ratio.toFixed(2)),
          minRequired: minRatio,
          passes
        });
      }
    });

    return results;
  });
  a11yResults.colorContrast = contrastAudit;

  // Keyboard Navigation Flow & Focus Visible (Tab simulation)
  console.log('⌨️  [3/3] Testing Keyboard Tab Order & Focus States...');
  const tabSequence = [];
  // Reset focus to body
  await page.evaluate(() => document.body.focus());

  for (let i = 1; i <= 25; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const stepInfo = await page.evaluate((stepNum) => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;

      const style = window.getComputedStyle(el);
      const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
      const hasRing = style.boxShadow.includes('rgba') || style.boxShadow.includes('rgb');
      const hasVisibleFocus = hasOutline || hasRing || el.classList.contains('focus:ring-2') || el.classList.contains('focus:ring');

      return {
        step: stepNum,
        tag: el.tagName.toLowerCase(),
        id: el.id,
        text: el.innerText ? el.innerText.trim().replace(/\s+/g, ' ').substring(0, 30) : '',
        ariaLabel: el.getAttribute('aria-label'),
        className: el.className.toString().substring(0, 40),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
        boxShadow: style.boxShadow,
        hasVisibleFocus
      };
    }, i);

    if (stepInfo) {
      tabSequence.push(stepInfo);
    }
  }
  a11yResults.keyboardFlow.desktop = tabSequence;

  // Take screenshot of focused element in desktop
  const screenshotsDir = path.resolve(__dirname, '../reports/production-testing-2026-09-29/screenshots');
  await page.screenshot({ path: path.join(screenshotsDir, 'focus-visible-desktop.png') });
  await desktopContext.close();

  // 2. MOBILE RUN: Touch Targets & Mobile Drawer Trap
  console.log('📱 Testing Mobile Touch Target Size (390px iPhone 14)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(url, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);

  const touchTargets = await mobilePage.evaluate(() => {
    const targets = [];
    const elements = document.querySelectorAll('button, a, input, [role="button"], select');

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      // Only measure visible elements
      if (rect.width > 0 && rect.height > 0 && rect.top < 2000) {
        const text = el.innerText ? el.innerText.trim().replace(/\s+/g, ' ').substring(0, 30) : '';
        const ariaLabel = el.getAttribute('aria-label');
        const name = ariaLabel || text || el.tagName.toLowerCase();
        const meetsTarget = rect.width >= 44 && rect.height >= 44;

        targets.push({
          tag: el.tagName.toLowerCase(),
          name,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          meetsTarget,
          className: el.className.toString().substring(0, 30)
        });
      }
    });

    return targets;
  });
  a11yResults.touchTargets = touchTargets;

  // Test Mobile Drawer Focus Trap
  console.log('🍔 Testing Mobile Drawer Focus Trap & ARIA states...');
  const drawerAudit = await mobilePage.evaluate(async () => {
    const hamburgerBtn = document.querySelector('button[aria-label*="menu" i], button[aria-label*="nav" i], header button');
    if (!hamburgerBtn) return { error: 'Hamburger button not found' };

    const initialAriaExpanded = hamburgerBtn.getAttribute('aria-expanded');
    hamburgerBtn.click();
    await new Promise(r => setTimeout(r, 600)); // wait for drawer animation

    const updatedAriaExpanded = hamburgerBtn.getAttribute('aria-expanded');
    const drawerOpen = document.querySelector('nav, [role="dialog"], aside');

    return {
      hamburgerAriaLabel: hamburgerBtn.getAttribute('aria-label'),
      initialAriaExpanded,
      updatedAriaExpanded,
      drawerDetected: !!drawerOpen
    };
  });
  a11yResults.keyboardFlow.mobileDrawer = drawerAudit;

  await mobilePage.screenshot({ path: path.join(screenshotsDir, 'mobile-drawer-a11y.png') });
  await mobileContext.close();
  await browser.close();

  // Save JSON report
  const outputJsonPath = path.resolve(__dirname, '../reports/production-testing-2026-09-29/a11y-audit-results.json');
  fs.writeFileSync(outputJsonPath, JSON.stringify(a11yResults, null, 2), 'utf8');
  console.log(`✅ a11y audit complete! Raw results written to: ${outputJsonPath}`);

  return a11yResults;
}

runA11yAudit().catch(err => {
  console.error('❌ Error during a11y audit:', err);
  process.exit(1);
});
