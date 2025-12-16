# JemberTrip AI Chatbot - Two Panel Implementation Guide

## ✅ Implementasi Selesai

Tiga file utama telah diperbaiki untuk mengimplementasikan fitur **Chatbot Two Panel** (Sidebar + Chat Area):

### 1. **Frontend: ChatPage.jsx**
Struktur baru:
```
┌─────────────────────────────────────────────┐
│  SIDEBAR (Kiri)      │  CHAT AREA (Kanan)  │
│ ├ Riwayat Chat       │ ├ Header            │
│ ├ Chat Baru (btn)    │ ├ Messages Area     │
│ └ Sessions List      │ └ Input Form        │
└─────────────────────────────────────────────┘
```

**Fitur yang ditambahkan:**
- ✅ Sidebar dengan daftar riwayat percakapan (load dari API)
- ✅ Tombol "+ Chat Baru" untuk memulai percakapan baru
- ✅ Klik riwayat → Load chat lama dengan semua pesannya
- ✅ Tombol Hapus (trash icon) untuk menghapus session
- ✅ Responsive design (sidebar bisa buka/tutup di mobile)
- ✅ Smooth animations dengan Framer Motion
- ✅ Loading states yang jelas

**State Management:**
```javascript
const [sidebarOpen, setSidebarOpen] = useState(true);
const [chatSessions, setChatSessions] = useState([]); // Daftar sesi
const [currentSessionId, setCurrentSessionId] = useState(null); // Session aktif
const [loadingSessions, setLoadingSessions] = useState(false);
const [deletingSessionId, setDeletingSessionId] = useState(null);
const token = localStorage.getItem('access_token'); // Auth
```

**Fungsi Utama:**
1. `loadChatSessions()` - Load daftar riwayat dari API
2. `loadChatSession(sessionId)` - Load chat lama
3. `handleNewChat()` - Reset untuk percakapan baru
4. `handleDeleteSession(sessionId)` - Hapus session
5. `handleSend()` - Kirim pesan (update: sekarang include session_id)

### 2. **Backend: main.py**
Update endpoint:

**Sudah ada:**
- ✅ `GET /api/chat/sessions` - Ambil daftar chat sessions user
- ✅ `GET /api/chat/{session_id}/messages` - Ambil semua pesan dalam sesi

**Baru ditambahkan:**
- ✅ `DELETE /api/chat/{session_id}` - Hapus session beserta semua pesannya (cascading delete)

**Update di `/api/v1/chat` endpoint:**
- ✅ Sekarang accept `session_id` optional di request body
- ✅ Jika `session_id` kosong → buat sesi baru
- ✅ Jika `session_id` ada → append pesan ke sesi itu

### 3. **Backend: models.py**
Struktur database sudah sempurna (tidak perlu perubahan):

```
users
├── id (PK)
├── email
├── full_name
├── hashed_password
└── role
    ├── history_items (1:N)
    └── chat_sessions (1:N)
        └── messages (1:N)
            └── recommendations (JSON)
            └── sources (JSON)
```

**Fitur cascade delete:** Jika user/session dihapus, data terkait otomatis dihapus.

---

## 🚀 Cara Menggunakan

### Testing di Frontend

1. **Login terlebih dahulu** (untuk mendapat `access_token`)
2. **Masuk ke Chat Page**
3. Sidebar akan load otomatis dengan daftar chat lama
4. **Klik "+ Chat Baru"** untuk mulai percakapan baru
5. **Ketik pertanyaan** dan kirim
6. Chat akan tersimpan otomatis sebagai session baru
7. **Klik riwayat** untuk membuka percakapan lama
8. **Hover riwayat** → muncul tombol hapus (trash icon)

### API Endpoints

```bash
# Get semua chat sessions user (dengan auth token)
GET /api/chat/sessions
Header: Authorization: Bearer {token}
Response:
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "title": "Cari wisata alam...",
      "created_at": "2024-12-04T10:30:00"
    }
  ]
}

# Get semua pesan dalam sesi
GET /api/chat/{session_id}/messages
Header: Authorization: Bearer {token}

# Chat baru / lanjut sesi
POST /api/v1/chat
Header: Authorization: Bearer {token}
Body:
{
  "question": "Rekomendasi kuliner di Jember?",
  "session_id": null  // null = buat baru, atau masukkan ID sesi
}

# Hapus session (BARU)
DELETE /api/chat/{session_id}
Header: Authorization: Bearer {token}
Response:
{
  "status": "success",
  "message": "Chat session berhasil dihapus"
}
```

---

## 🐛 Troubleshooting

### Sidebar tidak muncul
- Check apakah `token` ada di localStorage
- Buka DevTools → Console cek error dari `loadChatSessions()`

### Chat lama tidak load
- Pastikan session_id ada dan user yang login adalah pemiliknya
- Check endpoint `/api/chat/{session_id}/messages` return data valid

### Delete tidak work
- Pastikan endpoint `DELETE /api/chat/{session_id}` sudah ada di backend
- Sudah diperbaiki di `main.py` (cek di sini: `@app.delete("/api/chat/{session_id}")`)

### Session tidak tersimpan
- Pastikan `session_id` di-include saat POST `/api/v1/chat`
- Sekarang ChatPage sudah otomatis kirim `session_id` (null untuk baru, ID untuk existing)

---

## 📝 Catatan Penting

1. **Auth Required:** Semua endpoint chat butuh token di header
   ```javascript
   headers: { Authorization: `Bearer ${token}` }
   ```

2. **Session Management:** 
   - Buat sesi baru → `session_id: null`
   - Lanjut sesi → `session_id: {existing_id}`
   - Frontend otomatis handle ini

3. **Responsive Design:**
   - Desktop: Sidebar always visible
   - Mobile: Toggle sidebar dengan menu button
   - Overlay hitam saat sidebar terbuka (mobile)

4. **Optimasi:** Sidebar hanya load 1x saat halaman mount (dependency: `[token]`)

---

## ✨ Fitur Bonus

- Auto-title dari 30 karakter pertama pertanyaan user
- Smooth animations saat sidebar toggle
- Loading skeleton saat fetch sessions
- Hover effect untuk delete button
- Timestamp untuk setiap session dan pesan
- Error handling yang jelas

---

**Status:** ✅ Ready to Deploy
**Tested:** Struktur dan logic flow
**Notes:** Test dengan auth token sebenarnya saat production
