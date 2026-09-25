// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import TurnstileWidget from '../components/TurnstileWidget';
// Import Icons
import { User, Lock, LogIn, ArrowLeft, Eye, EyeOff, XCircle } from 'lucide-react';
// Import Animasi
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
// Import Toast
import { toast } from 'react-hot-toast';

// Fallback URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ===== ATURAN VALIDASI =====
function validateField(name, value) {
  switch (name) {
    case 'username':
      if (!value || !value.trim()) return 'Username wajib diisi.';
      if (value.length < 3)        return 'Username minimal 3 karakter.';
      return '';
    case 'password':
      if (!value) return 'Password wajib diisi.';
      if (value.length < 6) return 'Password minimal 6 karakter.';
      return '';
    default:
      return '';
  }
}

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors,      setErrors]      = useState({});
  const [touched,     setTouched]     = useState({});
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
    if (serverError) setServerError(null);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev =>  ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi semua field sebelum kirim
    const newErrors = {
      username: validateField('username', formData.username),
      password: validateField('password', formData.password),
    };
    setErrors(newErrors);
    setTouched({ username: true, password: true });

    if (Object.values(newErrors).some(msg => msg)) {
      toast.error('Lengkapi isian form terlebih dahulu!');
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      const payload = {
        ...formData,
        turnstile_token: turnstileToken || undefined
      };
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, payload);

      if (response.data.status === 'success') {
        const { access_token, user } = response.data;

        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        toast.success(`Selamat datang, ${user.full_name}!`);

        setTimeout(() => {
          if (user.role === 'admin')       navigate('/admin');
          else if (!user.has_onboarded)   navigate('/onboard');
          else                            navigate('/');
        }, 1500);
      }
    } catch (err) {
      const pesanError = err.response?.data?.detail || 'Username atau password salah.';
      setServerError(pesanError);
      toast.error('Gagal Login: ' + pesanError);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name) =>
    `w-full pl-11 pr-10 py-3.5 rounded-xl bg-page-bg border outline-none transition-all text-text-main placeholder-gray-400 font-medium focus:bg-white focus:ring-4 ${
      touched[name] && errors[name]
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
        : touched[name] && !errors[name]
        ? 'border-green-400 focus:border-green-400 focus:ring-green-100'
        : 'border-gray-200 focus:border-primary focus:ring-primary/10'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-page-bg to-pink-100 px-4 relative overflow-x-hidden overflow-y-auto py-20 text-text-main">
      <SEO
        title="Masuk Akun Wisatawan"
        description="Masuk ke akun JemberTrip untuk menyimpan riwayat wisata, personalisasi rekomendasi destinasi, dan konsultasi AI Cak Jember."
        url="https://jembertrip.id/login"
        noindex={true}
      />

      {/* Background Shape Hiasan */}
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
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm rotate-3 border border-primary/20">
            <LogIn size={32} />
          </div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight">Welcome Back!</h2>
          <p className="text-text-muted mt-2 text-sm">Masuk untuk melanjutkan petualanganmu.</p>
        </div>

        {/* Server Error Banner */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              key="server-error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3"
            >
              <XCircle size={18} className="shrink-0" />
              {serverError}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* Username */}
          <div className="space-y-1">
            <label htmlFor="login-username" className="block text-sm font-semibold text-text-main ml-1">Username</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                id="login-username"
                type="text"
                name="username"
                autoComplete="username"
                className={fieldClass('username')}
                placeholder="Username kamu"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <AnimatePresence>
              {touched.username && errors.username && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-500 ml-1">{errors.username}</motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="login-password" className="block text-sm font-semibold text-text-main ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                className={fieldClass('password')}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <AnimatePresence>
              {touched.password && errors.password && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-500 ml-1">{errors.password}</motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Cloudflare Turnstile Anti-Spam / CAPTCHA */}
          <TurnstileWidget
            onVerify={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken('')}
          />

          {/* Tombol Login */}
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
            ) : 'Masuk Akun'}
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
