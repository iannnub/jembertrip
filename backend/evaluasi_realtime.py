import streamlit as st
import pandas as pd
import sqlite3
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

# --- KONFIGURASI ---
DB_PATH = "jembertrip.db"
CHROMA_PATH = "db_jembertrip_v2"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

st.set_page_config(page_title="JemberTrip AI Auditor", layout="wide")

# --- UTILITY: HITUNG SEMANTIC SIMILARITY ---
def calculate_similarity(text1, text2):
    if not text1 or not text2: return 0.0
    vectorizer = TfidfVectorizer()
    tfidf = vectorizer.fit_transform([text1, text2])
    return cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]

# --- LOAD DATA CHAT (SQL) ---
def get_chat_history():
    conn = sqlite3.connect(DB_PATH)
    # Sesuaikan nama tabel chat lo, misal 'messages' atau 'chat_history'
    try:
        df = pd.read_sql_query("SELECT user_message, ai_response, context_used FROM chat_logs ORDER BY id DESC LIMIT 10", conn)
    except:
        # Fallback kalau tabel belum ada/beda nama
        df = pd.DataFrame(columns=['user_message', 'ai_response', 'context_used'])
    conn.close()
    return df

# --- DASHBOARD UI ---
st.title("🤖 JemberTrip AI Real-Time Auditor")
st.markdown("Mengevaluasi **Rekomendasi Spesial** dan **Chatbot RAG** secara saintifik.")

tab1, tab2 = st.tabs(["🎯 Rekomendasi Spesial", "💬 Chatbot RAG Evaluation"])

with tab1:
    st.header("Sistem Rekomendasi (Precision@6)")
    # (Gunakan logic script sebelumnya di sini...)
    st.info("Menghitung akurasi berdasarkan kategori 'tourism' di Vector DB.")

with tab2:
    st.header("RAG Performance Metrics")
    chat_df = get_chat_history()
    
    if not chat_df.empty:
        # Hitung Metrik Secara Real-Time
        chat_df['faithfulness'] = chat_df.apply(lambda x: calculate_similarity(x['ai_response'], x['context_used']), axis=1)
        chat_df['relevance'] = chat_df.apply(lambda x: calculate_similarity(x['ai_response'], x['user_message']), axis=1)
        
        avg_faith = chat_df['faithfulness'].mean() * 100
        avg_rel = chat_df['relevance'].mean() * 100
        
        # Row 1: Metrics Cards
        c1, c2, c3 = st.columns(3)
        c1.metric("Faithfulness (Anti-Halusinasi)", f"{round(avg_faith, 2)}%", "Berdasarkan PDF")
        c2.metric("Answer Relevance", f"{round(avg_rel, 2)}%", "Kesesuaian Pertanyaan")
        c3.metric("Total Chats Audited", len(chat_df))
        
        # Row 2: Visualisasi
        st.divider()
        st.subheader("Tabel Audit Chat Terakhir")
        st.dataframe(chat_df[['user_message', 'ai_response', 'faithfulness', 'relevance']], use_container_width=True)
        
        st.write("**Penjelasan Metrik:**")
        st.write("- **Faithfulness**: Seberapa mirip jawaban AI dengan dokumen PDF. Semakin tinggi, semakin kecil kemungkinan AI 'ngarang'.")
        st.write("- **Answer Relevance**: Seberapa nyambung jawaban AI dengan maksud pertanyaan user.")
    else:
        st.warning("Belum ada data chat untuk dievaluasi. Coba tanya-tanya chatbot dulu di aplikasi!")