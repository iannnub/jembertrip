# JemberTrip

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-production-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

**Live Demo:** [https://jembertrip.vercel.app](https://jembertrip.vercel.app)

JemberTrip adalah direktori wisata dan asisten perjalanan untuk Kabupaten Jember, Jawa Timur. Aplikasi ini menggabungkan katalog 56 destinasi lokal dengan chatbot berbasis Retrieval-Augmented Generation (RAG) serta sistem rekomendasi hybrid yang menggabungkan perilaku klik pengguna dan kemiripan atribut destinasi.

## Fitur Utama

### Chatbot RAG Cak Jember
Cak Jember menjawab pertanyaan seputar rute, harga tiket, jam operasional, kuliner, dan penginapan di Kabupaten Jember. Sebelum melakukan pencarian vektor, sistem menormalisasi kosakata dialek Pandalungan (campuran Bahasa Indonesia, Jawa Jemberan, dan Madura) agar kueri lokal tetap cocok dengan dokumen di database. Sistem mengambil 10 dokumen terdekat (`k=10`) dari ChromaDB menggunakan model embedding `sentence-transformers/all-MiniLM-L6-v2`, lalu mengirimkan konteks tersebut ke `llama-3.3-70b-versatile` melalui Groq API. Pembatas geografis pada prompt menolak pertanyaan wisata di luar wilayah Kabupaten Jember untuk mencegah halusinasi lokasi. Input pertanyaan juga mendukung pendiktean suara melalui Web Speech API.

### Sistem Rekomendasi Hybrid ($\alpha = 0.6$)
Halaman utama menampilkan dua kelompok rekomendasi sebanyak masing-masing 6 destinasi:
- **Rekomendasi Pilihan (`/api/v1/recommendations/personal`):** Menggunakan User-Based Collaborative Filtering ($k\text{-NN}$ dengan $k=30$) berdasarkan matriks interaksi klik pengguna.
- **Mungkin Anda Sukai (`/api/v1/recommendations/hybrid`):** Menggabungkan skor Collaborative Filtering (bobot 60%) dan Content-Based Filtering berbasis Cosine Similarity pada embedding SBERT (bobot 40%).
- **Penanganan Cold-Start:** Pengguna baru yang belum memiliki riwayat klik diarahkan ke halaman onboarding untuk memilih kategori favorit, lalu diberi rekomendasi awal berbasis kesamaan konten dan popularitas.

### Katalog Destinasi & Fallback Offline
Katalog mencakup 56 objek wisata di Kabupaten Jember yang terbagi ke dalam 9 kategori: Pantai, Rekreasi, Agrowisata, Edukasi, Religi, Rural Tourism, Air Terjun, Situs, dan Panorama. Seluruh data utama di `backend/data/destinasi_final.csv` memiliki salinan statis di `frontend/public/data/wisata-fallback.json`, sehingga katalog dan foto wisata tetap dapat diakses penuh saat server backend sedang tidak aktif.

### Panel Administrasi & Otentikasi
Sistem otentikasi menggunakan JWT (masa berlaku 30 hari) dengan hashing password `PBKDF2-SHA256` dan pembagian peran (`user` serta `admin`). Akun administrator dapat menambah, mengubah, dan menghapus destinasi wisata, mengunggah foto (validasi tipe `JPG/PNG/WEBP` hingga 5 MB), memantau laporan riwayat klik pengguna, serta membuat draf deskripsi wisata otomatis dari kata kunci singkat.

## Tumpukan Teknologi

| Lapisan | Teknologi | Peran di Proyek |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 7, React Router 7 | Antarmuka SPA, pemisahan bundel rute (`React.lazy`), dan pengelolaan status sesi |
| **Styling & Motion** | Tailwind CSS 4, Framer Motion 12, Lucide React | Sistem desain iOS Liquid Glass bebas gradasi warna dan transisi tab berbasis pegas (`layoutId`) |
| **Backend API** | Python 3.10+, FastAPI, SQLAlchemy | REST API, otorisasi RBAC, dan pencatatan riwayat interaksi |
| **AI & Rekomendasi** | LangChain, Groq API (`llama-3.3-70b-versatile`), Sentence-Transformers (`all-MiniLM-L6-v2`), Scikit-Learn | Pipeline RAG, pencocokan semantik, dan perhitungan skor CF + CBF |
| **Penyimpanan Data** | SQLite / PostgreSQL, ChromaDB (`db_jembertrip_v2/`) | Penyimpanan relasional (`jembertrip.db`) dan indeks vektor dokumen wisata |

## Sumber Data

- `backend/data/destinasi_final.csv`: Dataset 56 destinasi wisata Jember berisi nama, kategori, alamat, koordinat, jam buka, harga tiket, deskripsi, dan path gambar.
- `backend/db_jembertrip_v2/`: Penyimpanan vektor ChromaDB yang berisi indeks dokumen pariwisata, kuliner, dan budaya Kabupaten Jember.

## Instalasi & Menjalankan Proyek

### Prasyarat
- Node.js v18 atau lebih baru
- Python v3.10 atau lebih baru
- Kunci API Groq (`GROQ_API_KEY_1` di file `backend/.env`)

### 1. Klon Repositori
```bash
git clone https://github.com/iannnub/jembertrip.git
cd jembertrip
```

### 2. Menjalankan Backend (FastAPI)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux / macOS

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Dokumentasi Swagger UI dapat diakses di `http://localhost:8000/docs`.

### 3. Menjalankan Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Aplikasi web berjalan di `http://localhost:5173`.

### 4. Pengujian & Pemeriksaan Kualitas Kode
```bash
# Unit test backend (FastAPI & keamanan endpoint)
cd backend
pytest -v

# Linter & pemeriksaan build produksi frontend
cd ../frontend
npm run lint
npm run build
```

## Struktur Direktori

```plaintext
jembertrip/
├── backend/
│   ├── data/                  # Dataset CSV master (destinasi_final.csv, dll.)
│   ├── db_jembertrip_v2/      # Penyimpanan vektor ChromaDB
│   ├── tests/                 # Unit test pytest (API, RBAC, IDOR, rekomendasi)
│   ├── database.py            # Konfigurasi koneksi SQLite / PostgreSQL
│   ├── models.py              # Skema tabel SQLAlchemy (User, Wisata, Chat, History)
│   ├── security.py            # Hashing password PBKDF2-SHA256 & utilitas JWT
│   └── main.py                # Endpoint FastAPI, pipeline RAG, dan mesin rekomendasi
├── frontend/
│   ├── public/
│   │   ├── data/              # Data fallback statis (wisata-fallback.json)
│   │   ├── images/            # Foto asli 56 destinasi wisata Jember
│   │   ├── llms.txt           # Indeks ringkas untuk penelusuran AI (GEO)
│   │   ├── robots.txt         # Aturan perayapan mesin pencari
│   │   └── sitemap.xml        # Peta situs XML seluruh rute dan destinasi
│   ├── src/
│   │   ├── components/        # Komponen UI (WisataCard, MobileNav, Footer, SEO)
│   │   ├── pages/             # Halaman rute (WisataHome, WisataDetail, ChatPage, AdminPage)
│   │   ├── utils/             # Resolusi URL gambar, analitik, dan Web Vitals
│   │   └── App.jsx            # Konfigurasi rute dan navigasi utama
│   └── package.json
├── DESIGN.md                  # Spesifikasi sistem desain dan token warna
└── README.md
```

## Kontak Pengembang

- **GitHub:** [@iannnub](https://github.com/iannnub)
- **LinkedIn:** [@iannnub](https://www.linkedin.com/in/iannnub/)
- **Instagram:** [@iannnub](https://www.instagram.com/iannnub)
- **TikTok:** [@iannnub](https://www.tiktok.com/@iannnub)
