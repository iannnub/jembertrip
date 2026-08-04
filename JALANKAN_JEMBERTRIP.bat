@echo off
title 🚀 JemberTrip - Server Launcher
color 0A
cls

echo.
echo  ==========================================
echo    🌟 JEMBERTRIP - AUTO LAUNCHER 🌟
echo  ==========================================
echo.
echo  Memulai Backend (Python + AI)...
echo  Memulai Tunnel Publik (Ngrok)...
echo.
echo  Website akan bisa diakses di:
echo  https://jembertrip.vercel.app
echo.
echo  ==========================================
echo.

:: Buka Terminal 1: Backend Python (Uvicorn)
start "🐍 JemberTrip Backend (Uvicorn)" cmd /k ^
    "title JemberTrip Backend ^& color 0B ^& echo. ^& echo  [BACKEND] Mengaktifkan virtual environment... ^& echo. ^& "^
    "d:\iann Kuliah\Semester 7\1. Artificial Intelegence (AI)\jembertrip\venv\Scripts\activate.bat" ^& ^
    cd /d "d:\iann Kuliah\Semester 7\1. Artificial Intelegence (AI)\jembertrip\backend" ^& ^
    echo. ^& echo  [BACKEND] Menjalankan server AI... ^& echo. ^& ^
    python -m uvicorn main:app --host 127.0.0.1 --port 8000"

:: Tunggu 10 detik agar backend siap lebih dulu
echo  Menunggu backend siap (15 detik)...
timeout /t 15 /nobreak > nul

:: Buka Terminal 2: Ngrok Tunnel
start "🌐 JemberTrip Ngrok Tunnel" cmd /k ^
    "title JemberTrip Ngrok Tunnel ^& color 0E ^& echo. ^& echo  [NGROK] Membuka tunnel publik... ^& echo. ^& ^
    "C:\Users\IANN\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" http --domain=numbness-afterglow-parade.ngrok-free.dev 8000"

echo.
echo  ✅ Semua server berhasil dijalankan!
echo.
echo  🌐 Website: https://jembertrip.vercel.app
echo  🔗 Backend: https://numbness-afterglow-parade.ngrok-free.dev
echo.
echo  ⚠️  JANGAN TUTUP jendela terminal yang terbuka!
echo.
pause
