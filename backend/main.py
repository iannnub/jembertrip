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
    description="API: V24.0 - Grand Refactor (Smart Logic, Gen Z, Safety Guard)",
    version="24.0.0 Final"
)

# ==========================================
#           AUTO-ADMIN GENERATOR
# ==========================================
@app.on_event("startup")
def create_default_admin():
    db = SessionLocal()
    try:
        # Cek user 'admin' sudah ada or jot
        existing_admin = db.query(models.User).filter(models.User.username == "admin").first()
        
        if not existing_admin:
            print("⚠️ ADMIN BELUM ADA! Membuat akun Admin default...")
            
            # Buat akun admin baru
            new_admin = models.User(
                username="admin",
                email="admin@jembertrip.com",
                full_name="Super Admin",
                # Menggunakan password 'adminn' sesuai requestmu
                hashed_password=security.get_password_hash("adminn"), 
                role="admin",
                avatar="" # Kosongkan default avatar
            )
            
            db.add(new_admin)
            db.commit()
            print("✅ SUKSES! Akun Admin dibuat.")
            print("👉 Username: admin")
            print("👉 Password: adminn")
        else:
            print("ℹ️ Akun Admin sudah ada. Aman.")
            
    except Exception as e:
        print(f"❌ Gagal membuat admin otomatis: {e}")
    finally:
        db.close()

# --- KONFIGURASI GAMBAR ---
os.makedirs("uploads", exist_ok=True)
app.mount("/images", StaticFiles(directory="uploads"), name="images")

# --- CORS ---
origins = [
    "http://localhost", "http://localhost:3000", "http://localhost:5173",
    "http://127.0.0.1:3000", "http://127.0.0.1:5173",
    "https://jembertrip.vercel.app"
]
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=True, 
    allow_methods=["*"], allow_headers=["*"]
)

# --- GLOBAL VARS ---
NAMA_MODEL_EMBEDDING = "sentence-transformers/all-MiniLM-L6-v2"
PATH_DB_VEKTOR = "db_jembertrip_v2"
PATH_CSV_DATA = "data/destinasi_final.csv" 
if not os.path.exists(PATH_CSV_DATA) and not os.path.exists(f"../{PATH_CSV_DATA}"):
     PATH_CSV_DATA = "data/destinasi_processed.csv"
PATH_KNOWLEDGE_BASE = "data/knowledge_base.csv"

vector_db = None
embedding_model = None
data_wisata_csv = [] 
GROQ_API_KEYS = []
current_key_index = 0
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ==========================================
#           STARTUP EVENT
# ==========================================

