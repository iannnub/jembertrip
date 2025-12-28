# src/main.py

import os
import shutil 
import time
import uvicorn
import logging
import pandas as pd
import random
import re
import string
import difflib
from datetime import datetime
from typing import Optional, List, Dict, Any

# --- FASTAPI IMPORTS ---
from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer 
from fastapi.staticfiles import StaticFiles 
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func 
from jose import JWTError, jwt 
from dotenv import load_dotenv

# --- AI & LANGCHAIN ---
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq 
from langchain_core.prompts import ChatPromptTemplate

# --- DATABASE SETUP ---
import models 
from database import engine, get_db, SessionLocal
import security

# Load Environment
load_dotenv()
models.Base.metadata.create_all(bind=engine)
logger = logging.getLogger("uvicorn")

app = FastAPI(
    title="JemberTrip AI API",
    description="API: V25.3 - Phase 3 Logic (Pandalungan Mapping, Intent Guard, Anti-Hallucination)",
    version="25.3.0"
)

# ==========================================
#          DICTIONARY PANDALUNGAN
# ==========================================
# Pilar 2: Menormalisasi istilah lokal agar dipahami model Embedding
PANDALUNGAN_MAPPING = {
    "nandi": "dimana",
    "ndi": "dimana",
    "nggon": "tempat",
    "dolan": "wisata",
    "mangan": "kuliner",
    "wenak": "enak",
    "mbois": "keren",
    "apik": "bagus",
    "tretan": "teman",
    "lur": "teman",
    "kancah": "teman",
    "rek": "teman",
    "panganan": "makanan",
    "mlaku-mlaku": "jalan-jalan",
    "ngopi": "kafe",
    "dhuk": "jauh",
    "parak": "dekat",
    "isun": "saya",
    "engkok": "saya",
    "reang": "saya",
    "kakeh": "kamu",
    "riko": "kamu",
    "mancall": "berangkat",
    "ngosek": "beristirahat"
}

def normalize_pandalungan(text: str) -> str:
    """Fungsi untuk menerjemahkan slang Jember ke bahasa Indonesia formal"""
    text = text.lower()
    for slang, formal in PANDALUNGAN_MAPPING.items():
        # Menggunakan regex agar hanya mengganti kata yang berdiri sendiri
        text = re.sub(rf'\b{slang}\b', formal, text)
    return text

# ==========================================
#           AUTO-ADMIN GENERATOR
# ==========================================
@app.on_event("startup")
def create_default_admin():
    db = SessionLocal()
    try:
        existing_admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not existing_admin:
            new_admin = models.User(
                username="admin",
                email="admin@jembertrip.com",
                full_name="Super Admin",
                hashed_password=security.get_password_hash("adminn"), 
                role="admin",
                avatar=""
            )
            db.add(new_admin); db.commit()
            print("✅ SUKSES! Admin default created (admin/adminn)")
    except Exception as e:
        print(f"❌ Gagal membuat admin: {e}")
    finally:
        db.close()

# --- KONFIGURASI GAMBAR ---
os.makedirs("uploads", exist_ok=True)
app.mount("/images", StaticFiles(directory="uploads"), name="images")

# --- CORS ---
origins = ["*"] # Sesuaikan untuk production
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=True, 
    allow_methods=["*"], allow_headers=["*"]
)

# --- GLOBAL VARS ---
NAMA_MODEL_EMBEDDING = "sentence-transformers/all-MiniLM-L6-v2"
PATH_DB_VEKTOR = "db_jembertrip_v2"
PATH_CSV_DATA = "data/destinasi_final.csv" 
PATH_KNOWLEDGE_BASE = "data/knowledge_base.csv"

