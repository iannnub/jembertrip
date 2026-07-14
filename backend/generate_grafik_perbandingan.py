import matplotlib.pyplot as plt
import numpy as np

# ===== DATA METRIK EVALUASI (UPDATE TERBARU) =====
labels = ['Precision@6', 'Recall@6', 'F1-Score@6']
cbf_scores = [56.55, 56.24, 52.21]
cf_scores = [7.27, 29.02, 11.19]
hybrid_scores = [8.11, 32.78, 12.51]

# ===== FONT CONFIGURATION (TIMES NEW ROMAN) =====
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.serif'] = ['Times New Roman']

x = np.arange(len(labels))
width = 0.25

fig, ax = plt.subplots(figsize=(10, 6), dpi=300)

rects1 = ax.bar(x - width, cbf_scores, width, label='Content-Based (K=10)', color='#1f77b4')
rects2 = ax.bar(x, cf_scores, width, label='Collaborative (K=30)', color='#ff7f0e')
rects3 = ax.bar(x + width, hybrid_scores, width, label='Hybrid (Alpha=0.6)', color='#2ca02c')

ax.set_ylabel('Persentase Akurasi (%)', fontsize=12, fontweight='bold')
ax.set_title('Perbandingan Performa Ketiga Algoritma Rekomendasi', fontsize=14, pad=20, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(labels, fontsize=12, fontweight='bold')
ax.legend(fontsize=11)
ax.set_ylim(0, 70)
ax.grid(axis='y', linestyle='--', alpha=0.7)

def autolabel(rects):
    for rect in rects:
        height = rect.get_height()
        ax.annotate(f'{height:.2f}%',
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=10, fontweight='bold')

autolabel(rects1)
autolabel(rects2)
autolabel(rects3)

fig.tight_layout()

# Simpan ke file PNG (Tanpa google.colab karena jalan di lokal/VSCode)
plt.savefig('grafik_perbandingan_metriks.png', dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
print("✅ Chart saved successfully as 'grafik_perbandingan_metriks.png'")
