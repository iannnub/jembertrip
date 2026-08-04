import pandas as pd
import numpy as np

df = pd.read_csv('data/destinasi_final.csv')
di = pd.read_csv('data/implicit_data_new.csv')

# 1. Distribusi harga tiket
print('=== DISTRIBUSI HARGA TIKET ===')
harga_zero = (df['harga_tiket'] == 0).sum()
print('Tiket gratis (Rp 0): ' + str(harga_zero) + '/' + str(len(df)))
print('Tiket berbayar: ' + str(len(df)-harga_zero) + '/' + str(len(df)))
harga_max = df['harga_tiket'].max()
harga_min = df['harga_tiket'].min()
print('Range harga: Rp ' + str(harga_min) + ' - Rp ' + str(harga_max))

# 2. Cold items (tidak pernah diklik)
all_ids = set(df['id'].astype(str))
clicked_ids = set(di['wisata_id'].astype(str))
never_clicked = all_ids - clicked_ids
print('\n=== BIAS KLIK ===')
print('Wisata tidak pernah diklik (cold item): ' + str(len(never_clicked)))
if never_clicked:
    cold_items = df[df['id'].astype(str).isin(never_clicked)][['id','nama_wisata','kategori']]
    print(cold_items.to_string())

# 3. Konsentrasi klik
top3_clicks = di['wisata_id'].value_counts().head(3)
total_clicks = len(di)
top3_pct = top3_clicks.sum() / total_clicks * 100
print('\n=== KONSENTRASI KLIK ===')
print('Top-3 wisata menyumbang ' + str(round(top3_pct,1)) + '% dari total ' + str(total_clicks) + ' klik')
for wid, cnt in top3_clicks.items():
    name = df[df['id'].astype(str) == str(wid)]['nama_wisata'].values
    nama = name[0] if len(name) > 0 else '?'
    pct = round(cnt/total_clicks*100, 1)
    print('  ID ' + str(wid) + ': ' + nama + ' (' + str(cnt) + ' klik, ' + str(pct) + '%)')

# 4. User activity
clicks_per_user = di.groupby('user_id').size()
users_with_1_click = (clicks_per_user == 1).sum()
users_with_5plus = (clicks_per_user >= 5).sum()
print('\n=== USER ACTIVITY ===')
print('User dengan hanya 1 klik (cold user): ' + str(users_with_1_click))
print('User dengan 5+ klik (reliable CF): ' + str(users_with_5plus))
print('Total unique users: ' + str(len(clicks_per_user)))

# 5. Kelengkapan field
print('\n=== KELENGKAPAN FIELD DATA ===')
for col in ['nama_wisata','kategori','alamat','deskripsi','gambar','harga_tiket']:
    pct = (df[col].notna() & (df[col].astype(str).str.strip() != '')).mean() * 100
    print('  ' + col + ': ' + str(round(pct,0)) + '% terisi')

# 6. Field kritis yang tidak ada
missing_fields = []
for f in ['latitude','longitude','jam_buka','jam_tutup','rating','telepon','website']:
    if f not in df.columns:
        missing_fields.append(f)
print('\n=== FIELD KRITIS YANG TIDAK ADA ===')
for f in missing_fields:
    print('  MISSING: ' + f)

# 7. Sample data wisata
print('\n=== SAMPLE 5 DESTINASI ===')
print(df[['id','nama_wisata','kategori','alamat','harga_tiket']].head(5).to_string())
