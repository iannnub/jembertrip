@echo off
title 🚀 JemberTrip - Server Launcher
color 0A
cls

echo ========================================================
echo         🌟 JEMBERTRIP - AUTO LAUNCHER 🌟
echo ========================================================
echo.
echo  [1/2] Mempersiapkan Backend (FastAPI + AI Cak Jember)...
echo  [2/2] Mempersiapkan Tunnel Publik (Ngrok Cloud)...
echo.
echo  Website Publik: https://jembertrip.vercel.app
echo  Backend URL   : https://numbness-afterglow-parade.ngrok-free.dev
echo ========================================================
echo.

:: Mendapatkan direktori folder project saat ini
set "ROOT_DIR=%~dp0"

:: 1. Buka Terminal 1: Backend Python (FastAPI / Uvicorn)
echo  [INFO] Menjalankan Backend di port 8000...
start "🐍 JemberTrip Backend (FastAPI)" cmd /k ^
    "title 🐍 JemberTrip Backend ^& color 0B ^& cd /d "%ROOT_DIR%backend" ^& ^
    echo. ^& echo ========================================== ^& ^
    echo   [BACKEND] Mengaktifkan Virtual Environment... ^& ^
    echo ========================================== ^& echo. ^& ^
    call "%ROOT_DIR%backend\venv\Scripts\activate.bat" ^& ^
    echo. ^& echo   [BACKEND] Menjalankan FastAPI Server... ^& echo. ^& ^
    uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Tunggu 6 detik agar backend selesai inisialisasi database & AI model
echo  [INFO] Menunggu Backend siap (6 detik)...
timeout /t 6 /nobreak > nul

:: 2. Buka Terminal 2: Ngrok Tunnel (Jembatan ke Vercel)
echo  [INFO] Membuka Tunnel Ngrok...
start "🌐 JemberTrip Ngrok Tunnel" cmd /k ^
    "title 🌐 JemberTrip Ngrok Tunnel ^& color 0E ^& cd /d "%ROOT_DIR%" ^& ^
    echo. ^& echo ========================================== ^& ^
    echo   [NGROK] Menghubungkan Laptop ke Vercel... ^& ^
    echo ========================================== ^& echo. ^& ^
    npx --yes ngrok http --url=numbness-afterglow-parade.ngrok-free.dev 8000"

echo.
echo ========================================================
echo  ✅ SEMUA SERVICE BERHASIL DIJALANKAN!
echo ========================================================
echo.
echo  📱 Buka di Browser Laptop / HP Anda:
echo     👉 https://jembertrip.vercel.app
echo.
echo  ⚠️  CATATAN PENTING:
echo     JANGAN TUTUP 2 jendela terminal hitam yang baru muncul!
echo     (Terminal Backend dan Terminal Ngrok harus tetap terbuka
echo      selama Anda ingin website bisa diakses).
echo.
echo ========================================================
pause
