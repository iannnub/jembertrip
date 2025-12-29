import os
import pandas as pd
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

# 1. SETUP PATH SESUAI STRUKTUR LO
load_dotenv()
# Karena script ini biasanya di run dari folder 'backend', maka:
DATA_PATH = "datasets"           # Tempat PDF lo
CSV_PATH = "data/destinasi_final.csv" # Pastikan nama filenya bener ya!
CHROMA_PATH = "db_jembertrip_v2"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

def run_ingestion():
    print("🚀 Memulai Ingestion JemberTrip v25.5...")
    
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    all_docs = []

    # 2. PROSES PDF (DARI FOLDER DATASETS)
    if os.path.exists(DATA_PATH):
        print(f"📄 Memproses PDF di folder: {DATA_PATH}...")
        loader = DirectoryLoader(DATA_PATH, glob="./*.pdf", loader_cls=PyPDFLoader)
        pdf_docs = loader.load()
        
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        pdf_chunks = splitter.split_documents(pdf_docs)
        all_docs.extend(pdf_chunks)
        print(f"✅ {len(pdf_chunks)} chunks dari PDF berhasil dibuat.")

    # 3. PROSES CSV (DARI FOLDER DATA DENGAN METADATA LENGKAP)
    if os.path.exists(CSV_PATH):
        print(f"📊 Memproses CSV di: {CSV_PATH}...")
        df = pd.read_csv(CSV_PATH).fillna("")
        
        for _, row in df.iterrows():
            # Content: Isinya harus lengkap buat dicari AI
            content = f"Nama Wisata: {row['nama_wisata']}. Kategori: {row['kategori']}. Deskripsi: {row['deskripsi']}. Alamat: {row['alamat']}"
            
            # Metadata: Sekarang kita masukin SEMUA field biar Frontend lo dapet data lengkap
            metadata = {
                "id": str(row['id']), # Pastikan ID ada dan jadi string
                "nama_wisata": str(row['nama_wisata']), 
                "kategori": str(row['kategori']),
                "gambar": str(row['gambar']),
                "alamat": str(row['alamat']),
                "deskripsi": str(row['deskripsi']), # WAJIB MASUK biar detail terbaca
                "harga_tiket": str(row['harga_tiket']),
                "source": "destinasi_final.csv"
            }
            
            all_docs.append(Document(page_content=content, metadata=metadata))
        print(f"✅ Data Wisata CSV berhasil dikonversi ke Vector Document.")

    # 4. SIMPAN KE CHROMA DB
    if all_docs:
        if os.path.exists(CHROMA_PATH):
            import shutil
            shutil.rmtree(CHROMA_PATH)
            print("🧹 Database lama dibersihkan.")

        vector_db = Chroma.from_documents(
            documents=all_docs,
            embedding=embeddings,
            persist_directory=CHROMA_PATH
        )
        print(f"✨ DATABASE READY! {len(all_docs)} total data ter-index.")
    else:
        print("❌ Gagal: Folder datasets kosong atau CSV tidak ditemukan!")

if __name__ == "__main__":
    run_ingestion()