@app.on_event("startup")
def startup_event():
    global vector_db, embedding_model, data_wisata_csv, GROQ_API_KEYS
    logger.info("--- 🚀 SERVER STARTUP: Hybrid Knowledge Engine v25.0 ---")

    # 1. Load API Keys
    GROQ_API_KEYS = []
    count_keys = 0
    for i in range(1, 21):
        key = os.getenv(f"GROQ_API_KEY_{i}")
        if key: 
            GROQ_API_KEYS.append(key)
            count_keys += 1
    if count_keys == 0 and os.getenv("GROQ_API_KEY"):
        GROQ_API_KEYS.append(os.getenv("GROQ_API_KEY"))
        count_keys = 1
    logger.info(f"🔑 Terdeteksi {count_keys} Groq API Keys siap digunakan.")

    # 2. Inisialisasi AI & Vector DB
    try:
        # Load Embedding Model
        embedding_model = HuggingFaceEmbeddings(
            model_name=NAMA_MODEL_EMBEDDING, 
            model_kwargs={'device': 'cpu'}
        )
        
        
        _ = embedding_model.embed_query("warmup jembertrip")

        
        final_csv_path = PATH_CSV_DATA if os.path.exists(PATH_CSV_DATA) else f"../{PATH_CSV_DATA}"
        final_kb_path = PATH_KNOWLEDGE_BASE if os.path.exists(PATH_KNOWLEDGE_BASE) else f"../{PATH_KNOWLEDGE_BASE}"

        # Load ChromaDB
        vector_db = Chroma(persist_directory=PATH_DB_VEKTOR, embedding_function=embedding_model)
        
        # Cek jumlah data saat ini
        db_count = vector_db._collection.count()
        db_is_empty = db_count == 0

        # PROSES DATA WISATA (CSV)
        if os.path.exists(final_csv_path):
            logger.info(f"📊 Membaca Data Destinasi: {final_csv_path}")
            df = pd.read_csv(final_csv_path).fillna("Tidak ada data")
            if 'id' in df.columns: 
                df['id'] = df['id'].astype(str)
            
            # Simpan ke memori untuk kebutuhan list-wisata
            data_wisata_csv = df.to_dict('records')

            # db jembertrip 
            
            if db_is_empty:
                logger.info("📥 Mengisi Vector DB dengan Detail Wisata (CSV)...")
                texts_tourism = []
                metas_tourism = []
                
                for _, row in df.iterrows():
                    
                    content = (
                        f"Nama Wisata: {row['nama_wisata']}. "
                        f"Kategori: {row['kategori']}. "
                        f"Alamat: {row['alamat']}. "
                        f"Deskripsi: {row['deskripsi']}. "
                        f"Harga Tiket: {row['harga_tiket']}."
                    )
                    texts_tourism.append(content)
                    
                    # showcard
                    meta = row.to_dict()
                    meta['type'] = 'tourism' 
                    metas_tourism.append(meta)

                vector_db.add_texts(texts=texts_tourism, metadatas=metas_tourism)
                logger.info(f"✅ {len(texts_tourism)} destinasi dari CSV berhasil di-index.")

        # PROSES KNOWLEDGE BASE
        if os.path.exists(final_kb_path) and db_is_empty:
            logger.info("📥 Mengisi Vector DB dengan Knowledge Base (CSV)...")
            df_kb = pd.read_csv(final_kb_path).fillna("")
            texts_kb = []
            metas_kb = []
            
            for _, row in df_kb.iterrows():
                combined = f"Topik: {row.get('topik', 'Umum')} | Tanya: {row.get('question', '')} | Jawab: {row.get('answer', '')}"
                texts_kb.append(combined)
                metas_kb.append({"type": "knowledge", "topik": row.get('topik', 'Umum'), "content": combined})
            
            vector_db.add_texts(texts=texts_kb, metadatas=metas_kb)
            logger.info(f"✅ {len(texts_kb)} item Knowledge Base berhasil di-index.")

        if not db_is_empty:
            logger.info(f"ℹ️ Vector DB sudah berisi {db_count} item. Menggunakan data yang ada.")

        logger.info("✨ Hybrid Knowledge Engine siap tempur, Lur!")

    except Exception as e:
        logger.error(f"❌ Startup Error: {e}")

# ==========================================
#           HELPER FUNCTIONS
# ==========================================
def get_groq_llm():
    global GROQ_API_KEYS, current_key_index
    if not GROQ_API_KEYS: raise HTTPException(500, "No API Key")
    key = GROQ_API_KEYS[current_key_index]
    current_key_index = (current_key_index + 1) % len(GROQ_API_KEYS)
    
    return ChatGroq(temperature=0.7, model_name="llama-3.3-70b-versatile", api_key=key) 

def save_csv_changes():
    global data_wisata_csv
    if data_wisata_csv:
        df = pd.DataFrame(data_wisata_csv)
        target_path = PATH_CSV_DATA if os.path.exists(PATH_CSV_DATA) else f"../{PATH_CSV_DATA}"
        df.to_csv(target_path, index=False)

# ==========================================
#           MODEL PYDANTIC
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
    wisata_id: str
    wisata_name: str

# ==========================================
#           AUTH FUNCTIONS (RBAC)
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
    if user.role != "admin": raise HTTPException(status_code=403, detail="Akses Ditolak: Khusus Admin!")
    return user

@app.post("/api/auth/setup-admin")
def setup_first_admin(username: str, secret_key: str, db: Session = Depends(get_db)):
    if secret_key != "skripsi2025_master_key": raise HTTPException(403, "Salah kunci master!")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user: raise HTTPException(404, "User tidak ditemukan. Daftar dulu!")
    user.role = "admin"
    db.commit()
    return {"status": "success", "message": f"{username} sekarang adalah ADMIN."}

