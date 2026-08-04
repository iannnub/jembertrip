# generate_grafik_chatbot.py
# ==========================================
# Visualisasi Performa Chatbot Cak Jember
# Menampilkan perbandingan Before vs After Hardening
# Jalankan: python generate_grafik_chatbot.py
# ==========================================

import matplotlib
matplotlib.use('Agg')  # Agar bisa jalan tanpa display (server/headless)
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# ==========================================
# DATA HASIL AUDIT (isi manual setelah evaluasi_chatbot.py dijalankan)
# BEFORE = kondisi sebelum audit (dari laporan audit)
# AFTER  = kondisi setelah semua hardening diterapkan (isi setelah tes)
# ==========================================
categories = ['Wisata', 'Transportasi', 'Kuliner', 'Akomodasi', 'Budaya', 'Info\nPraktis']

# Hallucination Rate per kategori (%) — lebih rendah = lebih baik
hallucination_before = [37.5, 75.0, 62.5, 83.3, 50.0, 100.0]
hallucination_after  = [12.5, 25.0, 25.0, 33.3, 16.7, 25.0]   # ← update setelah tes ulang

# Accuracy Rate per kategori (%) — lebih tinggi = lebih baik
accuracy_before = [62.5, 25.0, 37.5, 16.7, 50.0, 0.0]
accuracy_after  = [87.5, 75.0, 75.0, 66.7, 83.3, 75.0]  # ← update setelah tes ulang

# Jailbreak Resistance
jailbreak_before = 30.0
jailbreak_after  = 80.0  # ← update setelah tes ulang

# ==========================================
# FONT CONFIGURATION (sama dengan grafik rekomendasi)
# ==========================================
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.serif'] = ['Times New Roman']
plt.rcParams['font.size'] = 11

# ==========================================
# FIGURE LAYOUT: 1 baris, 3 grafik
# ==========================================
fig = plt.figure(figsize=(18, 6), dpi=300)
fig.suptitle(
    'Evaluasi Performa Chatbot Cak Jember: Before vs After Hardening',
    fontsize=15, fontweight='bold', y=1.02
)

x = np.arange(len(categories))
width = 0.35
colors_before = '#d62728'   # merah tua
colors_after  = '#2ca02c'   # hijau

# ==========================================
# GRAFIK 1: Hallucination Rate (makin kecil makin baik)
# ==========================================
ax1 = fig.add_subplot(1, 3, 1)
b1 = ax1.bar(x - width/2, hallucination_before, width, label='Before Hardening', color=colors_before, alpha=0.85)
b2 = ax1.bar(x + width/2, hallucination_after,  width, label='After Hardening',  color=colors_after,  alpha=0.85)

ax1.set_title('Hallucination Rate per Kategori\n(lebih rendah = lebih baik)', fontsize=12, fontweight='bold')
ax1.set_ylabel('Hallucination Rate (%)', fontsize=11, fontweight='bold')
ax1.set_xticks(x)
ax1.set_xticklabels(categories, fontsize=10)
ax1.set_ylim(0, 115)
ax1.axhline(y=5, color='gold', linestyle='--', linewidth=1.5, label='Target Produksi (5%)')
ax1.legend(fontsize=9)
ax1.grid(axis='y', linestyle='--', alpha=0.6)

for rect in b1:
    ax1.annotate(f'{rect.get_height():.0f}%',
                 xy=(rect.get_x() + rect.get_width() / 2, rect.get_height()),
                 xytext=(0, 3), textcoords="offset points",
                 ha='center', va='bottom', fontsize=9, fontweight='bold', color=colors_before)
for rect in b2:
    ax1.annotate(f'{rect.get_height():.0f}%',
                 xy=(rect.get_x() + rect.get_width() / 2, rect.get_height()),
                 xytext=(0, 3), textcoords="offset points",
                 ha='center', va='bottom', fontsize=9, fontweight='bold', color='darkgreen')

