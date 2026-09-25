#!/bin/bash
# backend/scripts/backup_jembertrip_db.sh
# Script backup harian database JemberTrip via cron job di Linux VPS

BACKUP_DIR="/var/backups/jembertrip"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Jika menggunakan Docker PostgreSQL
if docker ps --format '{{.Names}}' | grep -q "jembertrip_db"; then
    echo "[Cron Backup] Melakukan pg_dump dari container jembertrip_db..."
    docker exec jembertrip_db pg_dump -U jembertrip_admin jembertrip_prod | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"
else
    # Fallback ke python script
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    python3 "$SCRIPT_DIR/backup_db.py"
fi

# Rotasi cadangan: Hapus backup yang lebih tua dari 14 hari
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -exec rm {} \;
find "$BACKUP_DIR" -type f -name "*.db.gz" -mtime +14 -exec rm {} \;

echo "[Cron Backup] Selesai pada $(date)"
