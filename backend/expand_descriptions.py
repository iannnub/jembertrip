import os
import pandas as pd
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Setup Groq clients
api_keys = []
for i in range(1, 18):
    key = os.getenv(f"GROQ_API_KEY_{i}")
    if key: api_keys.append(key)

clients = [Groq(api_key=key) for key in api_keys]

def generate_long_desc(nama_wisata, kategori, alamat, client_idx):
    client = clients[client_idx % len(clients)]
    prompt = f"""Tuliskan deskripsi wisata yang SANGAT DETAIL, panjang, menarik, dan informatif untuk destinasi wisata {nama_wisata} di Jember.
Kategori: {kategori}
Lokasi: {alamat}

Instruksi wajib:
1. Tulis dalam 2 hingga 3 paragraf panjang.
2. Jelaskan daya tarik utamanya, suasana, pemandangan, dan aktivitas yang bisa dilakukan.
3. Gunakan bahasa yang profesional namun mengundang (cocok untuk website travel).
4. JANGAN gunakan salam pembuka/penutup. Langsung berikan teks deskripsinya.
5. JANGAN gunakan tanda asteris (*) atau formatting markdown tebal/miring berlebihan."""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating for {nama_wisata}: {e}")
        return None

def main():
    print("Membaca destinasi_final.csv...")
    df = pd.read_csv("data/destinasi_final.csv")
    
    print(f"Memproses {len(df)} destinasi...")
    for i, row in df.iterrows():
        nama = row['nama_wisata']
        # If it's already long enough, skip it (e.g. > 400 chars)
        if isinstance(row['deskripsi'], str) and len(row['deskripsi']) > 500:
            print(f"[{i+1}/{len(df)}] {nama} - Sudah cukup panjang.")
            continue
            
        print(f"[{i+1}/{len(df)}] Men-generate ulang deskripsi untuk: {nama}")
        new_desc = generate_long_desc(nama, row['kategori'], row['alamat'], i)
        
        if new_desc:
            # clean up asterisks just in case
            new_desc = new_desc.replace("**", "").replace("*", "")
            df.at[i, 'deskripsi'] = new_desc
            
        time.sleep(0.5) # avoid rapid rate limiting
        
        # Save every 5 iterations to not lose progress
        if (i + 1) % 5 == 0:
            df.to_csv("data/destinasi_final.csv", index=False)
            
    df.to_csv("data/destinasi_final.csv", index=False)
    print("Selesai memperbarui semua deskripsi!")

if __name__ == "__main__":
    main()
