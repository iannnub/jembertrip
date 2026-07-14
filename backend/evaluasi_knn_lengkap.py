import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import KFold
from sentence_transformers import SentenceTransformer
import warnings
warnings.filterwarnings('ignore')

# Helper functions
def calculate_mrr(recs, relevant_set, n):
    for i, item in enumerate(recs[:n]):
        if item in relevant_set: return 1.0 / (i + 1)
    return 0.0

def calculate_ndcg(recs, relevant_set, n):
    dcg = sum([1.0 / np.log2(i + 2) for i, item in enumerate(recs[:n]) if item in relevant_set])
    idcg = sum([1.0 / np.log2(i + 2) for i in range(min(len(relevant_set), n))])
    return dcg / idcg if idcg > 0 else 0.0

def print_markdown_table(results, headers):
    print("| " + " | ".join(headers) + " |")
    print("| " + " | ".join([":---:" for _ in headers]) + " |")
    for row in results:
        print("| " + " | ".join([str(row[h]) for h in headers]) + " |")

# Load Data
df_dest = pd.read_csv("/content/destinasi_final.csv")
df_implicit = pd.read_csv("/content/implicit_data_new.csv")
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
k_values = [10, 15, 20, 25, 30]
all_users = df_implicit['user_id'].unique()
all_items = dest_ids

# =======================================================
# 1. EVALUASI KNN TERBAIK - WISATA SERUPA (CBF)
# =======================================================
print("\n" + "="*80)
print("=== 1. PENCARIAN KNN TERBAIK: WISATA SERUPA (CBF) ===")
print("="*80)
cbf_results = []
for k in k_values:
    precisions, recalls, f1s = [], [], []
    for train_idx, test_idx in kf.split(df_dest):
        train_df = df_dest.iloc[train_idx]
        test_df = df_dest.iloc[test_idx]
        sbert_train = sbert_embeddings[train_idx]
        for _, test_row in test_df.iterrows():
            q_emb = sbert_embeddings[dest_id_to_idx[test_row['id']]].reshape(1, -1)
            sim = cosine_similarity(q_emb, sbert_train).flatten()
            recs = train_df.iloc[np.argsort(sim)[::-1][:k]].head(6)['id'].tolist()
            relevant_set = set(train_df[train_df['kategori'] == test_row['kategori']]['id'].tolist())
            hits = sum(1 for item in recs if item in relevant_set)
            precision = hits / 6.0
            recall = hits / len(relevant_set) if len(relevant_set) > 0 else 0
            f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            precisions.append(precision); recalls.append(recall); f1s.append(f1)

    cbf_results.append({'K': k, 'Precision@6': f"{np.mean(precisions)*100:.2f}%", 'Recall@6': f"{np.mean(recalls)*100:.2f}%", 'F1-Score@6': f"{np.mean(f1s)*100:.2f}%"})

print_markdown_table(cbf_results, ['K', 'Precision@6', 'Recall@6', 'F1-Score@6'])

# =======================================================
# 2. EVALUASI KNN TERBAIK - REKOMENDASI SPESIAL (CF)
# =======================================================
print("\n" + "="*80)
print("=== 2. PENCARIAN KNN TERBAIK: REKOMENDASI SPESIAL (CF) ===")
print("="*80)
cf_results = []
for k in k_values:
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
            top_k_users = user_sim_df.loc[u_id].nlargest(k).index
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

    cf_results.append({'K': k, 'Precision@6': f"{np.mean(precisions)*100:.2f}%", 'Recall@6': f"{np.mean(recalls)*100:.2f}%", 'F1-Score@6': f"{np.mean(f1s)*100:.2f}%"})

print_markdown_table(cf_results, ['K', 'Precision@6', 'Recall@6', 'F1-Score@6'])

# =======================================================
# 3. EVALUASI KNN TERBAIK - HYBRID FILTERING
# =======================================================
print("\n" + "="*80)
print("=== 3. PENCARIAN KNN TERBAIK: HYBRID FILTERING (Alpha Default = 0.5) ===")
print("="*80)
hybrid_results = []
for k in k_values:
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
            top_k_users = user_sim_df.loc[u_id].nlargest(k).index
            top_k_sim = user_sim_df.loc[u_id, top_k_users]
            cf_scores = R_train.loc[top_k_users].mul(top_k_sim, axis=0).sum(axis=0) if top_k_sim.max() > 0 else pd.Series(0.0, index=all_items)

            # CBF
            query_text = " ".join(u_train['wisata_name'].tolist())
            q_vec = sbert_model.encode([query_text], convert_to_numpy=True)
            cbf_scores = pd.Series(cosine_similarity(q_vec, sbert_embeddings).flatten(), index=dest_ids)

            cf_norm = (cf_scores - cf_scores.min()) / (cf_scores.max() - cf_scores.min()) if cf_scores.max() > cf_scores.min() else cf_scores * 0.0
            cbf_norm = (cbf_scores - cbf_scores.min()) / (cbf_scores.max() - cbf_scores.min()) if cbf_scores.max() > cbf_scores.min() else cbf_scores * 0.0

            hybrid_scores = (0.5 * cf_norm) + (0.5 * cbf_norm)
            hybrid_scores = hybrid_scores.drop(index=u_train_items, errors='ignore')

            top_6_recs = hybrid_scores.nlargest(6).index.tolist()
            if not top_6_recs or hybrid_scores[top_6_recs[0]] == 0: continue

            test_visited_ids = set(u_test['wisata_id'].astype(str).tolist())
            hits = sum(1 for rid in top_6_recs if rid in test_visited_ids)
            precision = hits / 6.0
            recall = hits / len(test_visited_ids)
            f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            precisions.append(precision); recalls.append(recall); f1s.append(f1)

    hybrid_results.append({'K': k, 'Precision@6': f"{np.mean(precisions)*100:.2f}%", 'Recall@6': f"{np.mean(recalls)*100:.2f}%", 'F1-Score@6': f"{np.mean(f1s)*100:.2f}%"})

print_markdown_table(hybrid_results, ['K', 'Precision@6', 'Recall@6', 'F1-Score@6'])
