const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

async function runProductionTestSuite() {
  const reportsDir = path.resolve(__dirname, '../reports/production-testing-2026-09-29');
  const screenshotsDir = path.join(reportsDir, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const results = {
    timestamp: new Date().toISOString(),
    url: 'https://jembertrip.vercel.app',
    consoleErrors: [],
    consoleWarnings: [],
    network: {
      totalRequests: 0,
      totalBytes: 0,
      byType: {},
      largestImages: [],
      jsBundles: [],
      slowestRequests: []
    },
    responsive: {},
    memoryTest: {}
  };

  console.log('🚀 [1/4] Starting Playwright Chrome session for Network, Console & Responsive tests...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-precise-memory-info', '--js-flags="--expose-gc"']
  });

  try {
    // -------------------------------------------------------------
    // TEST 2, 3, 4: NETWORK, CONSOLE ERRORS & RESPONSIVE SCREENSHOTS
    // -------------------------------------------------------------
    const viewports = [
      { name: '375px-mobile-iphone-se', width: 375, height: 667, isMobile: true },
      { name: '390px-mobile-iphone-14', width: 390, height: 844, isMobile: true },
      { name: '768px-tablet-ipad', width: 768, height: 1024, isMobile: false },
      { name: '1920px-desktop-fhd', width: 1920, height: 1080, isMobile: false }
    ];

    for (const vp of viewports) {
      console.log(`📸 Capturing viewport ${vp.name} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        deviceScaleFactor: 2
      });
      const page = await context.newPage();

      const requests = [];
      page.on('console', msg => {
        if (msg.type() === 'error') results.consoleErrors.push({ viewport: vp.name, text: msg.text() });
        if (msg.type() === 'warning') results.consoleWarnings.push({ viewport: vp.name, text: msg.text() });
      });
      page.on('pageerror', err => {
        results.consoleErrors.push({ viewport: vp.name, text: `PAGE ERROR: ${err.message}` });
      });

      page.on('response', async response => {
        try {
          const req = response.request();
          const timing = response.timing();
          let bodySize = 0;
          try {
            const buf = await response.body();
            bodySize = buf.length;
          } catch (e) {
            bodySize = parseInt(response.headers()['content-length'] || '0', 10);
          }

          requests.push({
            url: response.url(),
            status: response.status(),
            resourceType: req.resourceType(),
            size: bodySize,
            timing
          });
        } catch (e) {}
      });

      await page.goto('https://jembertrip.vercel.app', { waitUntil: 'networkidle', timeout: 35000 });
      await page.waitForTimeout(1500);

      const screenshotPath = path.join(screenshotsDir, `${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      results.responsive[vp.name] = {
        width: vp.width,
        height: vp.height,
        screenshot: `screenshots/${vp.name}.png`
      };

      // Simpan data network dari desktop run
      if (vp.name === '1920px-desktop-fhd') {
        results.network.totalRequests = requests.length;
        let totalBytes = 0;
        const byType = {};

        requests.forEach(r => {
          totalBytes += r.size;
          byType[r.resourceType] = (byType[r.resourceType] || 0) + r.size;
          if (r.resourceType === 'image') {
            results.network.largestImages.push({ url: r.url.substring(0, 100), sizeKB: (r.size / 1024).toFixed(1) });
          }
          if (r.resourceType === 'script') {
            results.network.jsBundles.push({ url: r.url.split('/').pop().split('?')[0], sizeKB: (r.size / 1024).toFixed(1) });
          }
        });

        results.network.totalBytes = totalBytes;
        results.network.totalKB = (totalBytes / 1024).toFixed(1);
        results.network.byType = Object.fromEntries(
          Object.entries(byType).map(([k, v]) => [k, `${(v / 1024).toFixed(1)} KB`])
        );

        results.network.largestImages.sort((a, b) => parseFloat(b.sizeKB) - parseFloat(a.sizeKB));
        results.network.largestImages = results.network.largestImages.slice(0, 5);
        results.network.jsBundles.sort((a, b) => parseFloat(b.sizeKB) - parseFloat(a.sizeKB));
      }

      await context.close();
    }

    // -------------------------------------------------------------
    // TEST 5: MEMORY LEAK AUDIT (DRAWER OPEN/CLOSE 20X)
    // -------------------------------------------------------------
    console.log('🧠 [2/4] Starting Memory Leak Test (20x Mobile Drawer toggle)...');
    const memContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true
    });
    const memPage = await memContext.newPage();
    const cdp = await memContext.newCDPSession(memPage);

    await memPage.goto('https://jembertrip.vercel.app', { waitUntil: 'networkidle', timeout: 35000 });
    await memPage.waitForTimeout(2000);

    // Initial memory
    const getHeapSize = async () => {
      const perf = await memPage.evaluate(() => {
        return window.performance && window.performance.memory ? window.performance.memory.usedJSHeapSize : null;
      });
      return perf;
    };

    const initialHeap = await getHeapSize();
    console.log(`  Initial JS Heap: ${(initialHeap / (1024 * 1024)).toFixed(2)} MB`);

    const samples = [{ iteration: 0, heapMB: (initialHeap / (1024 * 1024)).toFixed(2) }];

    for (let i = 1; i <= 20; i++) {
      // Buka drawer
      const hamburger = memPage.locator('button[aria-label*="menu" i], button:has(svg)').first();
      await hamburger.click();
      await memPage.waitForTimeout(100);

      // Tutup drawer
      const closeBtn = memPage.locator('button[aria-label*="tutup" i], button:has(svg.lucide-x)').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        // Fallback backdrop click
        await memPage.mouse.click(360, 20);
      }
      await memPage.waitForTimeout(100);

      if (i % 5 === 0) {
        const currentHeap = await getHeapSize();
        const heapMB = (currentHeap / (1024 * 1024)).toFixed(2);
        console.log(`  Iteration ${i}/20: Heap = ${heapMB} MB`);
        samples.push({ iteration: i, heapMB });
      }
    }

    // Tunggu garbage collection stabil
    await memPage.waitForTimeout(1000);
    const finalHeap = await getHeapSize();
    const finalHeapMB = (finalHeap / (1024 * 1024)).toFixed(2);
    const growthMB = ((finalHeap - initialHeap) / (1024 * 1024)).toFixed(2);
    const growthPercent = (((finalHeap - initialHeap) / initialHeap) * 100).toFixed(1);

    console.log(`  Final JS Heap: ${finalHeapMB} MB`);
    console.log(`  Memory Growth: ${growthMB} MB (${growthPercent}%)`);

    results.memoryTest = {
      iterations: 20,
      initialHeapMB: (initialHeap / (1024 * 1024)).toFixed(2),
      finalHeapMB,
      growthMB,
      growthPercent: `${growthPercent}%`,
      leakDetected: parseFloat(growthMB) > 3.0,
      samples
    };

    await memContext.close();
  } finally {
    await browser.close();
  }

  // Simpan hasil ke file JSON
  fs.writeFileSync(
    path.join(reportsDir, 'test-results.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log('✅ Automated test results saved to test-results.json');
  return results;
}

runProductionTestSuite().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
