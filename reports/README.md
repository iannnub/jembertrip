# 📊 JemberTrip Quality Assurance & Production Reports

Direktori ini digunakan untuk menyimpan seluruh laporan pengujian (*testing*), audit performa (*Lighthouse*), analisis jaringan (*network waterfall*), pengujian responsivitas, dan audit *memory leak* dari aplikasi **JemberTrip**.

---

## 📁 Struktur Direktori

Setiap sesi pengujian baru disimpan dalam subfolder dengan konvensi penamaan:
`reports/production-testing-YYYY-MM-DD/` atau `reports/audit-[nama-fitur]-YYYY-MM-DD/`

```plaintext
reports/
├── README.md                                    # Panduan & indeks arsip laporan
└── production-testing-2026-09-29/               # Sesi audit produksi 29 September 2026
    ├── PRODUCTION_TESTING_REPORT.md             # Laporan eksekutif & teknis lengkap
    ├── lighthouse-summary.json                  # Ringkasan skor & Core Web Vitals
    ├── lighthouse-report.report.html            # Laporan interaktif Lighthouse Mobile
    ├── lighthouse-report.report.json            # Data mentah Lighthouse Mobile
    ├── lighthouse-desktop-report.report.html    # Laporan interaktif Lighthouse Desktop
    ├── lighthouse-desktop-report.report.json    # Data mentah Lighthouse Desktop
    ├── network-analysis.json                    # Breakdown request, transfer size, & bundle
    ├── test-results.json                        # Log console error & memory leak test
    └── screenshots/                             # Tangkapan layar 4 viewport
        ├── 375px-mobile-iphone-se.png
        ├── 390px-mobile-iphone-14.png
        ├── 768px-tablet-ipad.png
        └── 1920px-desktop-fhd.png
```

---

## 🛠️ Cara Menjalankan Pengujian di Masa Depan

### 1. Menjalankan Suite Pengujian Otomatis (Network, Console, Responsive, Memory)
```bash
node tests/production-suite.cjs
```

### 2. Menjalankan Audit Lighthouse (Mobile & Desktop)
```bash
# Mobile Audit
npx -y lighthouse https://jembertrip.vercel.app --output=json,html --output-path=./reports/production-testing-[DATE]/lighthouse-report --chrome-flags="--headless" --quiet

# Desktop Audit
npx -y lighthouse https://jembertrip.vercel.app --preset=desktop --output=json,html --output-path=./reports/production-testing-[DATE]/lighthouse-desktop-report --chrome-flags="--headless" --quiet
```

### 3. Menjalankan Verifikasi Mobile Searchbar & Category Filter
```bash
cd frontend
node tests/mobile_searchbar_performance.mjs
```

---

## 📑 Indeks Laporan

| Tanggal | Target URL | Lighthouse (Perf/A11y/BP/SEO) | Console Errors | Memory Leak | Status | Laporan |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **2026-09-29** | `https://jembertrip.vercel.app` | **76 / 96 / 100 / 100** (Desktop)<br>**67 / 96 / 100 / 100** (Mobile) | **0 Errors** | **PASS** (1.87MB growth, GC OK) | ✅ PASSED | [Buka Laporan](./production-testing-2026-09-29/PRODUCTION_TESTING_REPORT.md) |
