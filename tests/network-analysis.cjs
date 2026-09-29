const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

async function analyzeNetwork() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const requests = [];

  page.on('response', response => {
    try {
      const req = response.request();
      const headers = response.headers();
      const contentLength = parseInt(headers['content-length'] || '0', 10);
      requests.push({
        url: response.url(),
        status: response.status(),
        type: req.resourceType(),
        size: contentLength,
        contentType: headers['content-type'] || ''
      });
    } catch (e) {}
  });

  console.log('Fetching network waterfall for https://jembertrip.vercel.app ...');
  const navStart = Date.now();
  await page.goto('https://jembertrip.vercel.app', { waitUntil: 'networkidle', timeout: 35000 });
  const navDuration = Date.now() - navStart;

  await browser.close();

  let totalBytes = 0;
  const byType = {};
  const jsBundles = [];
  const images = [];

  requests.forEach(r => {
    totalBytes += r.size;
    byType[r.type] = (byType[r.type] || 0) + r.size;
    if (r.type === 'script') {
      jsBundles.push({
        name: r.url.split('/').pop().split('?')[0] || r.url,
        sizeBytes: r.size,
        sizeKB: (r.size / 1024).toFixed(1) + ' KB'
      });
    }
    if (r.type === 'image') {
      images.push({
        name: r.url.split('/').pop().split('?')[0] || r.url,
        sizeBytes: r.size,
        sizeKB: (r.size / 1024).toFixed(1) + ' KB'
      });
    }
  });

  jsBundles.sort((a, b) => b.sizeBytes - a.sizeBytes);
  images.sort((a, b) => b.sizeBytes - a.sizeBytes);

  const report = {
    totalRequests: requests.length,
    totalTransferBytes: totalBytes,
    totalTransferMB: (totalBytes / (1024 * 1024)).toFixed(2) + ' MB',
    totalTransferKB: (totalBytes / 1024).toFixed(1) + ' KB',
    loadDurationMs: navDuration,
    byType: Object.fromEntries(
      Object.entries(byType).map(([k, v]) => [k, `${(v / 1024).toFixed(1)} KB`])
    ),
    jsBundles: jsBundles.slice(0, 10),
    topImages: images.slice(0, 10)
  };

  const outputPath = path.resolve(__dirname, '../reports/production-testing-2026-09-29/network-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log('Network analysis saved to', outputPath);
  console.log(JSON.stringify(report, null, 2));
}

analyzeNetwork().catch(console.error);
