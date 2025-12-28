import os
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from dotenv import load_dotenv

load_dotenv()

PATH_DATASETS = "./datasets" 
PATH_DB_VEKTOR = "db_jembertrip_v2" # 
NAMA_MODEL_EMBEDDING = "sentence-transformers/all-MiniLM-L6-v2" # 

def run_ingestion():
    print("🚀 Fase 2: Memulai Ingestion PDF Jember...")

    if not os.path.exists(PATH_DATASETS):
        print(f"❌ Error: Folder {PATH_DATASETS} gak ada! Buat dulu foldernya.")
        return
        
    print(f"📂 Membaca file PDF dari {PATH_DATASETS}...")
    loader = DirectoryLoader(PATH_DATASETS, glob="./*.pdf", loader_cls=PyPDFLoader)
    documents = loader.load()
    print(f"✅ Berhasil muat {len(documents)} halaman dari dataset PDF.")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=150,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.split_documents(documents)
    print(f"✂️  Teks dipecah menjadi {len(chunks)} bagian (chunks).")

    print(f"🔢 Menggunakan model embedding: {NAMA_MODEL_EMBEDDING}")
    embeddings = HuggingFaceEmbeddings(model_name=NAMA_MODEL_EMBEDDING)
    
    print(f"📥 Menyimpan ke Vector Database di: {PATH_DB_VEKTOR}...")
    vector_db = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=PATH_DB_VEKTOR
    )
    
    print(f"✨ SUCCESS! Otak AI Jember dari PDF sudah siap digunakan!")

if __name__ == "__main__":
    run_ingestion()