vector_db = None
embedding_model = None
data_wisata_csv = [] 
GROQ_API_KEYS = []
current_key_index = 0
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ==========================================
#               STARTUP EVENT
# ==========================================
@app.on_event("startup")
def startup_event():
    global vector_db, embedding_model, data_wisata_csv, GROQ_API_KEYS
    logger.info("--- SERVER STARTUP v25.3 ---")

    # Load Keys
    for i in range(1, 21):
        key = os.getenv(f"GROQ_API_KEY_{i}")
        if key: GROQ_API_KEYS.append(key)
    if not GROQ_API_KEYS and os.getenv("GROQ_API_KEY"):
        GROQ_API_KEYS.append(os.getenv("GROQ_API_KEY"))

    try:
        embedding_model = HuggingFaceEmbeddings(model_name=NAMA_MODEL_EMBEDDING)
        vector_db = Chroma(persist_directory=PATH_DB_VEKTOR, embedding_function=embedding_model)

        final_csv_path = PATH_CSV_DATA if os.path.exists(PATH_CSV_DATA) else f"../{PATH_CSV_DATA}"
        if os.path.exists(final_csv_path):
            df = pd.read_csv(final_csv_path).fillna("")
            if 'id' in df.columns: df['id'] = df['id'].astype(str)
            data_wisata_csv = df.to_dict('records')

    except Exception as e:
        logger.error(f"Startup Error: {e}")

# ==========================================
#             HELPER FUNCTIONS
# ==========================================
def get_groq_llm():
    global GROQ_API_KEYS, current_key_index
    if not GROQ_API_KEYS: raise HTTPException(500, "No API Key")
    key = GROQ_API_KEYS[current_key_index]
    current_key_index = (current_key_index + 1) % len(GROQ_API_KEYS)
    return ChatGroq(temperature=0.5, model_name="llama-3.3-70b-versatile", api_key=key) 

def save_csv_changes():
    df = pd.DataFrame(data_wisata_csv)
    target_path = PATH_CSV_DATA if os.path.exists(PATH_CSV_DATA) else f"../{PATH_CSV_DATA}"
    df.to_csv(target_path, index=False)

# ==========================================
#               PYDANTIC MODELS
# ==========================================
class UserCreate(BaseModel):
    username: str; email: str; password: str; full_name: str
class UserLogin(BaseModel):
    username: str; password: str
class UserUpdate(BaseModel):
    full_name: str; email: str
class PasswordChange(BaseModel):
    old_password: str; new_password: str
class GenerateDescRequest(BaseModel):
    nama_wisata: str; kategori: str
class ChatRequest(BaseModel):
    question: str
    session_id: Optional[int] = None
    language: str = "id" 
class RecommendationRequest(BaseModel):
    query: str; k: int = 5
class ChatMessageResponse(BaseModel):
    id: int; session_id: int; sender: str; content: str
    recommendations: Optional[List[Dict[str, Any]]] = None; sources: Optional[List[str]] = None
    timestamp: datetime
    class Config: from_attributes = True
class ChatSessionResponse(BaseModel):
    id: int; title: str; created_at: datetime
    class Config: from_attributes = True
class HistoryCreate(BaseModel):
    wisata_id: str; wisata_name: str

# ==========================================
#           AUTH & USER ENDPOINTS
# ==========================================
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub") 
        if username is None: raise HTTPException(401, "Invalid token")
    except JWTError: raise HTTPException(401, "Invalid token")
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None: raise HTTPException(401, "User not found")
    return user

def get_current_admin(user: models.User = Depends(get_current_user)):
    if user.role != "admin": raise HTTPException(403, "Khusus Admin!")
    return user

