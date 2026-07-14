import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np

# ===== EVALUATION DATA (UPDATE TERBARU) =====
alpha_values = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
precision    = [6.90, 7.15, 7.49, 7.86, 7.92, 8.11, 7.95, 7.67, 7.52]
recall       = [28.44, 29.44, 30.64, 32.05, 32.12, 32.78, 32.05, 30.74, 30.22]
f1_score     = [10.69, 11.09, 11.61, 12.16, 12.25, 12.51, 12.26, 11.82, 11.59]

# ===== FONT CONFIGURATION (TIMES NEW ROMAN) =====
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.serif'] = ['Times New Roman']
plt.rcParams['mathtext.fontset'] = 'stix'

# ===== CREATE FIGURE =====
fig, ax = plt.subplots(figsize=(8, 5), dpi=300)

# ===== PLOT THE METRICS =====
ax.plot(alpha_values, precision, marker='o', linewidth=2, markersize=7,
        color='#2196F3', label='Precision@6', linestyle='-')
ax.plot(alpha_values, recall, marker='s', linewidth=2, markersize=7,
        color='#4CAF50', label='Recall@6', linestyle='-')
ax.plot(alpha_values, f1_score, marker='D', linewidth=2, markersize=7,
        color='#F44336', label='F1-Score@6', linestyle='-')

# ===== MARK OPTIMAL POINT (ALPHA 0.6) =====
ax.axvline(x=0.6, color='gray', linestyle='--', alpha=0.5, linewidth=1)
ax.annotate('Optimal\nAlpha = 0.6',
            xy=(0.6, 12.51), xytext=(0.72, 16.5),
            fontsize=10, fontweight='bold', color='#F44336',
            arrowprops=dict(arrowstyle='->', color='#F44336', lw=1.5),
            ha='center')

# ===== LABELS & TITLE =====
ax.set_xlabel('Alpha Value (α)', fontsize=12, fontweight='bold')
ax.set_ylabel('Evaluation Score (%)', fontsize=12, fontweight='bold')
ax.set_title('Evaluation Metrics Fluctuation against Alpha Weighting Variations\nin Hybrid Filtering',
             fontsize=13, fontweight='bold', pad=15)

# ===== AXIS CONFIGURATION =====
ax.set_xticks(alpha_values)
ax.set_xlim(0.05, 0.95)
ax.set_ylim(0, 35) # Disesuaikan karena recall tembus 32%
ax.yaxis.set_major_formatter(mticker.FormatStrFormatter('%.0f%%'))
ax.tick_params(axis='both', labelsize=10)
ax.grid(True, linestyle='--', alpha=0.3)
ax.legend(fontsize=10, loc='upper left', framealpha=0.9)

# ===== ADD NUMBER LABELS FOR F1-SCORE =====
for x, y in zip(alpha_values, f1_score):
    ax.annotate(f'{y:.2f}%', (x, y), textcoords="offset points",
                xytext=(0, -15), ha='center', fontsize=8, color='#F44336')

plt.tight_layout()
plt.savefig('grafik_alpha_hybrid_en.png', dpi=300, bbox_inches='tight',
            facecolor='white', edgecolor='none')
print("✅ Chart saved successfully as 'grafik_alpha_hybrid_en.png'")
