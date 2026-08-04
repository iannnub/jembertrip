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
    KB_PATH = "data/knowledge_base.csv"   # <- FAQ, transportasi, kontak darurat, dll
    PDF_FOLDER = "datasets"
    CHROMA_PATH = "db_jembertrip_v2"
    
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)
        print("[INFO] Memulai index ulang dari nol...")

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    all_docs = []

    # --- 1. PROSES PDF (Ilmu Chatbot & Konteks Umum Jember) ---
    if os.path.exists(PDF_FOLDER):
        print(f"[PDF] Membaca PDF dari {PDF_FOLDER}...")
        loader = DirectoryLoader(PDF_FOLDER, glob="./*.pdf", loader_cls=PyPDFLoader)
        pdf_docs = loader.load()
        
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        pdf_chunks = splitter.split_documents(pdf_docs)
        
        for chunk in pdf_chunks:
            chunk.metadata = {"type": "knowledge", "source": chunk.metadata.get("source")}
            all_docs.append(chunk)
        print(f"[OK] {len(pdf_chunks)} potongan teks PDF masuk.")

    # --- 2. PROSES KNOWLEDGE BASE CSV (KRITIS: transportasi, kontak, kuliner, info) ---
    # CATATAN: File ini wajib diproses agar chatbot tidak mengarang fakta penting!
    if os.path.exists(KB_PATH):
        print(f"[KB] Membaca Knowledge Base dari {KB_PATH}...")
        kb_df = pd.read_csv(KB_PATH).fillna("")
        kb_count = 0
        for _, row in kb_df.iterrows():
            # Gunakan kolom 'content' sebagai teks RAG (paling informatif)
            content = str(row.get("content", row.get("deskripsi", "")))
            if not content.strip():
                continue
            doc = Document(
                page_content=content,
                metadata={
                    "type": "knowledge",
                    "id": str(row.get("id", "")),
                    "topik": str(row.get("topik", "")),
                    "source": "knowledge_base.csv"
                }
            )
            all_docs.append(doc)
            kb_count += 1
        print(f"[OK] {kb_count} entri Knowledge Base masuk ke index.")
    else:
        print(f"[WARNING] {KB_PATH} tidak ditemukan! Chatbot akan rawan halusinasi.")

    # --- 3. PROSES CSV DESTINASI (Untuk Chatbot + Frontend) ---
    if os.path.exists(CSV_PATH):
        print(f"[CSV] Membaca CSV Destinasi dari {CSV_PATH}...")
        df = pd.read_csv(CSV_PATH).fillna("Tidak ada data")
        for _, row in df.iterrows():
            content = f"Nama: {row['nama_wisata']}. Kategori: {row['kategori']}. Deskripsi: {row['deskripsi']}. Lokasi: {row['alamat']}."
            metadata = {
                "id": str(row['id']),
                "nama_wisata": str(row['nama_wisata']),
                "kategori": str(row['kategori']),
                "gambar": str(row['gambar']),
                "alamat": str(row['alamat']),
                "type": "tourism"
            }
            all_docs.append(Document(page_content=content, metadata=metadata))
        print(f"[OK] {len(df)} Data Destinasi Wisata masuk.")

    # --- 4. SIMPAN KE VECTOR DB ---
    vector_db = Chroma.from_documents(documents=all_docs, embedding=embeddings, persist_directory=CHROMA_PATH)
    print(f"\n[DONE] INGESTION SELESAI! Total {len(all_docs)} dokumen berhasil diindeks ke ChromaDB.")

if __name__ == "__main__":
    run_ingestion()