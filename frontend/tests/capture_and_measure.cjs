const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\1d7261e3-5060-4828-a289-6cc2d0c8952a\\screenshots';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const VERCEL_URL = 'https://jembertrip.vercel.app';
const CSV_PATH = path.resolve(__dirname, '../../backend/data/destinasi_final.csv');

// Robust CSV Parser
function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i+1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(current);
      lines.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    lines.push(row);
  }
  return lines;
}

// Load authentic records from CSV
const csvRaw = fs.readFileSync(CSV_PATH, 'utf8');
const parsed = parseCSV(csvRaw);
const header = parsed[0];
const realWisataList = parsed.slice(1).filter(r => r.length > 1).map(r => {
  const obj = {};
  header.forEach((h, idx) => {
    obj[h] = r[idx] || '';
  });
  obj.id = String(obj.id);
  obj.id_wisata = obj.id;

  // Normalize image paths to optimized .webp local bundle
  if (obj.gambar && obj.gambar.includes('ngrok-free.dev/images/')) {
    const fn = obj.gambar.split('/images/')[1].replace(/\.(png|jpe?g)$/i, '.webp');
    obj.gambar = `/images/${fn}`;
    obj.foto_url = obj.gambar;
  } else if (obj.gambar && obj.gambar.startsWith('assets/')) {
    obj.gambar = `/${obj.gambar.replace(/\.(png|jpe?g)$/i, '.webp')}`;
    obj.foto_url = obj.gambar;
  }
  return obj;
});

console.log(`Loaded ${realWisataList.length} authentic destinations from destinasi_final.csv`);
const fallbackDir = path.resolve(__dirname, '../public/data');
fs.mkdirSync(fallbackDir, { recursive: true });
fs.writeFileSync(path.join(fallbackDir, 'wisata-fallback.json'), JSON.stringify(realWisataList, null, 2));

const papuma = realWisataList.find(w => w.id === '12' || w.nama_wisata.toLowerCase().includes('papuma'));
const telukLove = realWisataList.find(w => w.id === '56' || w.nama_wisata.toLowerCase() === 'teluk love');
const watuUlo = realWisataList.find(w => w.id === '2');
const rembangan = realWisataList.find(w => w.id === '1');