@app.post("/api/auth/register", status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(400, "Username sudah dipakai!")
    new_user = models.User(
        username=user.username, email=user.email, full_name=user.full_name, 
        hashed_password=security.get_password_hash(user.password), role="user"
    )
    db.add(new_user); db.commit()
    return {"status": "success"}

@app.post("/api/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not security.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(401, "Username atau Password salah")
    token = security.create_access_token({"sub": db_user.username, "id": db_user.id, "role": db_user.role})
    return {
        "status": "success", "access_token": token, 
        "user": {
            "username": db_user.username, "full_name": db_user.full_name,
            "email": db_user.email, "role": db_user.role, "avatar": db_user.avatar
        }
    }

# =========================================================
#       CHAT RAG ENGINE (SMART GUARDRAILS & LOGIC)
# =========================================================
@app.post("/api/v1/chat")
def chat_rag(req: ChatRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    global vector_db, data_wisata_csv
    try:
        llm = get_groq_llm()
        
        # 1. Handle Session
        session_id = req.session_id
        if not session_id:
            new_session = models.ChatSession(user_id=current_user.id, title=req.question[:30])
            db.add(new_session); db.commit(); db.refresh(new_session)
            session_id = new_session.id

        # 2. PILAR 2: Normalisasi Pandalungan (Pre-processing)
        raw_question = req.question
        processed_question = normalize_pandalungan(raw_question)
        
        # 3. PILAR 3: Intent Classification & Domain Check (Satpam Jember)
        # Jika nanya kota selain Jember, langsung tangkis di awal
        out_of_jember_patterns = ["malang", "surabaya", "banyuwangi", "bali", "jakarta", "bandung", "jogja"]
        if any(city in processed_question.lower() for city in out_of_jember_patterns):
            answer = "Waduh Sapurane Tretan, JemberTrip ini asisten khusus buat muter-muter di Jember aja. Kalau mau info Pantai Papuma atau Puncak Rembangan, saya jagonya! Mau cek wisata Jember aja?"
            return {"status": "success", "session_id": session_id, "answer": answer, "recommendations": []}

        # 4. Ambil History Chat
        recent_chats = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.timestamp.desc()).limit(4).all()
        history_text = "\n".join([f"{msg.sender.upper()}: {msg.content}" for msg in reversed(recent_chats)])

        # 5. PILAR 1 & 4: Retrieval dengan Thresholding (Anti-Ngaco)
        # Cari data dengan score relevansi
        docs_with_score = vector_db.similarity_search_with_relevance_scores(processed_question, k=5)
        
        # Filter docs yang score-nya di atas 0.4 (Thresholding)
        filtered_docs = [doc for doc, score in docs_with_score if score >= 0.35]
        
        # Ekstrak data metadata untuk kartu
        final_recs = []
        context_list = []
        for doc in filtered_docs:
            if 'nama_wisata' in doc.metadata:
                final_recs.append(doc.metadata)
                context_list.append(f"WISATA: {doc.metadata['nama_wisata']} | Kategori: {doc.metadata['kategori']} | Alamat: {doc.metadata['alamat']} | Deskripsi: {doc.metadata['deskripsi']}")
            elif 'answer' in doc.metadata:
                context_list.append(f"KNOWLEDGE: {doc.metadata['answer']}")
            else:
                context_list.append(doc.page_content)

        context_text = "\n".join(context_list) if context_list else "Data tidak ditemukan di database resmi."

        # 6. Pilar 4: Smart Filtering (Weather/Condition Logic)
        is_raining = any(x in processed_question.lower() for x in ["hujan", "udan", "gerimis", "mendung"])
        is_healing = any(x in processed_question.lower() for x in ["healing", "stres", "capek", "pusing", "mumet"])

        # 7. Prompt Engineering (The Middle Brain Instruction)
        system_prompt = f"""
        Kamu adalah 'Cak Jember', asisten AI resmi dari JemberTrip.
        Tugasmu membantu wisatawan mengeksplorasi Jember dengan gaya Gen Z yang cerdas dan santai.
        
        DATA TERSEDIA (CONTEXT):
        {context_text}
        
        ATURAN KETAT (GUARDRAILS):
        1. Jika data di CONTEXT tidak relevan atau kosong, katakan dengan jujur bahwa info tersebut belum ada di database JemberTrip. JANGAN MENGARANG.
        2. Hanya bahas area Kabupaten Jember.
        3. Jika user mengeluh HUJAN: JANGAN sarankan Pantai atau Wisata Alam terbuka. Sarankan tempat indoor/kafe.
        4. Jika user mengeluh STRES/HEALING: Sarankan wisata alam yang tenang.
        5. Gunakan sapaan khas seperti 'Tretan', 'Lur', atau 'Bestie'.
        
        RIWAYAT CHAT:
        {history_text}
        
        BAHASA: Gunakan bahasa {req.language} (Jika 'jowo' gunakan dialek Jemberan, jika 'madura' gunakan dialek Pandalungan).
        """

        prompt_template = ChatPromptTemplate.from_messages([("system", system_prompt), ("human", "{question}")])
        chain = prompt_template | llm
        ai_response = chain.invoke({"question": processed_question})
        
        final_answer = ai_response.content

        # 8. Simpan ke Database
        db.add(models.ChatMessage(session_id=session_id, sender="user", content=raw_question))
        db.add(models.ChatMessage(session_id=session_id, sender="ai", content=final_answer, recommendations=final_recs[:4]))
        db.commit()

        return {
            "status": "success", 
            "session_id": session_id, 
            "answer": final_answer, 
            "recommendations": final_recs[:4]
        }

    except Exception as e:
        logger.error(str(e))
        raise HTTPException(500, f"Error pada mesin AI: {str(e)}")

# ==========================================
#           OTHER ENDPOINTS
# ==========================================
@app.get("/api/v1/list-wisata")
def list_wisata():
    return {"status": "success", "data": data_wisata_csv}

@app.get("/api/v1/wisata/{id}")
def detail_wisata(id: str):
    res = next((i for i in data_wisata_csv if str(i["id"]) == id), None)
    if res: return {"status": "success", "data": res}
    raise HTTPException(404, "Not found")

@app.get("/api/chat/sessions")
def get_sessions(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(models.ChatSession).filter(models.ChatSession.user_id == user.id).order_by(models.ChatSession.created_at.desc()).all()
    return {"status": "success", "data": sessions}

@app.get("/api/chat/{sid}/messages")
def get_messages(sid: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == sid).order_by(models.ChatMessage.timestamp.asc()).all()
    return {"status": "success", "data": messages}

# --- ADMIN ENDPOINTS ---
@app.post("/api/admin/generate-desc")
def generate_description_ai(req: GenerateDescRequest, admin_user: models.User = Depends(get_current_admin)):
    try:
        llm = get_groq_llm()
        prompt = f"Buatkan deskripsi wisata Jember yang sangat menarik, puitis, dan estetik untuk: {req.nama_wisata} ({req.kategori}). Gunakan gaya Gen Z."
        response = llm.invoke(prompt)
        return {"status": "success", "description": response.content}
    except Exception: raise HTTPException(500, "Gagal generate.")

@app.post("/api/admin/add-wisata")
def add_wisata_admin(
    nama_wisata: str = Form(...), 
    deskripsi: str = Form(...), 
    kategori: str = Form(...), 
    alamat: str = Form(...), 
    harga_tiket: str = Form(...), 
    gambar: UploadFile = File(None), 
    admin_user: models.User = Depends(get_current_admin)
):
    global data_wisata_csv, vector_db
    try:
        filename = ""
        if gambar:
            clean = f"{int(time.time())}_{gambar.filename.replace(' ', '_')}"
            path = f"uploads/{clean}"
            with open(path, "wb") as buffer: shutil.copyfileobj(gambar.file, buffer)
            filename = f"http://127.0.0.1:8000/images/{clean}"
        
        new_id = str(len(data_wisata_csv) + 1)
        new_entry = {
            "id": new_id, "nama_wisata": nama_wisata, "deskripsi": deskripsi, 
            "kategori": kategori, "alamat": alamat, "harga_tiket": harga_tiket, "gambar": filename
        }
        data_wisata_csv.append(new_entry)
        save_csv_changes()
        
        # Add to Vector DB
        combined = f"{nama_wisata} {kategori} {deskripsi} {alamat}"
        vector_db.add_texts(texts=[combined], metadatas=[new_entry])
        
        return {"status": "success", "data": new_entry}
    except Exception as e: raise HTTPException(500, str(e))

@app.delete("/api/admin/wisata/{id}")
def delete_wisata_admin(id: str, admin_user: models.User = Depends(get_current_admin)):
    global data_wisata_csv
    data_wisata_csv = [d for d in data_wisata_csv if str(d['id']) != id]
    save_csv_changes()
    return {"status": "success", "message": "Dihapus"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)