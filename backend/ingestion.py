# backend/ingestion.py
import os
import pandas as pd
import shutil
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

def run_ingestion():
    CSV_PATH = "data/destinasi_final.csv"
    PDF_FOLDER = "datasets" # Folder khusus PDF lo
    CHROMA_PATH = "db_jembertrip_v2"
    
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)
        print("🧹 Memulai index ulang dari nol...")

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    all_docs = []

    # --- 1. PROSES PDF (Khusus Ilmu Chatbot) ---
    if os.path.exists(PDF_FOLDER):
        print(f"📄 Membaca PDF dari {PDF_FOLDER}...")
        loader = DirectoryLoader(PDF_FOLDER, glob="./*.pdf", loader_cls=PyPDFLoader)
        pdf_docs = loader.load()
        
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        pdf_chunks = splitter.split_documents(pdf_docs)
        
        for chunk in pdf_chunks:
            # Label 'knowledge' biar gak muncul di UI Wisata
            chunk.metadata = {"type": "knowledge", "source": chunk.metadata.get("source")}
            all_docs.append(chunk)
        print(f"✅ {len(pdf_chunks)} potongan teks PDF masuk.")

    # --- 2. PROSES CSV (Untuk Chatbot + Frontend) ---
    if os.path.exists(CSV_PATH):
        print(f"📊 Membaca CSV dari {CSV_PATH}...")
        df = pd.read_csv(CSV_PATH).fillna("Tidak ada data")
        for _, row in df.iterrows():
            content = f"Nama: {row['nama_wisata']}. Kategori: {row['kategori']}. Deskripsi: {row['deskripsi']}."
            metadata = {
                "id": str(row['id']),
                "nama_wisata": str(row['nama_wisata']),
                "kategori": str(row['kategori']),
                "gambar": str(row['gambar']),
                "alamat": str(row['alamat']),
                "type": "tourism" # Label khusus buat Frontend
            }
            all_docs.append(Document(page_content=content, metadata=metadata))
        print("✅ Data Wisata CSV masuk.")

    # --- 3. SIMPAN KE VECTOR DB ---
    vector_db = Chroma.from_documents(documents=all_docs, embedding=embeddings, persist_directory=CHROMA_PATH)
    print(f"✨ Total {len(all_docs)} dokumen siap tempur!")

if __name__ == "__main__":
    run_ingestion()