import requests
import sys

# Konfigurasi
API_URL = "http://localhost:8000/api/auth/setup-admin"
MASTER_KEY = "skripsi2025_master_key"

def make_user_admin():
    print("=== 👑 ALAT PENGANGKATAN ADMIN JEMBERTRIP (Username Ver.) ===")
    
    # [UBAH DISINI] Minta Username, bukan Email
    username = input("Masukkan USERNAME User yang mau dijadikan Admin: ").strip()
    
    if not username:
        print("❌ Username tidak boleh kosong!")
        return

    # Kirim payload sesuai main.py (username & secret_key)
    payload = {
        "username": username,
        "secret_key": MASTER_KEY
    }

    try:
        # Kirim request ke backend
        response = requests.post(API_URL, params=payload)
        
        if response.status_code == 200:
            print(f"\n✅ SUKSES! User '{username}' sekarang sudah menjadi ADMIN.")
            print("Silakan login ulang di website untuk akses dashboard.")
        else:
            print(f"\n❌ GAGAL! Error {response.status_code}:")
            print(response.json())
            
    except Exception as e:
        print(f"\n❌ ERROR KONEKSI: {e}")
        print("Pastikan backend menyala di http://localhost:8000")

if __name__ == "__main__":
    make_user_admin()