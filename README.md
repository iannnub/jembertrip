🚀 JemberTrip.AI: Smart Local Tourism Assistant
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

Bash
git clone https://github.com/username/jembertrip.git
cd jembertrip
Setup Backend

Bash
cd backend
pip install -r requirements.txt
# Jalankan Ingestion untuk pertama kali
python ingestion.py
# Jalankan Server
uvicorn main:app --reload
Setup Frontend

Bash
cd frontend
npm install
npm run dev
📂 Struktur Proyek
Plaintext
jembertrip/
├── backend/
│   ├── data/             # Dataset CSV & PDF
│   ├── db_jembertrip_v2/ # Vector Store (ChromaDB)
│   ├── models.py         # Database Schema
│   ├── main.py           # API Logic & AI Middle Brain
│   └── ingestion.py      # Script pemrosesan data ke Vektor
├── frontend/
│   ├── src/
│   │   ├── pages/        # WisataHome, WisataDetail, ChatPage, dll.
│   │   └── App.jsx       # Routing & Global Layout
│   └── tailwind.config.js
└── README.md
🎓 Konteks Akademik
Proyek ini dikembangkan sebagai bagian dari penelitian Skripsi/Tugas Akhir pada Program Studi Sistem Informasi, Universitas Muhammadiyah Jember.