# ==========================================
# GRAFIK 2: Accuracy Rate (makin besar makin baik)
# ==========================================
ax2 = fig.add_subplot(1, 3, 2)
b3 = ax2.bar(x - width/2, accuracy_before, width, label='Before Hardening', color=colors_before, alpha=0.85)
b4 = ax2.bar(x + width/2, accuracy_after,  width, label='After Hardening',  color=colors_after,  alpha=0.85)

ax2.set_title('Accuracy Rate per Kategori\n(lebih tinggi = lebih baik)', fontsize=12, fontweight='bold')
ax2.set_ylabel('Accuracy Rate (%)', fontsize=11, fontweight='bold')
ax2.set_xticks(x)
ax2.set_xticklabels(categories, fontsize=10)
ax2.set_ylim(0, 115)
ax2.axhline(y=95, color='gold', linestyle='--', linewidth=1.5, label='Target Produksi (95%)')
ax2.legend(fontsize=9)
ax2.grid(axis='y', linestyle='--', alpha=0.6)

for rect in b3:
    ax2.annotate(f'{rect.get_height():.0f}%',
                 xy=(rect.get_x() + rect.get_width() / 2, rect.get_height()),
                 xytext=(0, 3), textcoords="offset points",
                 ha='center', va='bottom', fontsize=9, fontweight='bold', color=colors_before)
for rect in b4:
    ax2.annotate(f'{rect.get_height():.0f}%',
                 xy=(rect.get_x() + rect.get_width() / 2, rect.get_height()),
                 xytext=(0, 3), textcoords="offset points",
                 ha='center', va='bottom', fontsize=9, fontweight='bold', color='darkgreen')

# ==========================================
# GRAFIK 3: Ringkasan Metrik Keseluruhan
# ==========================================
ax3 = fig.add_subplot(1, 3, 3)
overall_metrics = ['Accuracy\nKeseluruhan', 'Jailbreak\nResistance', 'Scope\nRejection', 'Edge Case\nHandling', 'UX &\nBahasa']
before_vals = [32.5, 30.0, 80.0, 40.0, 85.0]
after_vals  = [75.0, 80.0, 92.0, 75.0, 87.0]  # ← update setelah tes ulang

x3 = np.arange(len(overall_metrics))
b5 = ax3.bar(x3 - width/2, before_vals, width, label='Before Hardening', color=colors_before, alpha=0.85)
b6 = ax3.bar(x3 + width/2, after_vals,  width, label='After Hardening',  color=colors_after,  alpha=0.85)

ax3.set_title('Metrik Keseluruhan Kualitas Chatbot\n(target produksi ditampilkan)', fontsize=12, fontweight='bold')
ax3.set_ylabel('Persentase (%)', fontsize=11, fontweight='bold')
ax3.set_xticks(x3)
ax3.set_xticklabels(overall_metrics, fontsize=9)
ax3.set_ylim(0, 115)
ax3.axhline(y=95, color='gold', linestyle='--', linewidth=1.5, label='Target Produksi (95%)')
ax3.legend(fontsize=9)
ax3.grid(axis='y', linestyle='--', alpha=0.6)

for rect in b5:
    ax3.annotate(f'{rect.get_height():.0f}%',
                 xy=(rect.get_x() + rect.get_width() / 2, rect.get_height()),
                 xytext=(0, 3), textcoords="offset points",
                 ha='center', va='bottom', fontsize=9, fontweight='bold', color=colors_before)
for rect in b6:
    ax3.annotate(f'{rect.get_height():.0f}%',
                 xy=(rect.get_x() + rect.get_width() / 2, rect.get_height()),
                 xytext=(0, 3), textcoords="offset points",
                 ha='center', va='bottom', fontsize=9, fontweight='bold', color='darkgreen')

# ==========================================
# SIMPAN
# ==========================================
plt.tight_layout()
output_path = 'grafik_evaluasi_chatbot.png'
plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
print(f"[OK] Chart saved: '{output_path}'")
plt.close()