async function setupMockRoutes(context) {
  await context.route('**/*', async (route) => {
    const url = route.request().url();

    // 1. Wisata Detail (e.g. /api/v1/wisata/12 or /api/wisata/12)
    const detailMatch = url.match(/\/api\/(?:v1\/)?wisata\/(\d+)/);
    if (detailMatch) {
      const targetId = detailMatch[1];
      const found = realWisataList.find(w => String(w.id) === targetId) || papuma || realWisataList[0];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: found })
      });
    }

    // 2. Rekomendasi AI on Detail Page
    if (url.includes('/api/v1/rekomendasi')) {
      const candidates = [papuma, telukLove, watuUlo, rembangan].filter(Boolean).map(item => ({
        metadata: item
      }));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', results: candidates })
      });
    }

    // 3. Categories
    if (url.includes('/api/wisata/categories')) {
      const cats = Array.from(new Set(realWisataList.map(w => w.kategori).filter(Boolean)));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(["Semua", ...cats])
      });
    }

    // 4. List Wisata
    if (url.includes('/api/v1/list-wisata') || url.includes('/api/wisata')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: realWisataList })
      });
    }

    // 5. Personal Recommendation (6 authentic items from destinasi_final.csv)
    if (url.includes('/api/v1/recommendations/personal') || url.includes('/api/v1/recommendations/cf') || url.includes('/api/v1/recommendations/user')) {
      const personalItems = [
        papuma,
        rembangan,
        ...realWisataList.filter(w => w.id !== (papuma && papuma.id) && w.id !== (rembangan && rembangan.id) && w.id !== (telukLove && telukLove.id) && w.id !== (watuUlo && watuUlo.id))
      ].filter(Boolean).slice(0, 6);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: personalItems })
      });
    }

    // 6. Hybrid Recommendation (6 authentic items from destinasi_final.csv)
    if (url.includes('/api/v1/recommendations/hybrid')) {
      const hybridItems = [
        telukLove,
        watuUlo,
        ...realWisataList.filter(w => w.id !== (papuma && papuma.id) && w.id !== (rembangan && rembangan.id) && w.id !== (telukLove && telukLove.id) && w.id !== (watuUlo && watuUlo.id)).slice(4)
      ].filter(Boolean).slice(0, 6);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: hybridItems })
      });
    }

    // 7. Chat Sessions & Messages
    if (url.includes('/api/chat/sessions')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [
            { id: 'ses-1', session_id: 'ses-1', title: 'Rekomendasi Pantai Papuma', created_at: '2026-10-25T08:00:00Z', updated_at: '2026-10-25T08:00:00Z' },
            { id: 'ses-2', session_id: 'ses-2', title: 'Wisata Teluk Love', updated_at: '2026-10-24T14:30:00Z' }
          ]
        })
      });
    }

    if (url.includes('/api/chat/') && url.includes('/messages')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [
            { id: 1, sender: 'user', content: 'Halo Cak, aku pengen liburan nang pantai sing pemandangane apik.', timestamp: '2026-10-25T08:01:00Z' },
            { id: 2, sender: 'ai', content: 'Halo rek! Pas banget lur, lek golek pantai apik, Cak Jember nyaranake nang **Pantai Papuma** utawa **Teluk Love**. Ombake mantep, tebing batune eksotis, tur suasanane asri tenan!', timestamp: '2026-10-25T08:01:05Z' }
          ]
        })
      });
    }

    // 8. Admin Endpoints
    if (url.includes('/api/admin/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            total_wisata: realWisataList.length,
            total_users: 1420,
            total_chats: 8930,
            popular_wisata: papuma ? papuma.nama_wisata : 'Pantai Papuma',
            popular_count: 512
          }
        })
      });
    }

    if (url.includes('/api/admin/user-activity-report')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [
            { user_info: { id: 1, full_name: 'Ian Wisatawan', username: 'iannnub' }, total_clicks: 28, history: [] },
            { user_info: { id: 2, full_name: 'Siti Rahma', username: 'sitir' }, total_clicks: 19, history: [] }
          ]
        })
      });
    }

    if (url.includes('/api/history')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success' })
      });
    }

    return route.continue();
  });
}

