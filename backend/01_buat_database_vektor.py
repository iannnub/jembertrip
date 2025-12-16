# 01_buat_database_vektor.py
import pandas as pd
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings # Sudah benar
from langchain_core.documents import Document
import os
import shutil

print("🚀 Mulai proses pembuatan Knowledge Base (v1.2)...")

# --- 0. Definisi Path ---
# Pastikan path ini sudah benar
# ./db_jembertrip -> artinya folder 'db_jembertrip' akan dibuat di level yg SAMA dgn script ini
persist_directory = './db_jembertrip' 
# ../data/ -> artinya folder 'data' ada di SATU LEVEL DI ATAS folder 'backend'
csv_path = '../data/destinasi_processed.csv' 

if not os.path.exists(csv_path):
    print(f"❌ Error: File {csv_path} tidak ditemukan!")
    print(f"Lokasi script saat ini: {os.getcwd()}")
    print("Pastikan 'destinasi_processed.csv' ada di dalam folder 'data/'")
else:
    try:
        # --- 1. Persiapan Lingkungan (Hapus DB Lama) ---
        if os.path.exists(persist_directory):
            print(f"🧹 Menghapus database lama di '{persist_directory}'...")
            shutil.rmtree(persist_directory)

        # --- 2. Load Data dari CSV ---
        # Fix: Tambah encoding='utf-8' dan ganti NaN
        df = pd.read_csv(csv_path, encoding='utf-8') 
        df = df.fillna("") # SUPER PENTING: Ganti NaN jadi string kosong
        
        if df.empty:
            print("❌ Peringatan: File CSV berhasil dibaca, tapi tidak ada datanya (kosong).")
            print("Proses dihentikan.")
        else:
            print(f"✅ Sukses load {len(df)} baris data destinasi dari CSV.")

            # --- 3. Ubah DataFrame jadi 'Document' LangChain ---
            print("🔄 Mengubah data (DataFrame) menjadi format Document LangChain...")
            documents = []
            for _, row in df.iterrows():
                
                # Strategi Content: Gabungkan semua info teks yg relevan
                # Ini akan jadi "tubuh" dokumen yang akan di-embed
                content = (
                    f"Nama Wisata: {row['nama_wisata']}. "
                    f"Kategori: {row['kategori']}. "
                    f"Alamat: {row['alamat']}. "
                    f"Deskripsi: {row['deskripsi']}. "
                    f"Fitur: {row['fitur_bersih']}"
                )
                
                # Metadata: Simpan data "tambahan" yg tidak perlu di-embed,
                # tapi penting untuk ditampilkan ke user nanti.
                metadata = {
                    "id": str(row['id']),
                    "nama_wisata": str(row['nama_wisata']),
                    "kategori": str(row['kategori']),
                    "alamat": str(row['alamat']),
                    "gambar": str(row['gambar']) # Path gambar disimpan di metadata
                }
                documents.append(Document(page_content=content, metadata=metadata))

            print(f"✅ Sukses mengubah {len(documents)} dokumen.")
            print("--- Contoh 1 Dokumen yang akan disimpan ---")
            print(documents[0].page_content)
            print(f"Metadata: {documents[0].metadata}")
            print("------------------------------------------")


            # --- 4. Siapkan Model Embedding ---
            print("🧠 Mempersiapkan model embedding (all-MiniLM-L6-v2)...")
            # ⭐ UPGRADE: Tambah model_kwargs={'device': 'cpu'}
            # Ini untuk "memaksa" model jalan di CPU. 
            # Mencegah error jika kamu tidak punya GPU/CUDA yg ter-setup.
            embedding_model = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'}
            )
            print("✅ Model embedding siap (running di CPU).")

            # --- 5. Buat & Simpan Vector Store ---
            print(f"💾 Membuat dan menyimpan Vector Store di '{persist_directory}'...")
            
            vector_db = Chroma.from_documents(
                documents=documents, 
                embedding=embedding_model, 
                persist_directory=persist_directory
            )
            
            # Fix: Menambahkan .persist() untuk memastikan data tersimpan ke disk
            vector_db.persist()
            print("✅ Database berhasil di-persist (disimpan)!")
            
            print("\n" + "="*40)
            print("🎉 SELAMAT! 'Otak' AI (Vector Store) BERHASIL DIBUAT!")
            print(f"Folder '{persist_directory}' sudah terisi.")
            print("="*40)

            # --- 6. Tes Pencarian (Sangat Direkomendasikan) ---
            print("\n🕵️  Melakukan tes pencarian cepat...")
            # Kita tes query yang mengandung lokasi (dari 'alamat' yg kamu tambahkan)
            query = "wisata di Arjasa" 
            print(f"Mencari untuk query: '{query}'")
            
            search_results = vector_db.similarity_search(query, k=2) 
            
            if search_results:
                print(f"✅ Tes Sukses! Menemukan {len(search_results)} hasil mirip:")
                for i, doc in enumerate(search_results):
                    print(f"\n--- HASIL {i+1} ---")
                    print(f"Nama: {doc.metadata.get('nama_wisata')}")
                    print(f"Alamat: {doc.metadata.get('alamat')}")
                    print(f"Isi: {doc.page_content[:100]}...") # Tampilkan 100 char pertama
            else:
                print("❌ Tes Gagal! Tidak ada hasil tes yang ditemukan.")
                print("Ini ANEH. Coba cek isi CSV-mu, apakah ada data 'Arjasa'?")
                
            print("\nLangkah 1 Selesai (v1.2). Kamu siap ke langkah 2!")

    except Exception as e:
        print(f"❌❌❌ Terjadi error besar saat eksekusi: {e}")
        import traceback
        traceback.print_exc() # Cetak traceback lengkap untuk debug