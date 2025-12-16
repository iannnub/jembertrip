import os
import pandas as pd
import time
from langchain_groq import ChatGroq
from dotenv import load_dotenv

# ==========================================
# 🔍 BAGIAN DEBUGGING PATH (ANTI NYASAR)
# ==========================================
print("--- 🕵️‍♂️ MEMULAI DIAGNOSA PATH ---")

# 1. Cek di mana terminal lo berada sekarang
current_terminal_dir = os.getcwd()
print(f"📍 Terminal sedang berada di: {current_terminal_dir}")

# 2. Cek lokasi file script ini berada
script_location = os.path.dirname(os.path.abspath(__file__))
# Mundur satu folder ke folder 'backend'
backend_dir_from_script = os.path.dirname(script_location)

# 3. Tentukan target pencarian .env
possible_paths = [
    os.path.join(current_terminal_dir, ".env"),       # Cek di folder backend (tempat terminal)
    os.path.join(backend_dir_from_script, ".env"),    # Cek relatif dari script
    ".env",                                           # Cek default
]

env_found = False
for path in possible_paths:
    if os.path.exists(path):
        print(f"✅ HORE! File .env ditemukan di: {path}")
        load_dotenv(path) # LOAD FILE DISINI
        env_found = True
        break
    else:
        print(f"❌ Tidak ada .env di: {path}")

if not env_found:
    print("\n⚠️ FATAL ERROR: File .env benar-benar tidak terdeteksi oleh Python.")
    print("👉 Pastikan nama filenya '.env' (bukan .env.txt atau .env.dev)")
    exit()

print("--- DIAGNOSA SELESAI ---\n")

# ==========================================
# 🔑 LOAD API KEYS (MULTI-KEY ROTATION)
# ==========================================
GROQ_API_KEYS = []

for i in range(1, 21): # Loop cari key 1-20
    key_name = f"GROQ_API_KEY_{i}"
    key_value = os.getenv(key_name)
    if key_value:
        GROQ_API_KEYS.append(key_value)

print(f"🔑 Berhasil memuat {len(GROQ_API_KEYS)} API Keys dari .env")

if not GROQ_API_KEYS:
    print("❌ Masalah baru: File .env ketemu, TAPI isinya tidak terbaca atau nama variabel salah!")
    print("👉 Pastikan isi .env formatnya: GROQ_API_KEY_1=gsk_...")
    exit()

# ==========================================
# 🤖 FUNGSI REWRITE AI
# ==========================================
def rewrite_description(row, index):
    nama = row['nama_wisata']
    kategori = row['kategori']
    deskripsi_lama = row['deskripsi']
    
    # PILIH KEY BERDASARKAN GILIRAN (Round Robin)
    current_key = GROQ_API_KEYS[index % len(GROQ_API_KEYS)]
    
    llm = ChatGroq(
        temperature=0.7, 
        model_name="llama-3.3-70b-versatile", 
        api_key=current_key
    )
    
    prompt = f"""
    Kamu adalah Travel Writer profesional untuk aplikasi JemberTrip.
    Tulis ulang deskripsi tempat wisata ini agar menarik, emosional, dan informatif.
    
    Data:
    - Nama: {nama}
    - Kategori: {kategori}
    - Info Asli: {deskripsi_lama}
    
    Instruksi:
    1. Maksimal 3-4 kalimat.
    2. Jelaskan suasananya (vibe), aktivitas utama, dan cocok untuk siapa.
    3. Gunakan Bahasa Indonesia yang luwes, gaul dikit boleh, tapi tetap sopan.
    4. Langsung berikan deskripsi tanpa kata pengantar.
    """
    
    try:
        # Delay dikit biar gak spamming server Groq
        time.sleep(0.5) 
        response = llm.invoke(prompt)
        print(f"✅ [{index+1}] Rewrote: {nama}")
        return response.content
    except Exception as e:
        print(f"❌ Error {nama}: {e}")
        return deskripsi_lama 

# ==========================================
# 🚀 EKSEKUSI UTAMA
# ==========================================

# Cari file CSV (Kita cari di 2 kemungkinan tempat biar aman)
csv_target = "data/destinasi_processed.csv"
if not os.path.exists(csv_target):
    csv_target = "../data/destinasi_processed.csv"

if not os.path.exists(csv_target):
    # Coba cari absolut
    csv_target = os.path.join(backend_dir_from_script, "data", "destinasi_processed.csv")

if not os.path.exists(csv_target):
    print(f"❌ File CSV tidak ditemukan! Dicari di: {csv_target}")
    exit()

print(f"🚀 Membaca data dari: {csv_target}")
df = pd.read_csv(csv_target)

# Apply Function
new_descriptions = []
for i, row in df.iterrows():
    res = rewrite_description(row, i)
    new_descriptions.append(res)

df['deskripsi_rag'] = new_descriptions

# Gabungkan Kolom
df['combined_text'] = (
    "Nama: " + df['nama_wisata'] + ". " +
    "Kategori: " + df['kategori'] + ". " +
    "Deskripsi: " + df['deskripsi_rag'] + ". " +
    "Lokasi: " + df['alamat']
)

# Save Hasil
output_filename = "destinasi_final.csv"
# Simpan di folder yang sama dengan inputnya
output_dir = os.path.dirname(csv_target)
output_path = os.path.join(output_dir, output_filename)

df.to_csv(output_path, index=False)

print(f"\n🎉 SUKSES BESAR! Data baru disimpan di: {output_path}")
print("👉 Langkah Selanjutnya: Update 'main.py' untuk membaca file csv baru ini.")