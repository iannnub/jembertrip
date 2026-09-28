const { test, expect } = require('@playwright/test');

test.describe('Performance & Image Loading', () => {
  test('should load all images on fresh device', async ({ page, context }) => {
    // Clear cache untuk simulate device baru
    await context.clearCookies();
    await page.goto('https://jembertrip.vercel.app/wisata');
    
    // Tunggu card load
    await page.waitForSelector('[data-testid="wisata-card"]', { timeout: 10000 });
    
    // Cek semua img naturalWidth > 0 (loaded)
    const images = await page.$$eval('img[alt*="Pantai"], img[alt*="Teluk"], img[alt*="Wisata"]', (imgs) => 
      imgs.map(img => ({
        src: img.src,
        loaded: img.naturalWidth > 0,
        alt: img.alt
      }))
    );
    
    console.log('Images:', images);
    
    // Assert minimal 80% gambar loaded
    const loadedCount = images.filter(i => i.loaded).length;
    const percentage = loadedCount / images.length;
    expect(percentage).toBeGreaterThan(0.8);
  });

  test('should have cache headers on images', async ({ page }) => {
    const response = await page.goto('https://numbness-afterglow-parade.ngrok-free.dev/images/teluk-love.webp');
    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toContain('max-age');
  });
});
