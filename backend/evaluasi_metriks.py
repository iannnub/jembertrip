import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import KFold
from sentence_transformers import SentenceTransformer
import warnings
warnings.filterwarnings('ignore')

# Helper functions
def print_markdown_table(results, headers):
    print("| " + " | ".join(headers) + " |")
    print("| " + " | ".join([":---:" for _ in headers]) + " |")
    for row in results:
        print("| " + " | ".join([str(row[h]) for h in headers]) + " |")

# Load Data
df_dest = pd.read_csv("data/destinasi_final.csv")
df_implicit = pd.read_csv("data/implicit_data_new.csv")
df_dest['id'] = df_dest['id'].astype(str)
df_implicit['wisata_id'] = df_implicit['wisata_id'].astype(str)
df_implicit['timestamp'] = pd.to_datetime(df_implicit['timestamp'])
df_implicit = df_implicit.sort_values(by='timestamp')

df_dest['clean_text'] = (df_dest['nama_wisata'] + " " + df_dest['kategori'] + " " + df_dest['deskripsi']).fillna("")
dest_ids = df_dest['id'].tolist()
dest_id_to_idx = {idx: i for i, idx in enumerate(dest_ids)}

print("Loading SBERT Model...")
sbert_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
sbert_embeddings = sbert_model.encode(df_dest['clean_text'].tolist(), convert_to_numpy=True)

kf = KFold(n_splits=10, shuffle=True, random_state=42)
kf_user = KFold(n_splits=10, shuffle=True, random_state=42)
all_users = df_implicit['user_id'].unique()
all_items = dest_ids

# PARAMETER TERBAIK (Diperoleh dari evaluasi_knn.py dan evaluasi_alpha.py)
BEST_K_CBF = 10
BEST_K_CF = 30
BEST_K_HYBRID = 30
BEST_ALPHA_HYBRID = 0.6

print("\n" + "="*80)
print("=== EVALUASI METRIKS FINAL (PRECISION, RECALL, F1-SCORE) ===")
print("=== (Membandingkan ke-3 metode pada Top-6 dengan Parameter Terbaik) ===")
print("="*80)

final_results = []

# --- 1. EVALUASI CBF ---
precisions, recalls, f1s = [], [], []
total_tp_cbf, total_fp_cbf, total_fn_cbf = 0, 0, 0
for train_idx, test_idx in kf.split(df_dest):
    train_df = df_dest.iloc[train_idx]
    test_df = df_dest.iloc[test_idx]
    sbert_train = sbert_embeddings[train_idx]
    for _, test_row in test_df.iterrows():
        q_emb = sbert_embeddings[dest_id_to_idx[test_row['id']]].reshape(1, -1)
        sim = cosine_similarity(q_emb, sbert_train).flatten()
        recs = train_df.iloc[np.argsort(sim)[::-1][:BEST_K_CBF]].head(6)['id'].tolist()
        relevant_set = set(train_df[train_df['kategori'] == test_row['kategori']]['id'].tolist())
        hits = sum(1 for item in recs if item in relevant_set)
        
        tp = hits
        fp = 6 - hits
        fn = len(relevant_set) - hits
        total_tp_cbf += tp
        total_fp_cbf += fp
        total_fn_cbf += fn
        
        precision = hits / 6.0
        recall = hits / len(relevant_set) if len(relevant_set) > 0 else 0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        precisions.append(precision); recalls.append(recall); f1s.append(f1)

final_results.append({
    'Metode': 'Wisata Serupa (CBF)', 'Parameter': f"K={BEST_K_CBF}",
    'Precision@6': f"{np.mean(precisions)*100:.2f}%", 'Recall@6': f"{np.mean(recalls)*100:.2f}%",
    'F1-Score@6': f"{np.mean(f1s)*100:.2f}%"
})


