# Performance Baseline - JemberTrip

## Metrics (28 Sep 2026)

### Before Optimization
- Lighthouse Performance: 65
- LCP: 4.2s
- FID: 180ms
- CLS: 0.25
- Bundle Size: 890KB (Entry JS: 767KB uncompressed)
- Image Format: JPEG/PNG uncompressed
- Cache: None
- Initial Device Load: Missing images (interstitial page error ERR_NGROK_6024 on ngrok endpoints)

### After Optimization
- Lighthouse Performance: > 85 (target)
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- Bundle Size: < 600KB (Entry JS reduced to 320KB, 103KB gzipped with vendor chunking)
- Image Format: WebP auto-conversion (LANCZOS resize, 85 quality)
- Cache: 1 year immutable (`Cache-Control: public, max-age=31536000, immutable`)
- Ngrok Interstitial Bypass: ProgressiveImage with custom header fetch blob decoding for direct rendering

## Image Loading Fix
- Device baru: semua gambar load dengan absolute HTTPS URL & header bypass
- Retry logic: 2x dengan exponential backoff dan fallback multi-CDN
- Progressive loading: blur-up placeholder saat image dimuat
- Lazy loading: Intersection Observer dengan skeleton fallback

## Bundle Optimization
- Code splitting: `react-vendor`, `ui-vendor`, `markdown-vendor`, dan dynamic route imports
- Lazy routes: `RekomendasiPage`, `ProfilePage`, `AdminDashboard`, `LoginPage`, `RegisterPage`
- Tree shaking: pembersihan chunk yang tidak terpakai

## Cache Strategy
- Static assets (`/uploads/*`, `/images/*`): 1 year immutable
- API response: `no-cache, no-store, must-revalidate`
- Preconnect: backend ngrok + avatar CDN (ui-avatars, dicebear)

## Monitoring
- Web Vitals: logged di console browser development (LCP, FID, CLS)
- Playwright: test suite untuk image loading di tests/performance.spec.js
- Performance test monitoring

## Next Steps
- [ ] Implement Service Worker untuk offline PWA support
- [ ] Add Brotli compression di backend
- [ ] Batch script untuk migrasi image warisan ke WebP
- [ ] Setup dedicated CDN (Cloudflare) untuk image storage
