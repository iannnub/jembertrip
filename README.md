# 🚀 JemberTrip.AI: Smart Local Tourism Assistant

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-production-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

🚀 **Live Demo:** [https://jembertrip.vercel.app](https://jembertrip.vercel.app)

JemberTrip.AI adalah platform asisten perjalanan cerdas berbasis Artificial Intelligence (AI) yang dirancang khusus untuk mengeksplorasi potensi pariwisata di Kabupaten Jember, Jawa Timur. Dengan mengimplementasikan arsitektur Retrieval-Augmented Generation (RAG), aplikasi ini memberikan rekomendasi yang akurat, personal, dan berbasis data pengetahuan lokal yang faktual.

✨ Fitur Unggulan
🤖 Cak Jember AI Chatbot: Asisten virtual yang memahami konteks pariwisata lokal Jember menggunakan LLM (Large Language Model) terkini.

🧠 Personalized Recommendation: Sistem rekomendasi cerdas yang menyesuaikan saran destinasi berdasarkan riwayat interaksi dan preferensi unik pengguna.

🗣️ Pandalungan Support: Mendukung pemrosesan bahasa lokal (Normalisasi Slang Pandalungan) dan komunikasi dalam Multi-bahasa (Indonesia, Jawa Jemberan, Madura).

🎙️ Voice Recognition: Fitur interaksi berbasis suara untuk kemudahan aksesibilitas.

🛡️ Smart Guardrails: Sistem keamanan informasi yang mencegah AI berhalusinasi (Anti-Hallucination) dan memastikan rekomendasi tetap berada di koridor geografis Jember.

🛠️ Admin Dashboard: Panel manajemen data wisata yang dilengkapi dengan Magic AI Writer untuk pembuatan deskripsi konten otomatis.

🏗️ Arsitektur Sistem & Tech Stack
Proyek ini dibangun dengan integrasi teknologi modern:

Frontend
React.js (Vite): Library utama untuk antarmuka pengguna yang reaktif.

Tailwind CSS: Framework CSS untuk desain "Jember Pink" yang modern dan responsif.

Framer Motion: Library animasi untuk pengalaman pengguna yang lebih smooth.

Lucide React: Set ikon modern.

Backend (The Brain)
FastAPI (Python): Framework API asinkronus berperforma tinggi.

LangChain: Orkestrasi alur kerja AI dan manajemen memori Chatbot.

S-BERT (Sentence-BERT): Model embedding (all-MiniLM-L6-v2) untuk pencarian semantik tingkat tinggi.

Groq API (Llama 3): Inferensi LLM dengan latensi ultra-rendah.

ChromaDB: Vector Database untuk menyimpan data pengetahuan pariwisata.

PostgreSQL/SQLite: Database relasional untuk data User, Session, dan History.

📊 Dataset
Sistem menggunakan dua sumber data utama:

destinasi_final.csv: Data detail objek wisata (Lokasi, Harga, Deskripsi).

knowledge_base.pdf/csv: Basis pengetahuan mendalam mengenai budaya, kuliner, dan informasi umum Kabupaten Jember.

⚙️ Instalasi & Penggunaan
Prasyarat
Node.js (v18+)

Python (3.10+)

Groq API Key

Langkah-langkah
Clone Repository

```bash
git clone https://github.com/iannnub/jembertrip.git
cd jembertrip
```

Setup Backend

```bash
cd backend
pip install -r requirements.txt
# Jalankan Server
uvicorn main:app --reload
```

Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

📂 Struktur Proyek

```plaintext
jembertrip/
├── backend/               # FastAPI + ChromaDB + AI Logic
│   ├── data/             # Dataset CSV
│   ├── db_jembertrip_v2/ # Vector Store (ChromaDB)
│   ├── models.py         # Database Schema
│   └── main.py           # API Logic & AI Middle Brain
├── frontend/              # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/        # WisataHome, WisataDetail, ChatPage, dll.
│   │   └── App.jsx       # Routing & Global Layout
│   └── tailwind.config.js
└── README.md
```

---

## 📱 Social Media & Contact
- **LinkedIn:** [@iannnub](https://www.linkedin.com/in/iannnub/)
- **Instagram:** [@iannnub](https://www.instagram.com/iannnub)
- **TikTok:** [@iannnub](https://www.tiktok.com/@iannnub)
- **GitHub:** [@iannnub](https://github.com/iannnub)