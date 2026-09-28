@echo off
title JemberTrip - Server Launcher
color 0A
cls

echo ========================================================
echo         [ JEMBERTRIP - AUTO LAUNCHER ]
echo ========================================================
echo.
echo  [1/2] Mempersiapkan Backend (FastAPI + AI Cak Jember)...
echo  [2/2] Mempersiapkan Tunnel Publik (Ngrok Cloud)...
echo.
echo  Website Publik: https://jembertrip.vercel.app
echo  Backend URL   : https://numbness-afterglow-parade.ngrok-free.dev
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

echo [INFO] Menjalankan Backend di port 8000...
start "JemberTrip Backend (FastAPI)" cmd /k "title JemberTrip Backend & color 0B & cd /d "%ROOT_DIR%backend" && call "%ROOT_DIR%backend\venv\Scripts\activate.bat" && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo [INFO] Menunggu Backend siap (memuat AI model & ChromaDB, mohon tunggu)...
powershell -NoProfile -Command "$ready = $false; for ($i=0; $i -lt 30; $i++) { try { $res = Invoke-WebRequest -Uri 'http://localhost:8000/docs' -UseBasicParsing -TimeoutSec 1; if ($res.StatusCode -eq 200) { $ready = $true; break } } catch { Start-Sleep -Seconds 1 } }; if ($ready) { Write-Host ' [OK] Backend siap dan merespons!' -ForegroundColor Green } else { Write-Host ' [WARN] Backend masih loading, melanjutkan...' -ForegroundColor Yellow }"

echo [INFO] Membuka Tunnel Ngrok...
start "JemberTrip Ngrok Tunnel" cmd /k "title JemberTrip Ngrok Tunnel & color 0E & cd /d "%ROOT_DIR%" && call npx --yes ngrok http --url=numbness-afterglow-parade.ngrok-free.dev 8000"

echo.
echo ========================================================
echo  [OK] SEMUA SERVICE BERHASIL DIJALANKAN!
echo ========================================================
echo.
echo  Buka di Browser Laptop / HP Anda:
echo     URL: https://jembertrip.vercel.app
echo.
echo  CATATAN PENTING:
echo     JANGAN TUTUP 2 jendela terminal hitam yang baru muncul!
echo     (Terminal Backend dan Terminal Ngrok harus tetap terbuka
echo      selama Anda ingin website bisa diakses).
echo.
echo ========================================================
echo Tekan tombol apa saja untuk menutup jendela launcher ini...
pause >nul
