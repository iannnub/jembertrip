#!/usr/bin/env python3
"""
backend/scripts/backup_db.py
Script otomatis pencadangan database JemberTrip (SQLite & PostgreSQL)
Mendukung atomic online backup, kompresi gzip, dan rotasi otomatis (retensi 14 hari).
"""
import os
import sys
import gzip
import shutil
import sqlite3
import subprocess
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

BACKUP_DIR = os.path.join(BACKEND_DIR, "backups")
RETENTION_DAYS = 14

def ensure_backup_dir():
    os.makedirs(BACKUP_DIR, exist_ok=True)

def cleanup_old_backups():
    """Hapus file cadangan yang lebih tua dari batas retensi (14 hari)."""
    cutoff = datetime.now() - timedelta(days=RETENTION_DAYS)
    count = 0
    for filename in os.listdir(BACKUP_DIR):
        if not (filename.endswith(".gz") or filename.endswith(".db") or filename.endswith(".sql")):
            continue
        file_path = os.path.join(BACKUP_DIR, filename)
        try:
            mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
            if mtime < cutoff:
                os.remove(file_path)
                count += 1
                print(f"[Cleanup] Dihapus cadangan usang: {filename}")
        except Exception as e:
            print(f"[Cleanup Error] {filename}: {e}")
    if count > 0:
        print(f"[Cleanup] Berhasil membersihkan {count} file cadangan usang.")

def backup_sqlite():
    """Pencadangan SQLite online atomic via sqlite3 backup API (aman dari database lock)."""
    db_file = os.path.join(BACKEND_DIR, "jembertrip.db")
    if not os.path.exists(db_file):
        print(f"[Error] File database SQLite tidak ditemukan di: {db_file}")
        return False

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    temp_target = os.path.join(BACKUP_DIR, f"jembertrip_backup_{timestamp}.db")
    gz_target = f"{temp_target}.gz"

    print(f"[Backup] Memulai atomic online backup SQLite: {db_file}...")
    try:
        source_conn = sqlite3.connect(db_file)
        dest_conn = sqlite3.connect(temp_target)
        source_conn.backup(dest_conn)
        dest_conn.close()
        source_conn.close()

        # Kompres ke gzip
        with open(temp_target, "rb") as f_in:
            with gzip.open(gz_target, "wb") as f_out:
                shutil.copyfileobj(f_in, f_out)
        os.remove(temp_target)

        size_kb = os.path.getsize(gz_target) / 1024
        print(f"[Sukses] Backup SQLite berhasil disimpan: {os.path.basename(gz_target)} ({size_kb:.1f} KB)")
        return True
    except Exception as e:
        print(f"[Error] Gagal backup SQLite: {e}")
        if os.path.exists(temp_target):
            os.remove(temp_target)
        return False

def backup_postgres(database_url: str):
    """Pencadangan PostgreSQL via pg_dump."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    gz_target = os.path.join(BACKUP_DIR, f"jembertrip_pg_backup_{timestamp}.sql.gz")

    print("[Backup] Memulai backup PostgreSQL...")
    try:
        cmd = f"pg_dump {database_url} | gzip > {gz_target}"
        subprocess.run(cmd, shell=True, check=True)
        size_kb = os.path.getsize(gz_target) / 1024
        print(f"[Sukses] Backup PostgreSQL berhasil disimpan: {os.path.basename(gz_target)} ({size_kb:.1f} KB)")
        return True
    except Exception as e:
        print(f"[Error] Gagal backup PostgreSQL: {e}")
        return False

def main():
    ensure_backup_dir()
    db_url = os.getenv("DATABASE_URL", "").strip()

    if db_url.startswith("postgresql://") or db_url.startswith("postgres://"):
        success = backup_postgres(db_url)
    else:
        success = backup_sqlite()

    if success:
        cleanup_old_backups()
        print("[Selesai] Rutinitas pencadangan database selesai.")
        sys.exit(0)
    else:
        print("[Gagal] Pencadangan database tidak berhasil.")
        sys.exit(1)

if __name__ == "__main__":
    main()
