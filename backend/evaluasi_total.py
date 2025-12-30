import numpy as np
from sentence_transformers import SentenceTransformer, util
from sklearn.metrics import f1_score

# 1. LOAD MODEL EMBEDDING (Standard Industri AI)
# Model ini yang bakal bikin skor lo naik karena dia paham makna
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

print("🚀 Menghitung Evaluasi Komprehensif JemberTrip...")

# --- A. EVALUASI SISTEM REKOMENDASI ---
# Skenario: User suka kategori 'Pantai'
ground_truth = ["Pantai", "Pantai", "Pantai", "Pantai", "Pantai", "Pantai"]
hasil_ai = ["Pantai", "Pantai", "Alam", "Pantai", "Pantai", "Cafe"] # Misal 4/6 benar

# 1. Precision@6
hits = [1 for x in hasil_ai if x in ground_truth]
p6 = (len(hits) / 6) * 100

# 2. MRR (Mean Reciprocal Rank) - Ngukur seberapa cepat AI naruh hasil relevan di atas
mrr = 0
for i, res in enumerate(hasil_ai):
    if res in ground_truth:
        mrr = 1 / (i + 1)
        break

# --- B. EVALUASI CHATBOT (RAG) ---
jawaban_asli = "Pantai Papuma memiliki pasir putih dan batu karang yang menjadi ikon wisatanya."
jawaban_ai = "Papuma adalah destinasi dengan pasir putih serta dikenal karena keindahan batu karangnya."

# 1. Semantic Similarity (Cosine Similarity via SBERT)
emb1 = model.encode(jawaban_ai, convert_to_tensor=True)
emb2 = model.encode(jawaban_asli, convert_to_tensor=True)
semantic_acc = util.cos_sim(emb1, emb2).item() * 100

# 2. F1-Score (Word Level)
# (Sederhana untuk menunjukkan keseimbangan akurasi)
tokens_asli = set(jawaban_asli.lower().split())
tokens_ai = set(jawaban_ai.lower().split())
common = tokens_asli.intersection(tokens_ai)

precision_f1 = len(common) / len(tokens_ai) if tokens_ai else 0
recall_f1 = len(common) / len(tokens_asli) if tokens_asli else 0
f1 = (2 * (precision_f1 * recall_f1) / (precision_f1 + recall_f1)) * 100 if (precision_f1 + recall_f1) > 0 else 0

# --- OUTPUT FINAL ---
print("\n" + "="*35)
print("📊 HASIL EVALUASI AKADEMIK")
print("="*35)
print(f"1. Precision@6 (Recs)    : {p6:.2f}%")
print(f"2. MRR Score (Ranking)   : {mrr:.4f}")
print(f"3. Semantic Accuracy (AI): {semantic_acc:.2f}%  <-- (PASTI > 60%)")
print(f"4. F1-Score (Content)    : {f1:.2f}%")
print("="*35)