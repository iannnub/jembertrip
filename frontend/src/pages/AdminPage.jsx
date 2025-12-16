// src/pages/AdminPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Upload, CheckCircle, AlertCircle, 
  MapPin, Tag, DollarSign, FileText, Trash2, Edit2, X, Search,
  Users, MessageCircle, Star, LayoutDashboard, Sparkles 
} from 'lucide-react';
// Framer Motion untuk animasi
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function AdminPage() {
  // --- STATE ---
  const [wisataList, setWisataList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [search, setSearch] = useState("");
  
  // State untuk Statistik
  const [stats, setStats] = useState({
    total_users: 0,
    total_wisata: 0,
    total_chats: 0,
    popular_wisata: '-',
    popular_count: 0
  });

  // State Form
  const [formData, setFormData] = useState({
    nama_wisata: '', deskripsi: '', kategori: 'Rekreasi', 
    alamat: '', harga_tiket: '',
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  // State UI
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [editId, setEditId] = useState(null); 

  // --- 1. LOAD DATA AWAL ---
  useEffect(() => {
    fetchData();
    fetchStats(); 
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredList(wisataList);
    } else {
      const lower = search.toLowerCase();
      setFilteredList(wisataList.filter(item => 
        item.nama_wisata.toLowerCase().includes(lower) || 
        item.alamat.toLowerCase().includes(lower)
      ));
    }
  }, [search, wisataList]);

  // Helper Auth Header
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/list-wisata?limit=1000`);
      setWisataList(res.data.data);
      setFilteredList(res.data.data);
    } catch (err) {
      console.error("Gagal load data:", err);
    }
  };

  const fetchStats = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/stats`, getAuthHeader());
        if (res.data.status === 'success') {
            setStats(res.data.data);
        }
    } catch (err) {
        console.error("Gagal load stats:", err);
    }
  };

  // --- 2. HANDLER INPUT ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "https://placehold.co/100x100?text=No+Img";
    return path.startsWith('http') ? path : `/${path}`;
  };

  // --- FITUR MAGIC AI WRITER ---
  const handleGenerateDesc = async () => {
    if (!formData.nama_wisata) {
        return toast.error("Isi nama wisata dulu dong!");
    }
    
    setAiLoading(true);
    const toastId = toast.loading("AI sedang mengarang bebas..."); 

    try {
        const res = await axios.post(
            `${API_BASE_URL}/api/admin/generate-desc`,
            { 
                nama_wisata: formData.nama_wisata, 
                kategori: formData.kategori 
            },
            getAuthHeader()
        );

        if (res.data.status === 'success') {
            setFormData(prev => ({ ...prev, deskripsi: res.data.description }));
            toast.success("Deskripsi berhasil dibuat!", { id: toastId });
        }
    } catch (err) {
        console.error(err);
        toast.error("Gagal generate. Cek koneksi AI.", { id: toastId });
    } finally {
        setAiLoading(false);
    }
  };

  // --- 3. HANDLER EDIT & DELETE ---
  const handleEditClick = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormData({
      nama_wisata: item.nama_wisata,
      deskripsi: item.deskripsi,
      kategori: item.kategori,
      alamat: item.alamat,
      harga_tiket: item.harga_tiket,
    });
    setPreview(getImageUrl(item.gambar)); 
    setImageFile(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ nama_wisata: '', deskripsi: '', alamat: '', harga_tiket: '', kategori: 'Rekreasi' });
    setPreview(null);
    setImageFile(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin mau hapus wisata ini? Data akan hilang permanen.")) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/wisata/${id}`, getAuthHeader());
      toast.success("Data berhasil dihapus!");
      fetchData(); 
      fetchStats(); 
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus! Pastikan kamu login sebagai Admin.");
    }
  };

  // --- 4. SUBMIT (ADD / UPDATE) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    const data = new FormData();
    data.append('nama_wisata', formData.nama_wisata);
    data.append('deskripsi', formData.deskripsi);
    data.append('kategori', formData.kategori);
    data.append('alamat', formData.alamat);
    data.append('harga_tiket', formData.harga_tiket);
    
    if (imageFile) data.append('gambar', imageFile);

    const token = localStorage.getItem('token');
    const config = {
        headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        }
    };

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/api/admin/wisata/${editId}`, data, config);
        toast.success(`Perubahan pada "${formData.nama_wisata}" berhasil disimpan!`);
        setIsEditing(false); 
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/add-wisata`, data, config);
        toast.success(`Sukses! "${formData.nama_wisata}" berhasil ditambahkan.`);
      }

      setFormData({ nama_wisata: '', deskripsi: '', alamat: '', harga_tiket: '', kategori: 'Rekreasi' });
      setImageFile(null); 
      setPreview(null);
      fetchData();
      fetchStats(); 

    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Gagal menghubungi server.";
      setStatus({ type: 'error', msg: `Gagal: ${errorMsg}` });
      toast.error(`Gagal: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg pt-24 pb-12 px-4 font-sans text-text-main">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* === DASHBOARD STATS === */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Users (Pink Theme) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary"><Users size={28} /></div>
                <div><p className="text-sm text-text-muted font-medium">Total User</p><h3 className="text-2xl font-bold text-text-main">{stats.total_users}</h3></div>
            </div>
            {/* Card 2: Wisata (Green/Secondary Theme) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-xl text-secondary"><MapPin size={28} /></div>
                <div><p className="text-sm text-text-muted font-medium">Total Wisata</p><h3 className="text-2xl font-bold text-text-main">{stats.total_wisata}</h3></div>
            </div>
            {/* Card 3: Chat (Accent Theme) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-xl text-accent"><MessageCircle size={28} /></div>
                <div><p className="text-sm text-text-muted font-medium">Total Chat</p><h3 className="text-2xl font-bold text-text-main">{stats.total_chats}</h3></div>
            </div>
            {/* Card 4: Popular (Soft Pink Theme) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-primary-soft/10 rounded-xl text-primary-soft"><Star size={28} /></div>
                <div className="overflow-hidden">
                    <p className="text-sm text-text-muted font-medium">Terpopuler</p>
                    <h3 className="text-lg font-bold text-text-main truncate" title={stats.popular_wisata}>{stats.popular_wisata}</h3>
                    <p className="text-xs text-text-muted">{stats.popular_count} kali diklik</p>
                </div>
            </div>
        </motion.div>

        {/* === SECTION 2: FORM INPUT/EDIT === */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl shadow-primary/5 border border-gray-100 overflow-hidden">
          {/* Header: Toggle Color based on Mode (Primary Pink vs Accent Gold) */}
          <div className={`p-8 text-white flex justify-between items-center ${isEditing ? 'bg-accent' : 'bg-primary'}`}>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                {isEditing ? <Edit2 size={24} /> : <LayoutDashboard size={24} className="text-white/80" />} 
                {isEditing ? "Mode Edit Wisata" : "Manajemen Data Wisata"}
              </h1>
              <p className="text-white/90 mt-1 text-sm">
                {isEditing ? "Sedang mengedit data." : "Tambah, update, atau hapus destinasi wisata."}
              </p>
            </div>
            {isEditing && (
              <button onClick={handleCancelEdit} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                <X size={16} /> Batal Edit
              </button>
            )}
          </div>

          {status.msg && (
            <div className={`px-8 py-4 flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <p className="font-bold text-sm">{status.msg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                  <div><label className="label-admin"><Tag size={14}/> Nama Wisata</label><input type="text" name="nama_wisata" className="input-admin" placeholder="Contoh: Galaxy Tempurejo" value={formData.nama_wisata} onChange={handleChange} required /></div>
                  <div><label className="label-admin"><MapPin size={14}/> Alamat</label><input type="text" name="alamat" className="input-admin" placeholder="Kecamatan, Jember" value={formData.alamat} onChange={handleChange} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="label-admin">Kategori</label>
                          <select name="kategori" className="input-admin bg-white" value={formData.kategori} onChange={handleChange}>
                              {["Rekreasi", "Pantai", "Agrowisata", "Edukasi", "Religi", "Rural Tourism", "Air Terjun", "Situs", "Panorama"].map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                      </div>
                      <div><label className="label-admin"><DollarSign size={14}/> Tiket</label><input type="number" name="harga_tiket" className="input-admin" placeholder="10000" value={formData.harga_tiket} onChange={handleChange} required /></div>
                  </div>
              </div>
              <div className="space-y-4">
                  {/* Kolom Deskripsi dengan Tombol AI */}
                  <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="label-admin mb-0"><FileText size={14}/> Deskripsi AI</label>
                        <button 
                            type="button"
                            onClick={handleGenerateDesc}
                            disabled={aiLoading}
                            className="text-xs bg-accent/10 text-accent hover:bg-accent/20 px-3 py-1 rounded-full font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                            {aiLoading ? (
                                <span className="animate-spin">✨</span> 
                            ) : (
                                <Sparkles size={12} /> 
                            )}
                            {aiLoading ? "Mengarang..." : "Generate AI"}
                        </button>
                      </div>
                      <textarea name="deskripsi" rows="5" className="input-admin" placeholder="Tulis manual atau klik 'Generate AI'..." value={formData.deskripsi} onChange={handleChange} required></textarea>
                  </div>
                  
                  <div>
                      <label className="label-admin"><Upload size={14}/> Foto {isEditing && "(Upload baru jika ingin mengganti)"}</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 relative group h-32 flex items-center justify-center overflow-hidden transition-colors hover:border-primary/50">
                          <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFileChange} />
                          {preview ? (
                              <img src={preview} className="h-full w-full object-contain" alt="Preview"/>
                          ) : (
                              <div className="text-gray-400 text-xs">
                                <Upload size={24} className="mx-auto mb-1 opacity-50"/> Klik / Drop gambar
                              </div>
                          )}
                      </div>
                  </div>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" disabled={loading} className={`text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2 ${isEditing ? 'bg-accent hover:bg-yellow-500' : 'bg-primary hover:bg-primary-soft'}`}>
                  {loading ? "Memproses..." : isEditing ? <><CheckCircle size={18} /> Simpan Perubahan</> : <><Plus size={18} /> Tambah Data</>}
              </button>
            </div>
          </form>
        </motion.div>

        {/* === SECTION 3: LIST DATA === */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-text-main">Daftar Wisata ({filteredList.length})</h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" placeholder="Cari wisata..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted uppercase bg-primary/5">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Foto</th>
                  <th className="px-4 py-3">Nama Wisata</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                        <img src={getImageUrl(item.gambar)} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-main">{item.nama_wisata}</td>
                    <td className="px-4 py-3">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">{item.kategori}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEditClick(item)} className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredList.length === 0 && <p className="text-center text-text-muted py-8">Tidak ada data ditemukan.</p>}
          </div>
        </div>

      </div>
      <style>{`
        .label-admin { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
        .input-admin { width: 100%; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.875rem; transition: all; }
        /* Ubah focus ring ke warna PRIMARY (Pink) */
        .input-admin:focus { outline: none; border-color: #EC4899; box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1); }
      `}</style>
    </div>
  );
}

export default AdminPage;