@app.post("/api/auth/register", status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(400, "Username sudah dipakai!")
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(400, "Email sudah terdaftar!")
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

# ==========================================
#       USER PROFILE & HISTORY
# ==========================================
@app.put("/api/users/me")
def update_profile(data: UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.email != current_user.email:
        if db.query(models.User).filter(models.User.email == data.email).first():
            raise HTTPException(400, "Email sudah digunakan user lain!")
    current_user.full_name = data.full_name
    current_user.email = data.email
    db.commit()
    return {"status": "success", "message": "Profil diperbarui", "user": {"username": current_user.username, "full_name": current_user.full_name, "email": current_user.email, "role": current_user.role, "avatar": current_user.avatar}}

@app.post("/api/users/avatar")
def upload_avatar(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        clean_name = f"avatar_{current_user.id}_{int(time.time())}.jpg" 
        file_location = f"uploads/{clean_name}"
        with open(file_location, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        avatar_url = f"https://jembertrip-api.up.railway.app/images/{clean_name}"
        current_user.avatar = avatar_url
        db.commit()
        return {"status": "success", "avatar_url": avatar_url}
    except Exception as e: raise HTTPException(500, f"Gagal upload: {str(e)}")

@app.put("/api/users/change-password")
def change_password(data: PasswordChange, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not security.verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(400, "Password lama salah!")
    current_user.hashed_password = security.get_password_hash(data.new_password)
    db.commit()
    return {"status": "success", "message": "Password diubah!"}

@app.post("/api/history")
def record_history(item: HistoryCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        new_h = models.History(
            user_id=current_user.id, 
            wisata_id=str(item.wisata_id),
            wisata_name=item.wisata_name, 
            timestamp=datetime.utcnow()
        )
        db.add(new_h); db.commit()
        return {"status": "success"}
    except Exception:
        raise HTTPException(500, "Gagal simpan history")

@app.get("/api/history")
def get_my_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    history_list = db.query(models.History).filter(models.History.user_id == current_user.id).order_by(models.History.timestamp.desc()).limit(10).all()
    return {"status": "success", "data": history_list}

@app.get("/api/v1/recommendations/personal")
def get_personal_recommendations(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """SINKRON DENGAN FRONTEND: Menampilkan 6 Rekomendasi Spesial"""
    global vector_db
    try:
        # 1. Ambil history klik terakhir user
        history = db.query(models.History).filter(models.History.user_id == current_user.id).order_by(models.History.timestamp.desc()).limit(5).all()
        
        if not history:
            return {"status": "success", "data": []}
        
        # 2. Gabungkan nama wisata yang pernah diklik jadi query pencarian AI
        query_text = " ".join([h.wisata_name for h in history])
        
        # 3. Cari kemiripan di Vector DB dengan FILTER 'tourism'
        
        docs = vector_db.similarity_search(
            query_text, 
            k=20, 
            filter={"type": "tourism"}
        )
        
        # 4. Filter agar tidak muncul wisata yang sedang/sudah dilihat
        visited_ids = [str(h.wisata_id) for h in history]
        results = []
        for d in docs:
            
            if str(d.metadata.get('id')) not in visited_ids:
                results.append(d.metadata)
                
        # 5. rekom spesial
        return {"status": "success", "data": results[:6]}
        
    except Exception as e:
        print(f"Error Personal Rek: {e}")
        return {"status": "success", "data": []}
    

    
KAMUS_PANDALUNGAN = {
    "nandi": "dimana", "nang": "ke", "nggon": "tempat", "dolan": "wisata",
    "mangan": "kuliner", "mbadog": "makan", "mbois": "keren", "tretan": "saudara",
    "lur": "teman", "rek": "teman", "kancah": "teman", "nyambi": "sambil",
    "wes": "sudah", "durung": "belum", "penak": "nyaman", "adem": "dingin",
    "asri": "alami", "budhal": "berangkat", "mlaku": "jalan", "ndelok": "melihat",
    "isun": "saya", "engko": "nanti", "badeh": "akan", "saben": "setiap"
}

def pandalungan_normalizer(text: str) -> str:
    """Menerjemahkan dialek lokal ke bahasa Indonesia formal untuk pencarian vektor"""
    words = text.lower().split()
    normalized = [KAMUS_PANDALUNGAN.get(w, w) for w in words]
    return " ".join(normalized)

# Chat dan rekom
# =========================================================

@app.post("/api/v1/chat")
def chat_rag(req: ChatRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    global vector_db, data_wisata_csv
    try:
        llm = get_groq_llm()
        session_id = req.session_id
        
        # 1. Handle Session
        if not session_id:
            new_session = models.ChatSession(user_id=current_user.id, title=req.question[:30])
            db.add(new_session); db.commit(); db.refresh(new_session)
            session_id = new_session.id

        # 2. Pandalungan Normalization
        normalized_query = pandalungan_normalizer(req.question)
        user_query_lower = normalized_query.lower()

        # 3. Hybrid Search: k=20 agar semua tempat yang disebut user terambil datanya
        docs_with_scores = vector_db.similarity_search_with_relevance_scores(normalized_query, k=20)
        
        # 4. History Injection
        recent_chats = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.timestamp.desc()).limit(6).all()
        history_text = "\n".join([f"{msg.sender.upper()}: {msg.content}" for msg in reversed(recent_chats)])

        # 5. Intent Detection (Weather & Stress)
        is_complaining_weather = any(x in user_query_lower for x in ["hujan", "udan", "mendung", "badai"])
        is_stressed = any(x in user_query_lower for x in ["stres", "pusing", "healing", "capek"])

        # 6. Membangun Konteks & Kandidat Rekomendasi
        context_list = []
        final_candidates = [] 
        seen_ids = set()

        for doc, score in docs_with_scores:
            # Threshold
            if score > 0.25:
                context_list.append(doc.page_content)
                
                if doc.metadata.get('type') == 'tourism' or 'id' in doc.metadata:
                    wid = str(doc.metadata.get('id'))
                    kat = doc.metadata.get('kategori', '')

                    if is_complaining_weather and kat in ["Pantai", "Alam"]: continue
                    if is_stressed and kat in ["Sejarah", "Makam"]: continue

                    if wid not in seen_ids:
                        final_candidates.append(doc.metadata)
                        seen_ids.add(wid)

        context_text = "\n\n".join(context_list)

        # 7. PROMPT ENGINEERING 
        base_prompt = f"""
        Identitas: Kamu adalah 'Cak Jember', pemandu wisata cerdas berbasis AI yang ahli menyusun rute perjalanan (itinerary) di Jember. 
        Gaya bicara: Santai, cerdas, membantu, dan menggunakan dialek Pandalungan yang natural.

        [INSTRUKSI KHUSUS ITINERARY]
        - Jika pengguna menyebutkan beberapa tempat (misal: Papuma, Watu Ulo, dan Dira), JANGAN hanya memilih satu.
        - Susunlah URUTAN KUNJUNGAN yang logis (Itinerary). Berikan alasan kenapa tempat A harus dikunjungi duluan (misal: karena searah atau mengejar waktu operasional).
        - Gunakan format list (1, 2, 3) untuk menjelaskan rute tersebut.

        [INSTRUKSI FORMATTING]
        - Gunakan Markdown (Bold, Bullet Points). Sebutkan alamat lengkap dengan format **Tebal**.
        - Batasi penggunaan kata 'Lur' atau 'Tretan'. Jangan di setiap kalimat.
        - Jika informasi TIDAK ADA dalam konteks, katakan jujur dan jangan berhalusinasi.

        [KONTEKS DATA]
        {context_text}

        [RIWAYAT PERCAKAPAN]
        {history_text}
        """

        prompt = ChatPromptTemplate.from_messages([("system", base_prompt), ("human", "{question}")])
        chain = prompt | llm
        response = chain.invoke({"question": req.question})
        ai_answer = response.content

        # 8. ADVANCED SMART SYNC (Sinkronisasi & Urutan Kartu)
        synced_recommendations = []
        added_ids = set()

        user_q = req.question.lower()

        # Mencocokkan nama wisata yang ada di teks jawaban AI dengan metadata
        for cand in final_candidates:
            nama_wisata = cand.get('nama_wisata', '').lower()
            wid = str(cand.get('id', ''))

            nama_words = [w for w in nama_wisata.split() if len(w) > 3]
            
            if (nama_wisata in ai_answer.lower() or 
                nama_wisata in user_q or
                any(word in user_q for word in nama_words)):
                
                if wid not in added_ids:
                    synced_recommendations.append(cand)
                    added_ids.add(wid)
        
        # Urutkan kartu berdasarkan posisi penyebutan pertama kali di teks jawaban AI
        synced_recommendations.sort(key=lambda x: x.get('nama_wisata', '').lower() in user_q, reverse=True)

        # Batasi maksimal 6 kartu
        synced_recommendations = synced_recommendations[:6]

        # 9. Simpan ke Database
        db.add(models.ChatMessage(session_id=session_id, sender="user", content=req.question))
        db.add(models.ChatMessage(
            session_id=session_id, 
            sender="ai", 
            content=ai_answer, 
            recommendations=synced_recommendations
        ))
        db.commit()

        return {
            "status": "success", 
            "session_id": session_id, 
            "answer": ai_answer, 
            "recommendations": synced_recommendations
        }
    except Exception as e:
        logger.error(f"Error Audit: {str(e)}")
        raise HTTPException(500, f"Error di Otak Cak Jember: {str(e)}")


# rekomendasi
@app.post("/api/v1/rekomendasi")
def get_similar_wisata(req: RecommendationRequest):
    global vector_db
    try:
        
        docs = vector_db.similarity_search(
            req.query, 
            k=10, 
            filter={"type": "tourism"}
        )
        
        formatted_results = [{"metadata": d.metadata} for d in docs]
        return {"status": "success", "results": formatted_results}
    except Exception as e:
        return {"status": "success", "results": []}

@app.get("/api/v1/list-wisata")
def list_wisata():
    global data_wisata_csv
    return {"status": "success", "data": data_wisata_csv}

@app.get("/api/v1/wisata/{id}")
def detail_wisata(id: str):
    res = next((i for i in data_wisata_csv if str(i["id"]) == id), None)
    if res: return {"status": "success", "data": res}
    raise HTTPException(404, "Not found")

@app.get("/api/chat/sessions")
def get_sessions(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"status": "success", "data": [ChatSessionResponse.from_orm(s) for s in db.query(models.ChatSession).filter(models.ChatSession.user_id == user.id).order_by(models.ChatSession.created_at.desc()).all()]}

@app.get("/api/chat/{sid}/messages")
def get_messages(sid: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"status": "success", "data": [ChatMessageResponse.from_orm(m) for m in db.query(models.ChatMessage).filter(models.ChatMessage.session_id == sid).order_by(models.ChatMessage.timestamp.asc()).all()]}

# --- ADMIN ENDPOINTS ---
@app.post("/api/admin/generate-desc")
def generate_description_ai(req: GenerateDescRequest, admin_user: models.User = Depends(get_current_admin)):
    try:
        llm = get_groq_llm()
        prompt = f"Buatkan deskripsi wisata menarik untuk: {req.nama_wisata} ({req.kategori}). Gaya bahasa santai dan emosional."
        response = llm.invoke(prompt)
        return {"status": "success", "description": response.content}
    except Exception: raise HTTPException(500, "Gagal generate.")

@app.get("/api/admin/stats")
def get_admin_stats(admin_user: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        popular = db.query(models.History.wisata_name, func.count(models.History.id).label('count')).group_by(models.History.wisata_name).order_by(func.count(models.History.id).desc()).first()
        return {"status": "success", "data": {"total_users": db.query(models.User).count(), "total_wisata": len(data_wisata_csv), "total_chats": db.query(models.ChatSession).count(), "popular_wisata": popular[0] if popular else "-", "popular_count": popular[1] if popular else 0}}
    except Exception: return {"status": "error"}

@app.post("/api/admin/add-wisata")
def add_wisata_admin(nama_wisata: str = Form(...), deskripsi: str = Form(...), kategori: str = Form(...), alamat: str = Form(...), harga_tiket: str = Form(...), gambar: UploadFile = File(None), admin_user: models.User = Depends(get_current_admin)):
    global data_wisata_csv
    try:
        filename = ""
        if gambar:
            clean = f"{datetime.now().timestamp()}_{gambar.filename.replace(' ', '_')}"
            path = f"uploads/{clean}"
            with open(path, "wb") as buffer: shutil.copyfileobj(gambar.file, buffer)
            filename = f"https://jembertrip-api.up.railway.app/images/{clean}"
        new_entry = {"id": str(len(data_wisata_csv) + 1), "nama_wisata": nama_wisata, "deskripsi": deskripsi, "kategori": kategori, "alamat": alamat, "harga_tiket": harga_tiket, "gambar": filename, "combined_text": f"{nama_wisata} {kategori} {deskripsi}"}
        data_wisata_csv.append(new_entry)
        save_csv_changes()
        if vector_db: vector_db.add_texts(texts=[new_entry["combined_text"]], metadatas=[new_entry])
        return {"status": "success", "message": "Berhasil", "data": new_entry}
    except Exception as e: raise HTTPException(500, str(e))

@app.put("/api/admin/wisata/{id}")
def edit_wisata_admin(id: str, nama_wisata: str = Form(...), deskripsi: str = Form(...), kategori: str = Form(...), alamat: str = Form(...), harga_tiket: str = Form(...), gambar: UploadFile = File(None), admin_user: models.User = Depends(get_current_admin)):
    idx = next((i for i, d in enumerate(data_wisata_csv) if str(d["id"]) == id), None)
    if idx is None: raise HTTPException(404, "Not found")
    try:
        current = data_wisata_csv[idx]
        img = current.get("gambar", "")
        if gambar:
            clean = f"{datetime.now().timestamp()}_{gambar.filename.replace(' ', '_')}"
            path = f"uploads/{clean}"
            with open(path, "wb") as buffer: shutil.copyfileobj(gambar.file, buffer)
            img = f"https://jembertrip-api.up.railway.app/images/{clean}"
        updated = {**current, "nama_wisata": nama_wisata, "deskripsi": deskripsi, "kategori": kategori, "alamat": alamat, "harga_tiket": harga_tiket, "gambar": img, "combined_text": f"{nama_wisata} {kategori} {deskripsi}"}
        data_wisata_csv[idx] = updated
        save_csv_changes()
        return {"status": "success", "data": updated}
    except Exception as e: raise HTTPException(500, str(e))

@app.delete("/api/admin/wisata/{id}")
def delete_wisata_admin(id: str, admin_user: models.User = Depends(get_current_admin)):
    global data_wisata_csv
    data_wisata_csv = [d for d in data_wisata_csv if str(d['id']) != id]
    save_csv_changes()
    return {"status": "success", "message": "Dihapus"}


# --- ENDPOINT MONITORING UNTUK ADMIN ---

# ==========================================
#      NEW ADMIN MONITORING ENDPOINTS
# ==========================================

@app.get("/api/admin/users")
def get_all_users(admin_user: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Melihat daftar user lengkap dengan ID-nya"""
    users = db.query(models.User).all()
    # Kita mapping agar password tidak ikut terkirim (Security First!)
    return {
        "status": "success", 
        "data": [
            {
                "id": u.id, 
                "username": u.username, 
                "full_name": u.full_name, 
                "email": u.email, 
                "role": u.role
            } for u in users
        ]
    }

@app.get("/api/admin/activities")
def get_all_activities(admin_user: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Melihat log siapa (ID) klik wisata apa (ID)"""
    activities = db.query(
        models.History.id,
        models.History.user_id,
        models.User.username,
        models.History.wisata_id,
        models.History.wisata_name,
        models.History.timestamp
    ).join(models.User, models.History.user_id == models.User.id)\
     .order_by(models.History.timestamp.desc()).all()
    
    # Kita format sesuai request lu: Nama (ID)
    result = [
        {
            "id": a.id, 
            "user_display": f"{a.username} ({a.user_id})", 
            "wisata_display": f"{a.wisata_name} ({a.wisata_id})", 
            "waktu": a.timestamp
        } for a in activities
    ]
    return {"status": "success", "data": result}


@app.get("/api/admin/user-activity-report")
def get_user_activity_report(admin_user: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Mengambil semua user dan riwayat klik mereka secara terkelompok"""
    users = db.query(models.User).all()
    report = []

    for u in users:
        # Ambil history khusus untuk user ini
        user_history = db.query(models.History).filter(models.History.user_id == u.id).order_by(models.History.timestamp.desc()).all()
        
        report.append({
            "user_info": {
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name
            },
            "total_clicks": len(user_history),
            "history": [
                {
                    "id": h.id,
                    "wisata_id": h.wisata_id,
                    "wisata_name": h.wisata_name,
                    "timestamp": h.timestamp
                } for h in user_history
            ]
        })
    
    return {"status": "success", "data": report}



# ==========================================
#    FORCE ADMIN
# ==========================================
@app.get("/api/cheat/jadi-admin/{username}")
def force_user_to_admin(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        return {"status": "error", "message": f"Waduh, user '{username}' gak ditemukan bro!"}
    user.role = "admin"
    db.commit()
    
    return {
        "status": "success", 
        "message": f"🎉 SELAMAT! Akun '{username}' sekarang resmi jadi ADMIN (Role: {user.role}). Silakan login ulang!"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)