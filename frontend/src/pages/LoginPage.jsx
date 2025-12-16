// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
// Import Icons
import { User, Lock, LogIn, ArrowLeft } from 'lucide-react';
// Import Animasi
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
// Import Toast
import { toast } from 'react-hot-toast';

// Fallback URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function LoginPage() {
  const navigate = useNavigate(); 

  const [formData, setFormData] = useState({
    username: '', 
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);
      
      if (response.data.status === "success") {
        const { access_token, user } = response.data;

        // 1. Simpan Token & User Info
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));

        // 2. Tampilkan notifikasi
        toast.success(`Selamat datang, ${user.full_name}!`);
        
        // 3. LOGIKA REDIRECT CERDAS (Traffic Light) 🚦
        setTimeout(() => {
            if (user.role === 'admin') {
                navigate('/admin'); 
            } else {
                navigate('/'); 
            }
        }, 1000);
      }
    } catch (err) {
      const pesanError = err.response?.data?.detail || "Username atau password salah.";
      setError(pesanError);
      toast.error("Gagal Login: " + pesanError);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Update Background: Gradient PageBG ke Pink Lembut
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-page-bg to-pink-100 px-4 py-12 relative overflow-hidden text-text-main">
      
      {/* Background Shape Hiasan (Updated Colors) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-primary/5 p-8 border border-white/50 relative z-10"
      >
        {/* Tombol Kembali */}
        <Link to="/" className="absolute top-6 left-6 text-text-muted hover:text-primary transition-colors">
            <ArrowLeft size={24} />
        </Link>

        <div className="text-center mb-8 mt-4">
          {/* Logo Box: Pink */}
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm rotate-3 border border-primary/20">
             <LogIn size={32} />
          </div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight">Welcome Back!</h2>
          <p className="text-text-muted mt-2 text-sm">Masuk untuk melanjutkan petualanganmu.</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Input Username */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-text-main ml-1">Username</label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="text" 
                  name="username"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-page-bg border border-gray-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-text-main placeholder-gray-400 font-medium"
                  placeholder="Username kamu"
                  onChange={handleChange}
                />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-text-main ml-1">Password</label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="password" 
                  name="password"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-page-bg border border-gray-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-text-main placeholder-gray-400 font-medium"
                  placeholder="••••••••"
                  onChange={handleChange}
                />
            </div>
          </div>

          {/* Tombol Login: Gradient Pink */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary-soft text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none mt-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memverifikasi...
              </span>
            ) : (
              "Masuk Akun"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-sm text-text-muted">
            Belum punya akun? 
            <Link to="/register" className="text-primary font-bold hover:text-primary-soft hover:underline ml-1 transition-colors">
                Daftar Sekarang
            </Link>
            </p>
        </div>

      </motion.div>
    </div>
  );
}

export default LoginPage;