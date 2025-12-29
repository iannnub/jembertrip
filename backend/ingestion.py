import os
import pandas as pd
import shutil
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# --- CONFIG PATH ---
PDF_PATH = "datasets"            # Folder PDF lo
CSV_PATH = "data/destinasi_final.csv"
CHROMA_PATH = "db_jembertrip_v2"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

def run_ingestion():
    print("🚀 Rebuilding Vector DB (PDF + CSV)...")
    
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)
        print("🧹 DB lama dihapus.")

    embeddings = HuggingFaceEmbeddings(model_name=MODEL_NAME)
    all_docs = []

    # --- 1. PROSES PDF (KNOWLEDGE BASE) ---
    if os.path.exists(PDF_PATH):
        print(f"📄 Reading PDFs from {PDF_PATH}...")
        loader = DirectoryLoader(PDF_PATH, glob="./*.pdf", loader_cls=PyPDFLoader)
        pdf_docs = loader.load()
        
        # Pecah PDF jadi chunks biar AI gampang carinya
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )
        pdf_chunks = splitter.split_documents(pdf_docs)
        
        # Tambahin label biar AI tau ini sumbernya dari PDF
        for chunk in pdf_chunks:
            chunk.metadata["type"] = "knowledge"
        
        all_docs.extend(pdf_chunks)
        print(f"✅ {len(pdf_chunks)} chunks dari PDF masuk.")

    # --- 2. PROSES CSV (TOURISM DATA) ---
    if os.path.exists(CSV_PATH):
        print(f"📊 Reading CSV from {CSV_PATH}...")
        df = pd.read_csv(CSV_PATH).fillna("")
        
        for _, row in df.iterrows():
            content = f"Wisata: {row['nama_wisata']}. Kategori: {row['kategori']}. Deskripsi: {row['deskripsi']}. Alamat: {row['alamat']}"
            
            # Metadata lengkap buat Frontend
            metadata = {
                "id": str(row['id']),
                "nama_wisata": str(row['nama_wisata']),
                "kategori": str(row['kategori']),
                "gambar": str(row['gambar']),
                "alamat": str(row['alamat']),
                "deskripsi": str(row['deskripsi']),
                "harga_tiket": str(row['harga_tiket']),
                "type": "tourism" # Bedain sama PDF
            }
            all_docs.append(Document(page_content=content, metadata=metadata))
        print(f"✅ Data Wisata CSV masuk.")

    # --- 3. SAVE TO CHROMA ---
    if all_docs:
        vector_db = Chroma.from_documents(
            documents=all_docs, 
            embedding=embeddings, 
            persist_directory=CHROMA_PATH
        )
        print(f"✨ SUCCESS! Total {len(all_docs)} dokumen siap tempur di {CHROMA_PATH}!")
    else:
        print("❌ Error: Gak ada data yang kebaca sama sekali!")

if __name__ == "__main__":
    run_ingestion()