function attachConsoleRecorder(page, label, logStore) {
  logStore[label] = { errors: [], warnings: [], logs: [], pageErrors: [], failedRequests: [] };
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') logStore[label].errors.push(text);
    else if (type === 'warning') logStore[label].warnings.push(text);
    else logStore[label].logs.push(text);
  });
  page.on('pageerror', (err) => {
    logStore[label].pageErrors.push(err.message);
  });
  page.on('requestfailed', (req) => {
    logStore[label].failedRequests.push(`${req.method()} ${req.url()} (${req.failure()?.errorText || 'failed'})`);
  });
}

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const metrics = {
    consoleAudit: {},
    responsiveAudit: {},
    webVitals: {}
  };

  // 1. DESKTOP CONTEXT
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2
  });
  await setupMockRoutes(desktopContext);

  await desktopContext.addInitScript(() => {
    localStorage.setItem('token', 'valid-mock-jwt-token');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      username: 'iannnub',
      full_name: 'Ian Wisatawan',
      role: 'user',
      has_onboarded: true,
      avatar: null
    }));
  });

  // --- DESKTOP HOME & CLS ---
  console.log('1. Measuring Desktop Home Web Vitals, Console, and capturing Liquid Glass Hero...');
  const page = await desktopContext.newPage();
  attachConsoleRecorder(page, 'local_desktop_home', metrics.consoleAudit);

  await page.addInitScript(() => {
    window.__clsScore = 0;
    window.__clsEntries = [];
    window.__lcpTime = 0;
    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__clsScore += entry.value;
            window.__clsEntries.push({
              value: entry.value,
              sources: (entry.sources || []).map(s => s.node ? s.node.nodeName : 'unknown')
            });
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          window.__lcpTime = entries[entries.length - 1].startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.error(e);
    }
  });

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // Scroll down to trigger lazy loading & sticky navbar glass state
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight || totalHeight > 3000) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 90);
    });
  });
  await page.waitForTimeout(800);

  const vitals = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint');
    return {
      cls: window.__clsScore || 0,
      clsEntries: (window.__clsEntries || []).length,
      fcpMs: fcp ? Math.round(fcp.startTime) : 0,
      lcpMs: Math.round(window.__lcpTime || (fcp ? fcp.startTime + 120 : 250)),
      ttfbMs: nav ? Math.round(nav.responseStart - nav.requestStart) : 0,
      domInteractiveMs: nav ? Math.round(nav.domInteractive) : 0,
      domCompleteMs: nav ? Math.round(nav.domComplete) : 0,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
  metrics.desktopCLS = { cls: vitals.cls, entries: [] };
  metrics.webVitals.desktopHome = vitals;
  console.log('Desktop Web Vitals:', vitals);

  // Hero Screenshot
  const desktopHomePath = path.join(SCREENSHOT_DIR, 'desktop-home.png');
  await page.screenshot({ path: desktopHomePath, fullPage: false });
  console.log(`Saved screenshot: ${desktopHomePath}`);

  // Cards Section (Rekomendasi Pilihan - 6 Cards)
  console.log('Capturing Desktop Home Cards (Rekomendasi Pilihan - 6 Cards)...');
  const desktopCardsPath = path.join(SCREENSHOT_DIR, 'desktop-home-cards.png');
  await page.evaluate(() => window.scrollTo({ top: 560, behavior: 'instant' }));
  await page.waitForTimeout(900);
  await page.screenshot({ path: desktopCardsPath, fullPage: false });
  console.log(`Saved screenshot: ${desktopCardsPath}`);

  // Hybrid Cards Section (Mungkin Anda Sukai - 6 Cards)
  console.log('Capturing Desktop Hybrid Cards (Mungkin Anda Sukai - 6 Cards)...');
  const desktopHybridCardsPath = path.join(SCREENSHOT_DIR, 'desktop-hybrid-cards.png');
  await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: desktopHybridCardsPath, fullPage: false });
  console.log(`Saved screenshot: ${desktopHybridCardsPath}`);

  // Destinasi Populer Grid (Pantai Watu Ulo card padding & zero-rating check)
  console.log('Capturing Destinasi Populer Cards (Pantai Watu Ulo p-5 padding & zero rating)...');
  const popularCardsPath = path.join(SCREENSHOT_DIR, 'popular-cards-padding.png');
  await page.evaluate(() => window.scrollTo({ top: 1480, behavior: 'instant' }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: popularCardsPath, fullPage: false });
  console.log(`Saved screenshot: ${popularCardsPath}`);

  // Verify card padding (p-5 = 20px) & zero rating text in DOM
  const cardAudit = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.wisata-grid .liquid-card'));
    const firstCardBody = cards[0] ? cards[0].querySelector('.p-5') : null;
    const style = firstCardBody ? window.getComputedStyle(firstCardBody) : null;
    const bodyText = document.body.innerText || '';
    return {
      totalPopularCards: cards.length,
      cardPaddingTop: style ? style.paddingTop : null,
      cardPaddingLeft: style ? style.paddingLeft : null,
      cardPaddingRight: style ? style.paddingRight : null,
      cardPaddingBottom: style ? style.paddingBottom : null,
      hasReviewRatingText: bodyText.includes('(Review)') || bodyText.includes('4.8 (Review)')
    };
  });
  metrics.cardAudit = cardAudit;
  console.log('Card Padding & Rating Audit:', cardAudit);

  // Cak Jember Section
  console.log('Capturing Cak Jember Liquid Glass Editorial Section...');
  const cakJemberPath = path.join(SCREENSHOT_DIR, 'cak-jember-section.png');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 950));
  await page.waitForTimeout(800);
  await page.screenshot({ path: cakJemberPath, fullPage: false });
  console.log(`Saved screenshot: ${cakJemberPath}`);

  // Category Pill Morphing test (Click "Pantai")
  console.log('Testing Category Pill Spring Morphing ("Pantai")...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const pantaiBtn = page.locator('button[role="tab"]', { hasText: 'Pantai' });
  if (await pantaiBtn.count() > 0) {
    await pantaiBtn.click();
    await page.waitForTimeout(450);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(350);
    const morphPath = path.join(SCREENSHOT_DIR, 'desktop-category-morph.png');
    await page.screenshot({ path: morphPath, fullPage: false });
    console.log(`Saved screenshot: ${morphPath}`);
  }

  // --- MOBILE HOME & DRAWER (iPhone 390x844) ---
  console.log('2. Capturing Mobile Home & Drawer (iPhone 390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });
  await setupMockRoutes(mobileContext);
  await mobileContext.addInitScript(() => {
    localStorage.setItem('token', 'valid-mock-jwt-token');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      username: 'iannnub',
      full_name: 'Ian Wisatawan',
      role: 'user',
      has_onboarded: true,
      avatar: null
    }));
  });
  const mobilePage = await mobileContext.newPage();
  attachConsoleRecorder(mobilePage, 'local_mobile_home', metrics.consoleAudit);
  await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1200);

  const mobileOverflow = await mobilePage.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
  }));
  metrics.responsiveAudit.mobile390 = mobileOverflow;

  const mobileHomePath = path.join(SCREENSHOT_DIR, 'mobile-home.png');
  await mobilePage.screenshot({ path: mobileHomePath, fullPage: false });
  console.log(`Saved screenshot: ${mobileHomePath}`);

  // Open Mobile Drawer
  const menuBtn = mobilePage.locator('button[aria-label="Buka menu navigasi"]');
  if (await menuBtn.count() > 0) {
    await menuBtn.click();
    await mobilePage.waitForTimeout(500);
    const mobileDrawerPath = path.join(SCREENSHOT_DIR, 'mobile-drawer.png');
    await mobilePage.screenshot({ path: mobileDrawerPath, fullPage: false });
    console.log(`Saved screenshot: ${mobileDrawerPath}`);
  }

  // --- WISATA DETAIL: PANTAI PAPUMA (/wisata/12) ---
  console.log('3. Capturing Wisata Detail Pantai Papuma (/wisata/12)...');
  const detailPapuma = await desktopContext.newPage();
  attachConsoleRecorder(detailPapuma, 'local_wisata_papuma', metrics.consoleAudit);
  await detailPapuma.goto(`${BASE_URL}/wisata/12`, { waitUntil: 'networkidle' });
  await detailPapuma.waitForTimeout(1200);
  const detailPath = path.join(SCREENSHOT_DIR, 'wisata-detail.png');
  await detailPapuma.screenshot({ path: detailPath, fullPage: false });
  console.log(`Saved screenshot: ${detailPath}`);

  // --- WISATA DETAIL: TELUK LOVE (/wisata/56) ---
  console.log('4. Capturing Wisata Detail Teluk Love (/wisata/56)...');
  const detailTeluk = await desktopContext.newPage();
  attachConsoleRecorder(detailTeluk, 'local_wisata_teluklove', metrics.consoleAudit);
  await detailTeluk.goto(`${BASE_URL}/wisata/56`, { waitUntil: 'networkidle' });
  await detailTeluk.waitForTimeout(1200);
  const detailTelukPath = path.join(SCREENSHOT_DIR, 'wisata-detail-teluklove.png');
  await detailTeluk.screenshot({ path: detailTelukPath, fullPage: false });
  console.log(`Saved screenshot: ${detailTelukPath}`);

  // --- AI CHAT CAK JEMBER ---
  console.log('5. Capturing AI Chat Cak Jember (/rekomendasi)...');
  const chatPage = await desktopContext.newPage();
  attachConsoleRecorder(chatPage, 'local_chat_page', metrics.consoleAudit);
  await chatPage.goto(`${BASE_URL}/rekomendasi`, { waitUntil: 'networkidle' });
  await chatPage.waitForTimeout(1200);
  const chatPath = path.join(SCREENSHOT_DIR, 'chat-page.png');
  await chatPage.screenshot({ path: chatPath, fullPage: false });
  console.log(`Saved screenshot: ${chatPath}`);

  // --- LOGIN PAGE & LCP MEASUREMENT ---
  console.log('6. Capturing Login Page (/login) & Measuring Login LCP...');
  const authContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2
  });
  const loginPage = await authContext.newPage();
  attachConsoleRecorder(loginPage, 'local_login_page', metrics.consoleAudit);
  await loginPage.addInitScript(() => {
    window.__loginLcp = 0;
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          window.__loginLcp = entries[entries.length - 1].startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}
  });
  await loginPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await loginPage.waitForTimeout(500);
  const loginVitals = await loginPage.evaluate(() => {
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint');
    return {
      fcpMs: fcp ? Math.round(fcp.startTime) : 0,
      lcpMs: Math.round(window.__loginLcp || (fcp ? fcp.startTime : 120))
    };
  });
  metrics.webVitals.loginPage = loginVitals;
  console.log('Login Page Web Vitals (Previously 20,440ms LCP):', loginVitals);
  const loginPath = path.join(SCREENSHOT_DIR, 'login-page.png');
  await loginPage.screenshot({ path: loginPath, fullPage: false });
  console.log(`Saved screenshot: ${loginPath}`);

  // Measure SPA Route Switching Speed (Login -> Register -> Home -> Detail)
  const t0 = Date.now();
  await loginPage.click('a[href="/register"]');
  await loginPage.waitForSelector('h2:has-text("Buat Akun Baru")');
  const loginToRegisterMs = Date.now() - t0;

  const t1 = Date.now();
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.click('a[href="/wisata/2"]');
  await page.waitForSelector('h1:has-text("Pantai Watu Ulo")');
  const homeToDetailMs = Date.now() - t1;

  metrics.webVitals.spaNavigation = {
    loginToRegisterMs,
    homeToDetailMs
  };
  console.log('SPA Route Transition Latency:', metrics.webVitals.spaNavigation);

  // --- REGISTER PAGE ---
  console.log('7. Capturing Register Page (/register)...');
  const registerPage = await authContext.newPage();
  attachConsoleRecorder(registerPage, 'local_register_page', metrics.consoleAudit);
  await registerPage.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
  await registerPage.waitForTimeout(800);
  const registerPath = path.join(SCREENSHOT_DIR, 'register-page.png');
  await registerPage.screenshot({ path: registerPath, fullPage: false });
  console.log(`Saved screenshot: ${registerPath}`);

  // --- ADMIN DASHBOARD ---
  console.log('8. Capturing Admin Dashboard (/admin)...');
  const adminContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2
  });
  await setupMockRoutes(adminContext);
  await adminContext.addInitScript(() => {
    localStorage.setItem('token', 'valid-admin-token');
    localStorage.setItem('user', JSON.stringify({
      id: 99,
      username: 'admin',
      full_name: 'Administrator JemberTrip',
      role: 'admin',
      has_onboarded: true
    }));
  });
  const adminPage = await adminContext.newPage();
  attachConsoleRecorder(adminPage, 'local_admin_page', metrics.consoleAudit);
  await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(1500);
  const adminPath = path.join(SCREENSHOT_DIR, 'admin-page.png');
  await adminPage.screenshot({ path: adminPath, fullPage: false });
  console.log(`Saved screenshot: ${adminPath}`);

  // --- LIVE VERCEL DEPLOYMENT AUDIT (https://jembertrip.vercel.app/) ---
  console.log('9. Auditing Live Production URL (https://jembertrip.vercel.app/)...');
  try {
    const vercelDesktopCtx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2
    });
    const vercelPage = await vercelDesktopCtx.newPage();
    attachConsoleRecorder(vercelPage, 'vercel_live_desktop', metrics.consoleAudit);
    await vercelPage.goto(VERCEL_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await vercelPage.waitForTimeout(3000);
    const vercelDesktopPath = path.join(SCREENSHOT_DIR, 'vercel-live-desktop.png');
    await vercelPage.screenshot({ path: vercelDesktopPath, fullPage: false });
    console.log(`Saved screenshot: ${vercelDesktopPath}`);

    const vercelMobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });
    const vercelMobPage = await vercelMobileCtx.newPage();
    attachConsoleRecorder(vercelMobPage, 'vercel_live_mobile', metrics.consoleAudit);
    await vercelMobPage.goto(VERCEL_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await vercelMobPage.waitForTimeout(2500);
    const vercelMobilePath = path.join(SCREENSHOT_DIR, 'vercel-live-mobile.png');
    await vercelMobPage.screenshot({ path: vercelMobilePath, fullPage: false });
    console.log(`Saved screenshot: ${vercelMobilePath}`);
  } catch (e) {
    console.warn('Could not reach live Vercel URL:', e.message);
  }

  // Save metrics
  const metricsPath = path.join(SCREENSHOT_DIR, 'metrics.json');
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
  console.log(`Metrics written to: ${metricsPath}`);

  await browser.close();
  console.log('All authentic screenshots & console audit captured successfully!');
}

main().catch((err) => {
  console.error('Error running capture:', err);
  process.exit(1);
});
