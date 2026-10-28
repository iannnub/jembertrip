// src/pages/AdminPage.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  Plus, Upload, CheckCircle, AlertCircle, 
  MapPin, Tag, DollarSign, FileText, Trash2, Edit2, X, Search,
  Users, MessageCircle, LayoutDashboard, Sparkles,
  ChevronRight, GripVertical
} from 'lucide-react';
import NgrokImage from '../components/NgrokImage';
import { getImageUrl } from '../utils/imageHelper';
// Framer Motion untuk animasi
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function AdminPage() {
  // --- STATE ---
  const [wisataList, setWisataList] = useState([]);
  const [search, setSearch] = useState("");
  const [userReport, setUserReport] = useState([]);

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

  // --- DRAG AND DROP REORDER ---
  const dragItem = React.useRef(null);
  const dragOverItem = React.useRef(null);

  const handleDragStart = (e, index) => {
    if (search) return;
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    if (search) return;
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDrop = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (search || dragItem.current === null || dragOverItem.current === null) return;
    
    const copyList = [...wisataList];
    const dragContent = copyList[dragItem.current];
    copyList.splice(dragItem.current, 1);
    copyList.splice(dragOverItem.current, 0, dragContent);
    
    setWisataList(copyList);
    dragItem.current = null;
    dragOverItem.current = null;

    try {
      const token = localStorage.getItem('token');
      const newOrderIds = copyList.map(item => item.id.toString());
      await axios.put(`${API_BASE_URL}/api/admin/wisata-reorder`, 
        { new_order_ids: newOrderIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Urutan berhasil diperbarui!');
    } catch (err) {
      console.error('Reorder failed:', err);
      toast.error('Gagal menyimpan urutan baru');
    }
  };

  // Helper Auth Header
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/list-wisata?limit=1000`);
      setWisataList(res.data.data);
    } catch (err) {
      console.error("Gagal load data:", err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/stats`, getAuthHeader());
      if (res.data.status === 'success') {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Gagal load stats:", err);
    }
  }, [getAuthHeader]);

  const fetchUserReport = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/user-activity-report`, getAuthHeader());
      if (res.data.status === 'success') setUserReport(res.data.data);
    } catch (err) {
      console.error("Gagal load report:", err);
    }
  }, [getAuthHeader]);

  const filteredList = useMemo(() => {
    if (!search) return wisataList;
    const lower = search.toLowerCase();
    return wisataList.filter(item => 
      item.nama_wisata?.toLowerCase().includes(lower) || 
      item.alamat?.toLowerCase().includes(lower)
    );
  }, [search, wisataList]);

  // --- 1. LOAD DATA AWAL (PARALLEL & SAFE) ---
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [wisataRes, statsRes, reportRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/api/v1/list-wisata?limit=1000`),
          axios.get(`${API_BASE_URL}/api/admin/stats`, getAuthHeader()),
          axios.get(`${API_BASE_URL}/api/admin/user-activity-report`, getAuthHeader())
        ]);
        if (!isMounted) return;
        if (wisataRes.status === 'fulfilled') {
          setWisataList(wisataRes.value.data.data);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value.data.status === 'success') {
          setStats(statsRes.value.data.data);
        }
        if (reportRes.status === 'fulfilled' && reportRes.value.data.status === 'success') {
          setUserReport(reportRes.value.data.data);
        }
      } catch (e) {
        console.error("Initial load failed:", e);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [getAuthHeader]);

  // --- 2. HANDLER INPUT ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // --- FITUR MAGIC AI WRITER ---
  const handleGenerateDesc = async () => {
    if (!formData.nama_wisata) {
      return toast.error("Isi nama wisata dulu dong!");
    }
    
    setAiLoading(true);
    const toastId = toast.loading("Sedang menyusun deskripsi..."); 

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
      fetchUserReport();
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
      fetchUserReport();

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="liquid-card p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><Users size={28} /></div>
            <div><p className="text-sm text-text-muted font-medium">Total User</p><h3 className="text-2xl font-bold text-text-main tabular-nums">{stats.total_users}</h3></div>
          </div>
          <div className="liquid-card p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><MapPin size={28} /></div>
            <div><p className="text-sm text-text-muted font-medium">Total Wisata</p><h3 className="text-2xl font-bold text-text-main tabular-nums">{stats.total_wisata}</h3></div>
          </div>
          <div className="liquid-card p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><MessageCircle size={28} /></div>
            <div><p className="text-sm text-text-muted font-medium">Total Chat</p><h3 className="text-2xl font-bold text-text-main tabular-nums">{stats.total_chats}</h3></div>
          </div>
          <div className="liquid-card p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><Sparkles size={28} /></div>
            <div className="overflow-hidden">
              <p className="text-sm text-text-muted font-medium">Terpopuler</p>
              <h3 className="text-lg font-bold text-text-main truncate" title={stats.popular_wisata}>{stats.popular_wisata}</h3>
              <p className="text-xs text-text-muted tabular-nums">{stats.popular_count} kali diklik</p>
            </div>
          </div>
        </div>

        {/* === SECTION 2: FORM INPUT/EDIT === */}
        <div className="liquid-card rounded-3xl overflow-hidden">
          <div className={`p-8 text-white flex justify-between items-center ${isEditing ? 'bg-amber-600' : 'bg-rose-600'}`}>
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
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="label-admin mb-0"><FileText size={14}/> Deskripsi AI</label>
                    <button 
                      type="button"
                      onClick={handleGenerateDesc}
                      disabled={aiLoading}
                      className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1 rounded-full font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <span className="animate-spin">✨</span> 
                      ) : (
                        <Sparkles size={12} /> 
                      )}
                      {aiLoading ? "Menyusun..." : "Buat Deskripsi AI"}
                    </button>
                  </div>
                  <textarea name="deskripsi" rows="5" className="input-admin" placeholder="Tulis manual atau klik 'Generate AI'..." value={formData.deskripsi} onChange={handleChange} required></textarea>
                </div>
                
                <div>
                  <label className="label-admin"><Upload size={14}/> Foto {isEditing && "(Upload baru jika ingin mengganti)"}</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 relative group h-32 flex items-center justify-center overflow-hidden transition-colors hover:border-primary/50">
                    <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFileChange} />
                    {preview ? (
                      <NgrokImage src={preview} className="h-full w-full object-contain" alt="Preview"/>
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
              <button type="submit" disabled={loading} className={`ios-press text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2 ${isEditing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                {loading ? "Memproses..." : isEditing ? <><CheckCircle size={18} /> Simpan Perubahan</> : <><Plus size={18} /> Tambah Data</>}
              </button>
            </div>
          </form>
        </div>

        {/* === SECTION 3: LIST DATA === */}
        <div className="liquid-card rounded-3xl p-8">
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
              <thead className="text-xs text-text-muted uppercase bg-rose-50/70">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Foto</th>
                  <th className="px-4 py-3">Nama Wisata</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.map((item, index) => (
                  <tr key={item.id} 
                    draggable={!search} 
                    onDragStart={(e) => handleDragStart(e, index)} 
                    onDragEnter={(e) => handleDragEnter(e, index)} 
                    onDragEnd={handleDragEnd} 
                    onDragOver={(e) => e.preventDefault()} 
                    onDrop={handleDrop} 
                    className={`hover:bg-rose-50/40 transition-colors group ${!search ? 'cursor-move' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {!search && <GripVertical className="text-gray-300 opacity-50 group-hover:opacity-100 transition-opacity" size={20} />}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <NgrokImage src={getImageUrl(item.gambar)} alt={item.nama_wisata} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-main">{item.nama_wisata}</td>
                    <td className="px-4 py-3">
                      <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-xs font-bold">{item.kategori}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEditClick(item)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
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

        {/* === SECTION 4: USER ACTIVITY DOSSIER (TERKELOMPOK) === */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-600 rounded-lg text-white"><Users size={24} /></div>
            <div>
              <h2 className="text-2xl font-bold text-text-main">User Activity Dossier</h2>
              <p className="text-sm text-text-muted">Monitoring perilaku user berdasarkan ID secara spesifik.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {userReport.map((report) => (
              <details key={report.user_info.id} className="group liquid-card rounded-2xl overflow-hidden transition-all">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-bold">
                      {report.user_info.id}
                    </div>
                    <div>
                      <h3 className="font-bold text-text-main flex items-center gap-2">
                        {report.user_info.full_name} 
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 font-mono">
                          ID: {report.user_info.id}
                        </span>
                        <span className="text-rose-500 text-sm font-normal">(@{report.user_info.username})</span>
                      </h3>
                      <p className="text-xs text-text-muted">{report.total_clicks} Wisata diklik</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full group-open:hidden">Lihat Detail</span>
                    <ChevronRight size={20} className="text-gray-400 transition-transform group-open:rotate-90" />
                  </div>
                </summary>

                <div className="px-5 pb-5 border-t border-gray-50">
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] uppercase text-text-muted bg-gray-50">
                        <tr>
                          <th className="px-4 py-2">ID History</th>
                          <th className="px-4 py-2">Nama Wisata (ID Wisata)</th>
                          <th className="px-4 py-2 text-right">Waktu Akses</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {report.history?.length > 0 ? report.history.map((h) => (
                          <tr key={h.id} className="hover:bg-rose-50/40 transition-colors">
                            <td className="px-4 py-3 text-text-muted">#REC-{h.id}</td>
                            <td className="px-4 py-3 font-bold text-text-main">
                              {h.wisata_name} <span className="text-rose-600">({h.wisata_id})</span>
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-text-muted">
                              {new Date(h.timestamp).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="3" className="text-center py-6 text-text-muted italic text-xs">Belum ada riwayat aktivitas untuk pengguna ini.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

      </div>
      <style>{`
        .label-admin { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
        .input-admin { width: 100%; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.875rem; transition: all; }
        .input-admin:focus { outline: none; border-color: #E11D48; box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.1); }
      `}</style>
    </div>
  );
}

export default AdminPage;
