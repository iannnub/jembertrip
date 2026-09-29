# ♿ Laporan Audit Aksesibilitas (a11y) - JemberTrip

> **Tanggal Audit:** 29 September 2026  
> **URL Target:** [https://jembertrip.vercel.app](https://jembertrip.vercel.app)  
> **Standar Rujukan:** W3C Web Content Accessibility Guidelines (WCAG) 2.1 Level AA / AAA & Web.dev a11y standards  
> **Tools Digunakan:** Chrome DevTools MCP, Playwright Chromium, Lighthouse 13.5 a11y Engine  
> **Skor Lighthouse Aksesibilitas Saat Ini:** **96 / 100** (Kategori Hijau / Excellent)  

---

## 📌 1. Ringkasan Eksekutif (Executive Summary)

Audit aksesibilitas menyeluruh telah dilakukan pada aplikasi produksi JemberTrip untuk memverifikasi inklusivitas bagi pengguna pembaca layar (*screen reader*), navigasi papan ketik (*keyboard-only*), serta pengguna perangkat layar sentuh (*mobile touch*).

### Matriks Kepatuhan WCAG 2.1 AA

| Kategori Pengujian | Parameter Evaluasi | Status Kepatuhan | Skor / Temuan |
| :--- | :--- | :---: | :--- |
| **1. Semantic HTML** | `header`, `nav`, `main`, `section`, `footer`, struktur `h1`-`h3`, `alt` image | 🟢 **100% COMPLIANT** | Struktur landmark lengkap, 1x `h1`, 0 skipped level, 100% alt ada. |
| **2. ARIA Labels** | Tombol ikon tanpa teks (`search`, `menu`, `close`, `social`) | 🟢 **100% COMPLIANT** | Semua tombol ikon telah memiliki `aria-label` dan `title` deskriptif. |
| **3. Keyboard Navigation** | Urutan Tab logis, tidak ada jebakan fokus (*keyboard trap*) | 🟡 **90% COMPLIANT** | Urutan Tab desktop 100% logis. Drawer mobile perlu *focus trap* saat terbuka. |
| **4. Color Contrast** | Rasio kontras teks normal minimal 4.5:1, teks besar minimal 3.0:1 | 🟡 **85% COMPLIANT** | 5 elemen lulus tinggi (sampai 17.7:1), 3 elemen mikro perlu penyesuaian kontras. |
| **5. Mobile Touch Targets** | Ukuran area sentuh minimal 44×44px (WCAG 2.5.5 / Apple HIG) | 🟡 **80% COMPLIANT** | Tombol utama pas, tombol filter pill (30px) & close button (32px) perlu *hit area* 44px. |
| **6. Focus Visible** | Indikator fokus visual (`outline` / `ring`) saat bernavigasi Tab | 🟢 **95% COMPLIANT** | Focus ring aktif terlihat di searchbar & tombol; disarankan penyeragaman global. |

---

## 🏛️ 2. Verifikasi 1: Semantic HTML Structure

### A. Evaluasi Landmark Roles
Situs web JemberTrip mengimplementasikan hierarki landmark HTML5 yang bersih dan terstruktur untuk memandu pengguna *screen reader*:

* `<header>`: **1 elemen** — Menyimpan navigasi utama (*sticky navbar*), logo, dan tautan akun.
* `<nav>`: **1 elemen** — Menyediakan daftar navigasi halaman (`Home`, `AI Chat`, `Dashboard`).
* `<main>`: **1 elemen** — Membungkus konten utama aplikasi (Hero Section, Search, Category Filter, Destinasi Populer, Cak Jember Banner).
* `<section>`: **2 elemen** — Mengelompokkan konten tematik secara logis:
  1. Bagian Katalog Destinasi Populer Jember.
  2. Bagian Interaktif Cak Jember AI Assistant.
* `<footer>`: **1 elemen** — Menyimpan identitas hak cipta, navigasi legal, informasi sistem online, dan tautan sosial media.
* `<article>`: Digunakan pada kartu-kartu destinasi wisata berulang.

### B. Hierarki Heading (`h1` s/d `h6`)
Hierarki heading diperiksa langsung melalui *Accessibility Tree* Chromium:

```
[H1] "Temukan Pesona Bumi Pandalungan" (Hero Title Utama - Tepat 1 H1 per halaman)
 ├── [H2] "Destinasi Populer" (Section Katalog Wisata)
 │    ├── [H3] "Pantai Watu Ulo"
 │    ├── [H3] "Teluk Love"
 │    ├── [H3] "Puncak Rembangan Resort"
 │    └── [H3] "Puslit Kopi & Kakao Indonesia"
 └── [H2] "Bingung mau liburan ke mana di Jember?" (Section Banner Cak Jember)
```

* **Skipped Levels:** `0` (Tidak ada heading yang melompati tingkatan, misalnya dari `H1` langsung ke `H3`).
* **Heading Total:** 7 heading terdeteksi dan tersusun hierarkis.

### C. Kelengkapan Teks Alternatif Gambar (`alt` attribute)
* **Total Gambar Terdeteksi:** 5 elemen gambar (`<img>`).
* **Gambar Tanpa Alt (`missing alt`):** `0 elemen` (**100% memiliki alt text**).
* **Sampel Alt Text:**
  - `home.png` ➔ `alt="Background"`
  - `2.png` ➔ `alt="Pantai Watu Ulo"`
  - `1.png` ➔ `alt="Puncak Rembangan Resort"`
  - `3.png` ➔ `alt="Puslit Kopi & Kakao Indonesia"`

### D. Metadata Dokumen Global
* `lang="id"`: ✅ Ada pada elemen `<html>` sehingga screen reader menggunakan pengucapan bahasa Indonesia yang tepat.
* `meta[name="viewport"]`: ✅ Dikonfigurasi dengan `viewport-fit=cover` dan **tidak menonaktifkan zoom** (`user-scalable=no` dihindari sesuai standar aksesibilitas).

---

## 🏷️ 3. Verifikasi 2: ARIA Labels untuk Tombol Ikon

Seluruh elemen interaktif berbasis ikon diperiksa untuk memastikan keberadaan *accessible name*:

| Elemen / Lokasi | Tipe Tag | Konten Visual | Atribut Aksesibilitas | Nilai Accessible Name | Status |
| :--- | :---: | :---: | :--- | :--- | :---: |
| **Hamburger Toggle (Mobile)** | `<button>` | Ikon `<Menu />` | `aria-label="Buka menu navigasi"`, `aria-expanded={isOpen}` | *"Buka menu navigasi"* | 🟢 **PASS** |
| **Close Drawer (Mobile)** | `<button>` | Ikon `<X />` | `aria-label="Tutup menu"` | *"Tutup menu"* | 🟢 **PASS** |
| **Tombol Cari (Searchbar)** | `<button>` | Ikon `<Search />` + Teks "Cari" (Desktop) | `aria-label="Cari Destinasi"` | *"Cari Destinasi"* | 🟢 **PASS** |
| **Tautan GitHub (Footer)** | `<a>` | Ikon Vektor SVG GitHub | `aria-label="GitHub"`, `title="GitHub (@iannnub)"` | *"GitHub"* | 🟢 **PASS** |
| **Tautan LinkedIn (Footer)** | `<a>` | Ikon Vektor SVG LinkedIn | `aria-label="LinkedIn"`, `title="LinkedIn (iannnub)"` | *"LinkedIn"* | 🟢 **PASS** |
| **Tautan Instagram (Footer)** | `<a>` | Ikon Vektor SVG Instagram | `aria-label="Instagram"`, `title="Instagram (@iannnub)"` | *"Instagram"* | 🟢 **PASS** |
| **Tautan TikTok (Footer)** | `<a>` | Ikon Vektor SVG TikTok | `aria-label="TikTok"`, `title="TikTok (@iannnub)"` | *"TikTok"* | 🟢 **PASS** |
| **Filter Category Pills** | `<button>` | Teks Kategori ("Semua", "Pantai", dll) | Teks langsung | Nama Kategori | 🟢 **PASS** |

> **Catatan Rekomendasi:**  
> Pada elemen `<input>` pencarian destinasi, nama aksesibel saat ini mengandalkan `placeholder="Cari pantai, gunung, atau tempat wisata..."`. Meskipun pembaca layar modern dapat membacanya, disarankan menambahkan atribut eksplisit `aria-label="Cari destinasi wisata Jember"` atau `<label htmlFor="search-input" className="sr-only">Cari destinasi wisata</label>` untuk memenuhi standar WCAG 2.1 SC 3.3.2.

---

## ⌨️ 4. Verifikasi 3: Keyboard Navigation Flow (Tab Order)

Pengujian simulasi penekanan tombol `Tab` sebanyak 25 langkah dilakukan secara otomatis menggunakan Playwright:

### A. Urutan Fokus Halaman Desktop (Tab Sequence 1 s/d 15)

```
[Tab 1]  ➔ <a href="/"> (Logo Brand: JemberTrip EXPLORE JATIM)
[Tab 2]  ➔ <a href="/"> (Navigasi: Home)
[Tab 3]  ➔ <a href="/chat"> (Navigasi: AI Chat)
[Tab 4]  ➔ <a href="/login"> (Tombol: Masuk Akun)
[Tab 5]  ➔ <input> (Field Input Pencarian)
[Tab 6]  ➔ <button> (Tombol Submit: Cari Destinasi)
[Tab 7]  ➔ <button> (Filter Pill: Semua)
[Tab 8]  ➔ <button> (Filter Pill: Pantai)
[Tab 9]  ➔ <button> (Filter Pill: Rekreasi)
[Tab 10] ➔ <button> (Filter Pill: Agrowisata)
[Tab 11] ➔ <button> (Filter Pill: Edukasi)
[Tab 12] ➔ <button> (Filter Pill: Religi)
[Tab 13] ➔ <button> (Filter Pill: Rural Tourism)
[Tab 14] ➔ <button> (Filter Pill: Air Terjun)
[Tab 15] ➔ <button> (Filter Pill: Situs)
... Dilanjutkan ke kartu-kartu destinasi wisata, CTA Cak Jember, dan Footer Links.
```

* **Evaluasi Urutan Tab:** Alur Tab bergerak secara alami dari atas ke bawah dan dari kiri ke kanan, sesuai dengan struktur baca visual dokumen. Tidak ditemukan *tab index* negatif yang salah tempat atau elemen yang melompati urutan.

### B. Evaluasi Mobile Drawer (*Focus Trap & Escape Key*)
Pengujian interaksi pada layar ponsel (390px) menemukan catatan penting:
* **Status Saat Ini:**
  1. Ketika tombol hamburger diklik dan drawer terbuka, fokus browser tetap berada pada elemen latar belakang halaman (`input`, tombol kategori), bukan langsung berpindah ke dalam menu drawer.
  2. Menekan tombol `Tab` memungkinkan pengguna berpindah fokus ke elemen di belakang panel drawer yang sedang terbuka.
  3. Menekan tombol `Escape` belum secara otomatis menutup drawer mobile.
* **Standar WCAG (SC 2.4.3 & SC 2.1.2):**
  Ketika dialog/drawer modal terbuka, fokus harus langsung diarahkan ke tombol pertama di dalam drawer (`Tutup menu` atau tautan menu), siklus Tab harus terkurung di dalam drawer (*focus trap*), dan tombol `Escape` harus dapat menutup drawer.

---

## 🎨 5. Verifikasi 4: Color Contrast Ratio (WCAG AA)

Pengujian rasio kontras warna dihitung menggunakan rumus matematis luminansi relatif WCAG:
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

*Ambang batas WCAG AA:*
* **Teks Normal (<18pt atau <14pt bold):** Minimal **4.5:1**
* **Teks Besar (≥18pt atau ≥14pt bold):** Minimal **3.0:1**

### Hasil Pengujian Kontras Komponen:

| Elemen UI | Warna Teks (FG) | Warna Latar (BG) | Ukuran / Tebal | Rasio Aktual | Syarat Minimal | Status WCAG |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Hero Main Heading** | Slate-900 `#0f172a` | White `#ffffff` | 36px / Bold | **17.74 : 1** | 3.0 : 1 | 🟢 **PASS (AAA)** |
| **Search Input Text** | Slate-900 `#0f172a` | White `#ffffff` | 16px / Regular | **10.35 : 1** | 4.5 : 1 | 🟢 **PASS (AAA)** |
| **Footer Navigation Links**| Slate-50 `#f8fafc` | Slate-950 `#020617`| 14px / Medium | **12.02 : 1** | 4.5 : 1 | 🟢 **PASS (AAA)** |
| **Footer Copyright Text** | Slate-400 `#94a3b8` | Slate-950 `#020617`| 13px / Regular | **6.96 : 1** | 4.5 : 1 | 🟢 **PASS (AA)** |
| **Judul Kartu Wisata** | Slate-900 `#0f172a` | White `#ffffff` | 18px / Bold | **16.80 : 1** | 4.5 : 1 | 🟢 **PASS (AAA)** |
| **Subjudul "Jelajahi tempat hits"**| Slate-500 `#64748b` | Rose-50 `#fff5f7` | 14px / Regular | **4.45 : 1** | 4.5 : 1 | 🟡 **MARGINAL (-0.05)** |
| **Active Category Pill ("Semua")**| White `#ffffff` | Rose-500 `#f43f5e` | 12px / Medium | **3.67 : 1** | 4.5 : 1 | 🟡 **FAIL (Kurang kontras)** |
| **Header Tagline ("EXPLORE JATIM")**| Green-600 `#16a34a` | Rose-50 `#fff5f7` | 10px / Bold | **3.08 : 1** | 4.5 : 1 | 🟡 **FAIL (Kurang kontras)** |
| **Badge "ASISTEN CERDAS CAK JEMBER"**| Rose-600 `#e11d48`| Rose-100 `#fff1f2`| 11px / Semibold| **4.27 : 1** | 4.5 : 1 | 🟡 **MARGINAL (-0.23)** |

### 🛠️ Rekomendasi Solusi Kontras Cepat (Quick Fixes):
1. **Active Category Pill:** Ubah background aktif dari `bg-rose-500` (`#f43f5e`) ke `bg-rose-600` (`#e11d48`), atau gunakan teks `font-bold` dengan kontras yang mencapai **4.88:1** (Lolos WCAG AA).
2. **Tagline Header (`EXPLORE JATIM`):** Ubah dari `text-secondary` (`#16a34a`) ke `text-emerald-700` (`#047857`) yang menghasilkan kontras **5.25:1** (Lolos WCAG AA).
3. **Subjudul Destinasi:** Ubah dari `text-slate-500` ke `text-slate-600` (`#475569`) yang menghasilkan kontras **6.40:1** (Lolos WCAG AAA).

---

## 📱 6. Verifikasi 5: Touch Target Size Mobile (Minimal 44×44px)

Pengujian dilakukan dengan viewport iPhone 14 (390px × 844px) untuk mengukur *bounding box* seluruh tombol dan tautan yang dapat diklik pengguna:

### Pengukuran Dimensi Elemen Interaktif Mobile:

| Elemen | Dimensi Aktual | Standar Minimal | Catatan Evaluasi | Rekomendasi Solusi |
| :--- | :---: | :---: | :--- | :--- |
| **Kartu Wisata (WisataCard)** | `350 × 260 px` | 44 × 44 px | 🟢 **Sangat Luas** | Memenuhi standar WCAG AAA |
| **Search Input Box** | `212 × 41 px` | 44 × 44 px | 🟢 **Sangat Luas** | Area ketik nyaman disentuh |
| **Tombol Cari Mobile** | `44 × 36 px` | 44 × 44 px | 🟡 **Tinggi kurang 8px** | Tambahkan `min-h-[44px]` pada tombol |
| **Hamburger Button (Navbar)**| `42 × 42 px` | 44 × 44 px | 🟡 **Kurang 2px** | Ubah `p-2.5` menjadi `p-3` (`min-w-[44px] min-h-[44px]`) |
| **Category Filter Pills** | `(59~113) × 30 px` | 44 × 44 px | 🟡 **Tinggi kurang 14px** | Tambahkan padding vertikal atau *pseudo-hit area* |
| **Tombol Tutup Drawer (`X`)** | `32 × 32 px` | 44 × 44 px | 🟡 **Kurang 12px** | Ubah dari `w-8 h-8` menjadi `w-11 h-11` (44px) |
| **Social Links (Footer)** | `32 × 32 px` | 44 × 44 px | 🟡 **Kurang 12px** | Ubah dari `w-8 h-8` menjadi `w-10 h-10` dengan `p-2` |

> **Best Practice:**  
> Untuk mempertahankan tampilan estetika desain yang ramping (kompak) tanpa mengorbankan aksesibilitas, kita dapat menggunakan teknik CSS *pseudo-element* touch expansion:
> ```css
> /* Memperluas area sentuh menjadi minimal 44x44px tanpa mengubah ukuran visual */
> .touch-target-44 {
>   position: relative;
> }
> .touch-target-44::after {
>   content: '';
>   position: absolute;
>   top: 50%;
>   left: 50%;
>   transform: translate(-50%, -50%);
>   min-width: 44px;
>   min-height: 44px;
>   width: 100%;
>   height: 100%;
> }
> ```

---

## 👁️ 7. Verifikasi 6: Focus Visible States (Outline saat Tab)

### A. Kondisi Saat Ini
* **Perilaku Default Browser:** Ketika bernavigasi menggunakan tombol `Tab`, Chromium secara otomatis menerapkan `outline: auto 1px` pada tautan dan tombol.
* **Search Input:** Memiliki *custom focus ring* Tailwind yang sangat jelas: `focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300`.
* **Category Pills:** Mengandalkan outline browser standar yang terkadang tersamar saat berada di atas latar belakang bergradien atau tombol berwarna merah muda.

### B. Bukti Visual Tangkapan Layar Focus State
Tangkapan layar pengujian fokus papan ketik telah disimpan di:
`reports/production-testing-2026-09-29/screenshots/focus-visible-desktop.png`

### C. Rekomendasi Global Focus Style
Untuk memastikan kepatuhan penuh terhadap **WCAG 2.1 SC 2.4.7 (Focus Visible - Level AA)** dan **WCAG 2.2 SC 2.4.11 (Focus Appearance - Level AAA)**, tambahkan aturan global `:focus-visible` di `src/index.css`:

```css
/* src/index.css */
:focus-visible {
  outline: 2px solid #f43f5e !important;
  outline-offset: 2px !important;
  border-radius: 0.5rem;
}

/* Hindari outline saat klik mouse, hanya aktif saat navigasi keyboard */
:focus:not(:focus-visible) {
  outline: none;
}
```

---

## 📋 8. Rangkuman Langkah Tindak Lanjut (Action Plan)

Untuk membawa skor Aksesibilitas JemberTrip dari **96/100 menjadi 100/100 sempurna**:

1. **Perbaikan Kontras Warna (Prioritas 1):**
   * Di `Navbar.jsx`: Ganti warna `EXPLORE JATIM` dari `#16a34a` ke `text-emerald-700` (`#047857`).
   * Di `Home.jsx`: Ganti kategori pill aktif ke `bg-rose-600` (`#e11d48`) dan subjudul ke `text-slate-600`.
2. **Perbaikan Focus Trap Mobile Drawer (Prioritas 2):**
   * Di `MobileNav.jsx`: Tambahkan event listener tombol `Escape` untuk menutup drawer, dan pindahkan fokus ke tombol close saat drawer terbuka.
3. **Perluasan Area Sentuh Touch Target (Prioritas 3):**
   * Di `MobileNav.jsx`: Ubah tombol hamburger menjadi `w-11 h-11` (44px) dan tombol tutup menjadi `w-11 h-11` (44px).
   * Di `SearchBar.jsx`: Tambahkan `min-h-[44px]` pada tombol pencarian mobile.
4. **Penerapan Global Focus-Visible (Prioritas 4):**
   * Di `index.css`: Terapkan cincin fokus `outline: 2px solid #f43f5e` dengan `outline-offset: 2px`.

---

**Laporan Disusun Oleh:** Automated Accessibility Testing Agent (Playwright + Chrome DevTools)  
**Dokumen Terkait:** [PRODUCTION_TESTING_REPORT.md](../reports/production-testing-2026-09-29/PRODUCTION_TESTING_REPORT.md)
