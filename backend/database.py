# backend/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Menentukan Lokasi Database
# Kita pakai SQLite. Nanti file 'jembertrip.db' akan otomatis muncul di folder backend.
SQLALCHEMY_DATABASE_URL = "sqlite:///./jembertrip.db"

# 2. Membuat Mesin Database (Engine)
# 'check_same_thread': False diperlukan khusus untuk SQLite di FastAPI 
# agar bisa diakses oleh banyak request sekaligus.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 3. Membuat Sesi (SessionLocal)
# Ini adalah "pintu masuk" yang akan kita pakai setiap kali mau simpan/ambil data.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Base Model
# Semua tabel (User, History) nanti akan dibuat berdasarkan template (Base) ini.
Base = declarative_base()

# 5. Dependency (Fungsi Penghubung)
# Fungsi ini akan dipanggil di setiap endpoint API (main.py) yang butuh akses database.
# Dia membuka koneksi, lalu menutupnya otomatis setelah request selesai.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()