# --- 2. EVALUASI CF ---
precisions, recalls, f1s = [], [], []
for train_idx, test_idx in kf_user.split(df_implicit):
    train_clicks = df_implicit.iloc[train_idx]
    test_clicks = df_implicit.iloc[test_idx]
    R_train = pd.DataFrame(0.0, index=all_users, columns=all_items)
    for (u, i), count in train_clicks.groupby(['user_id', 'wisata_id']).size().items():
        if u in R_train.index and i in R_train.columns: R_train.at[u, i] = float(count)
    
    user_sim_df = pd.DataFrame(cosine_similarity(R_train), index=R_train.index, columns=R_train.index)
    np.fill_diagonal(user_sim_df.values, 0.0)
    
    for u_id, u_test in test_clicks.groupby('user_id'):
        if u_id not in user_sim_df.index: continue
        top_k_users = user_sim_df.loc[u_id].nlargest(BEST_K_CF).index
        top_k_sim = user_sim_df.loc[u_id, top_k_users]
        if top_k_sim.max() == 0: continue
        
        item_scores = R_train.loc[top_k_users].mul(top_k_sim, axis=0).sum(axis=0)
        u_train_items = train_clicks[train_clicks['user_id'] == u_id]['wisata_id'].unique()
        item_scores = item_scores.drop(index=u_train_items, errors='ignore')
        
        top_6_recs = item_scores.nlargest(6).index.tolist()
        if not top_6_recs or item_scores[top_6_recs[0]] == 0: continue
        
        test_visited_ids = set(u_test['wisata_id'].astype(str).tolist())
        hits = sum(1 for rid in top_6_recs if rid in test_visited_ids)
        
        precision = hits / 6.0
        recall = hits / len(test_visited_ids)
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        precisions.append(precision); recalls.append(recall); f1s.append(f1)

final_results.append({
    'Metode': 'Rekomendasi Spesial (CF)', 'Parameter': f"K={BEST_K_CF}",
    'Precision@6': f"{np.mean(precisions)*100:.2f}%", 'Recall@6': f"{np.mean(recalls)*100:.2f}%",
    'F1-Score@6': f"{np.mean(f1s)*100:.2f}%"
})

# --- 3. EVALUASI HYBRID ---
precisions, recalls, f1s = [], [], []
alpha = BEST_ALPHA_HYBRID
for train_idx, test_idx in kf_user.split(df_implicit):
    train_clicks = df_implicit.iloc[train_idx]
    test_clicks = df_implicit.iloc[test_idx]
    R_train = pd.DataFrame(0.0, index=all_users, columns=all_items)
    for (u, i), count in train_clicks.groupby(['user_id', 'wisata_id']).size().items():
        if u in R_train.index and i in R_train.columns: R_train.at[u, i] = float(count)
    
    user_sim_df = pd.DataFrame(cosine_similarity(R_train), index=R_train.index, columns=R_train.index)
    np.fill_diagonal(user_sim_df.values, 0.0)
    
    for u_id, u_test in test_clicks.groupby('user_id'):
        if u_id not in user_sim_df.index: continue
        u_train = train_clicks[train_clicks['user_id'] == u_id]
        if u_train.empty: continue
        u_train_items = u_train['wisata_id'].unique()
        
        # CF
        top_k_users = user_sim_df.loc[u_id].nlargest(BEST_K_HYBRID).index
        top_k_sim = user_sim_df.loc[u_id, top_k_users]
        cf_scores = R_train.loc[top_k_users].mul(top_k_sim, axis=0).sum(axis=0) if top_k_sim.max() > 0 else pd.Series(0.0, index=all_items)
        
        # CBF
        query_text = " ".join(u_train['wisata_name'].tolist())
        q_vec = sbert_model.encode([query_text], convert_to_numpy=True)
        cbf_scores = pd.Series(cosine_similarity(q_vec, sbert_embeddings).flatten(), index=dest_ids)
        
        cf_norm = (cf_scores - cf_scores.min()) / (cf_scores.max() - cf_scores.min()) if cf_scores.max() > cf_scores.min() else cf_scores * 0.0
        cbf_norm = (cbf_scores - cbf_scores.min()) / (cbf_scores.max() - cbf_scores.min()) if cbf_scores.max() > cbf_scores.min() else cbf_scores * 0.0
        
        hybrid_scores = (alpha * cf_norm) + ((1 - alpha) * cbf_norm)
        hybrid_scores = hybrid_scores.drop(index=u_train_items, errors='ignore')
        
        top_6_recs = hybrid_scores.nlargest(6).index.tolist()
        if not top_6_recs or hybrid_scores[top_6_recs[0]] == 0: continue
        
        test_visited_ids = set(u_test['wisata_id'].astype(str).tolist())
        hits = sum(1 for rid in top_6_recs if rid in test_visited_ids)
        
        precision = hits / 6.0
        recall = hits / len(test_visited_ids)
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        precisions.append(precision); recalls.append(recall); f1s.append(f1)

final_results.append({
    'Metode': 'Hybrid Filtering (CBF + CF)', 'Parameter': f"K={BEST_K_HYBRID}, Alpha={BEST_ALPHA_HYBRID}",
    'Precision@6': f"{np.mean(precisions)*100:.2f}%", 'Recall@6': f"{np.mean(recalls)*100:.2f}%",
    'F1-Score@6': f"{np.mean(f1s)*100:.2f}%"
})

print_markdown_table(final_results, ['Metode', 'Parameter', 'Precision@6', 'Recall@6', 'F1-Score@6'])
