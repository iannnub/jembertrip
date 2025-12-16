# 02_tes_query.py
import time
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings

# --- PENTING: Setting ini HARUS SAMA dengan script 01 ---
NAMA_MODEL_EMBEDDING = "all-MiniLM-L6-v2"
PATH_DB_VEKTOR = "db_jembertrip"
# --------------------------------------------------------

def jalankan_query(query_teks):
    """
    Fungsi untuk memuat model, database, dan menjalankan pencarian.
    """
    print("Mulai memuat model embeddings...")
    # 1. Muat model embedding yang SAMA
    #    Ini penting agar 'kode rahasia' (vektor) dari query-mu 
    #    'bahasa'-nya sama dengan yang ada di database.
    try:
        embeddings = SentenceTransformerEmbeddings(
            model_name=NAMA_MODEL_EMBEDDING,
            model_kwargs={'device': 'cpu'} # Paksa pakai CPU jika GPU bermasalah
        )
    except Exception as e:
        print(f"Error saat load embedding model: {e}")
        print("Pastikan kamu punya koneksi internet saat pertama kali load model,")
        print("atau model 'all-MiniLM-L6-v2' sudah ter-cache.")
        return

    print(f"Model '{NAMA_MODEL_EMBEDDING}' berhasil dimuat.")

    # 2. Muat database vektor yang SUDAH ADA
    #    Kita tidak 'membuat' database baru, tapi 'menyambungkan' (load)
    #    ke database yang sudah kamu 'training' di script 01.
    print(f"Mulai memuat database vektor dari '{PATH_DB_VEKTOR}'...")
    try:
        vector_db = Chroma(
            persist_directory=PATH_DB_VEKTOR,
            embedding_function=embeddings
        )
    except Exception as e:
        print(f"Error saat load database vektor: {e}")
        print(f"Pastikan folder '{PATH_DB_VEKTOR}' ada di direktori yang benar.")
        return
    
    print("Database vektor berhasil dimuat.")
    print("---")

    # 3. Lakukan Pencarian (Similarity Search)
    print(f"Menjalankan similarity search untuk query: '{query_teks}'")
    start_time = time.time() # Hitung waktu

    # Ini adalah 'jantung'-nya:
    # k=3 artinya kita minta 3 hasil teratas yang paling mirip.
    hasil_pencarian = vector_db.similarity_search(query_teks, k=3)
    
    end_time = time.time()
    print(f"Pencarian selesai dalam {end_time - start_time:.4f} detik.")
    print("--- HASIL PENCARIAN ---")

    # 4. Tampilkan Hasil
    if not hasil_pencarian:
        print("Tidak ada dokumen yang relevan ditemukan.")
    else:
        for i, doc in enumerate(hasil_pencarian):
            print(f"\n[HASIL KE-{i+1}]")
            
            # Ambil data dari metadata yang PASTI ADA
            nama_wisata = doc.metadata.get('nama_wisata', 'Nama tidak diketahui')
            alamat = doc.metadata.get('alamat', 'Alamat tidak diketahui')
            
            print(f"Nama Wisata: {nama_wisata}")
            print(f"Alamat: {alamat}")
            
            # Tampilkan potongan isi dokumennya
            print("Deskripsi Singkat:")
            print(f"{doc.page_content}") # Tampilkan aja semua, nggak usah dipotong
            
    print("\n--- Selesai ---")

# --- Main Program ---
if __name__ == "__main__":
    # Ganti query ini sesukamu untuk ngetes
    query_user = "Rekomendasi pantai yang sepi di Jember"
    
    jalankan_query(query_user)

    # Kamu bisa tes query lain di sini:
    # print("\n\n--- TES QUERY KEDUA ---")
    # query_user_2 = "Tempat wisata air terjun yang bagus buat foto"
    # jalankan_query(query_user_2)