// src/pages/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    User, Mail, Lock, Camera, Save, LogOut, Shield 
} from 'lucide-react';
// Import Animasi
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // State Form Data Diri
    const [formData, setFormData] = useState({ full_name: '', email: '' });
    
    // State Form Password
    const [passData, setPassData] = useState({ old_password: '', new_password: '' });

    // Load Data Awal
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setFormData({ full_name: parsedUser.full_name, email: parsedUser.email });
    }, [navigate]);

    // --- 1. HANDLE UPLOAD AVATAR ---
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        const toastId = toast.loading("Mengupload foto...");

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/users/avatar`, uploadData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}` 
                }
            });

            // Update Local State & Storage
            const updatedUser = { ...user, avatar: res.data.avatar_url };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Trigger event biar Navbar update (Opsional, page refresh lebih gampang)
            window.location.reload(); 
            
            toast.success("Foto profil keren abis! 😎", { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error("Gagal upload foto.", { id: toastId });
        }
    };

    // --- 2. HANDLE UPDATE PROFILE ---
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_BASE_URL}/api/users/me`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update Storage
            const updatedUser = { ...user, ...res.data.user };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            toast.success("Profil berhasil diperbarui!");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Gagal update profil.");
        } finally {
            setLoading(false);
        }
    };

    // --- 3. HANDLE GANTI PASSWORD ---
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passData.new_password.length < 6) return toast.error("Password baru minimal 6 karakter.");
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/users/change-password`, passData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Password berhasil diganti! Jangan lupa ya.");
            setPassData({ old_password: '', new_password: '' });
        } catch (err) {
            toast.error(err.response?.data?.detail || "Gagal ganti password.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
        toast.success("Logout berhasil.");
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-page-bg pt-24 pb-12 px-4 font-sans text-text-main">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* --- KOLOM KIRI: KARTU PROFIL --- */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="md:col-span-1 space-y-6"
                >
                    <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 p-8 text-center border border-gray-100 relative overflow-hidden">
                        {/* Header Gradient: Pink ke Emas */}
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary to-accent"></div>
                        
                        <div className="relative mt-8 mb-4 group inline-block">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-page-bg mx-auto">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-4xl font-bold">
                                        {user.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {/* Tombol Kamera Overlay */}
                            <label className="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full cursor-pointer hover:bg-primary-soft transition-colors shadow-md border border-white">
                                <Camera size={18} />
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </label>
                        </div>

                        <h2 className="text-xl font-bold text-text-main">{user.full_name}</h2>
                        <p className="text-text-muted text-sm mb-4">@{user.username}</p>
                        
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'}`}>
                            {user.role === 'admin' ? <Shield size={14}/> : <User size={14}/>}
                            {user.role}
                        </div>

                        <button onClick={handleLogout} className="w-full mt-8 py-2.5 border border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 flex items-center justify-center gap-2 transition-colors">
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </motion.div>

                {/* --- KOLOM KANAN: FORM EDIT --- */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="md:col-span-2 space-y-8"
                >
                    {/* Form Ganti Info */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                        <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
                            <User className="text-primary" size={20} /> Edit Data Diri
                        </h3>
                        <form onSubmit={handleUpdateProfile} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-text-main mb-1">Nama Lengkap</label>
                                <input type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-text-main bg-page-bg" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-main mb-1">Email Address</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-text-main bg-page-bg" />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={loading} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-soft transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                                    <Save size={18} /> Simpan Profil
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Form Ganti Password */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                        <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
                            <Lock className="text-accent" size={20} /> Ganti Password
                        </h3>
                        <form onSubmit={handleChangePassword} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-text-main mb-1">Password Lama</label>
                                <input type="password" value={passData.old_password} onChange={(e) => setPassData({...passData, old_password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all text-text-main bg-page-bg" placeholder="••••••" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-main mb-1">Password Baru</label>
                                <input type="password" value={passData.new_password} onChange={(e) => setPassData({...passData, new_password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all text-text-main bg-page-bg" placeholder="Minimal 6 karakter" />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={loading} className="bg-text-main text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg">
                                    <Save size={18} /> Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

export default ProfilePage;