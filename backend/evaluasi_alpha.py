import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import KFold
from sentence_transformers import SentenceTransformer
import warnings
warnings.filterwarnings('ignore')

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

print("Loading SBERT Model...")
sbert_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
sbert_embeddings = sbert_model.encode(df_dest['clean_text'].tolist(), convert_to_numpy=True)

kf_user = KFold(n_splits=10, shuffle=True, random_state=42)
all_users = df_implicit['user_id'].unique()
all_items = dest_ids

# =======================================================
# PENCARIAN ALPHA TERBAIK - HYBRID FILTERING
# =======================================================
print("\n" + "="*80)
print("=== PENCARIAN ALPHA TERBAIK: HYBRID FILTERING ===")
print("=== (Menggunakan K=30, yang merupakan K Terbaik dari pengujian CF) ===")
print("="*80)

alpha_values = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
best_k = 30
hybrid_alpha_results = []

for alpha in alpha_values:
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
            u_train = train_clicks[train_clicks['user_id'] == u_id]
            if u_train.empty: continue
            u_train_items = u_train['wisata_id'].unique()
            
            # CF
            top_k_users = user_sim_df.loc[u_id].nlargest(best_k).index
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
            
            precisions.append(precision)
            recalls.append(recall)
            f1s.append(f1)
            
    hybrid_alpha_results.append({
        'Alpha (CF Weight)': alpha, 
        'Precision@6': f"{np.mean(precisions)*100:.2f}%", 
        'Recall@6': f"{np.mean(recalls)*100:.2f}%",
        'F1-Score@6': f"{np.mean(f1s)*100:.2f}%"
    })

print_markdown_table(hybrid_alpha_results, ['Alpha (CF Weight)', 'Precision@6', 'Recall@6', 'F1-Score@6'])
