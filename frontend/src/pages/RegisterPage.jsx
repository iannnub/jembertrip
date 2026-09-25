// src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import TurnstileWidget from '../components/TurnstileWidget';
import { trackEvent } from '../utils/analytics';
// Import Icons
import { User, Mail, Lock, UserPlus, ArrowLeft, Type, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
// Import Animasi
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
// Import Toast
import { toast } from 'react-hot-toast';

// Ambil URL Backend dari .env (dengan fallback)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ===== ATURAN VALIDASI =====
const REGEX_EMAIL       = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_USERNAME    = /^[a-zA-Z0-9_]+$/;
const REGEX_HAS_LETTER  = /[a-zA-Z]/;
const REGEX_HAS_NUMBER  = /[0-9]/;

function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)            score++;
  if (password.length >= 12)           score++;
  if (REGEX_HAS_LETTER.test(password)) score++;
  if (REGEX_HAS_NUMBER.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password))  score++;

  if (score <= 2) return { level: 1, label: 'Lemah',       color: 'bg-red-400'     };
  if (score <= 3) return { level: 2, label: 'Sedang',      color: 'bg-yellow-400'  };
  if (score <= 4) return { level: 3, label: 'Kuat',        color: 'bg-green-400'   };
  return            { level: 4, label: 'Sangat Kuat', color: 'bg-emerald-500' };
}

function validateField(name, value) {
  switch (name) {
    case 'username':
      if (!value)                                      return 'Username wajib diisi.';
      if (value.length < 3 || value.length > 30)      return 'Username harus 3–30 karakter.';
      if (!REGEX_USERNAME.test(value))                 return 'Hanya huruf, angka, dan underscore (_) yang diperbolehkan.';
      return '';
    case 'full_name':
      if (!value)                                      return 'Nama lengkap wajib diisi.';
      if (value.length < 2 || value.length > 100)     return 'Nama harus 2–100 karakter.';
      return '';
    case 'email':
      if (!value)                                      return 'Email wajib diisi.';
      if (!REGEX_EMAIL.test(value))                   return 'Format email tidak valid.';
      return '';
    case 'password':
      if (!value)                                      return 'Password wajib diisi.';
      if (value.length < 8)                            return 'Password minimal 8 karakter.';
      if (!REGEX_HAS_LETTER.test(value))              return 'Password harus mengandung huruf.';
      if (!REGEX_HAS_NUMBER.test(value))              return 'Password harus mengandung angka.';
      return '';
    default:
      return '';
  }
}

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username:  '',
    full_name: '',
    email:     '',
    password:  ''
  });

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

    // Validasi semua field sekaligus saat submit
    const allFields = ['username', 'full_name', 'email', 'password'];
    const newErrors = {};
    allFields.forEach(f => { newErrors[f] = validateField(f, formData[f]); });
    setErrors(newErrors);
    setTouched({ username: true, full_name: true, email: true, password: true });

    if (Object.values(newErrors).some(msg => msg)) {
      toast.error('Periksa kembali isian form kamu!');
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      const payload = {
        ...formData,
        turnstile_token: turnstileToken || undefined
      };
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, payload);
      if (response.data.status === 'success') {
        trackEvent('user_registered', {
          method: 'email',
          username_length: formData.username.length
        });
        toast.success('Yeay! Akun berhasil dibuat. Yuk login! 🎉');
        setTimeout(() => { navigate('/login'); }, 1500);
      }
    } catch (err) {
      const pesanError = err.response?.data?.detail || 'Terjadi kesalahan saat registrasi.';
      setServerError(pesanError);
      toast.error('Gagal Daftar: ' + pesanError);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(formData.password);

  const fieldClass = (name) =>
    `w-full pl-11 pr-10 py-3.5 rounded-xl bg-page-bg border outline-none transition-all text-text-main placeholder-gray-400 font-medium focus:bg-white focus:ring-4 ${
      touched[name] && errors[name]
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
        : touched[name] && !errors[name]
        ? 'border-green-400 focus:border-green-400 focus:ring-green-100'
        : 'border-gray-200 focus:border-primary focus:ring-primary/10'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-page-bg to-pink-100 px-4 relative overflow-x-hidden overflow-y-auto py-20">
      <SEO
        title="Daftar Akun Baru"
        description="Daftar akun JemberTrip untuk mulai menjelajahi pesona pariwisata Kabupaten Jember dengan panduan AI cerdas."
        url="https://jembertrip.id/register"
        noindex={true}
      />

      {/* Background Hiasan */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-primary/5 p-8 border border-white/50 relative z-10"
      >
        {/* Tombol Kembali */}
        <Link to="/" className="absolute top-6 left-6 text-text-muted hover:text-primary transition-colors">
          <ArrowLeft size={24} />
        </Link>

        <div className="text-center mb-8 mt-2">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm rotate-3 border border-primary/20">
            <UserPlus size={32} />
          </div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight">Buat Akun Baru</h2>
          <p className="text-text-muted mt-2 text-sm">Gabung sekarang buat eksplor Jember!</p>
        </div>

        {/* Server Error Banner */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              key="server-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3"
            >
              <XCircle size={18} className="shrink-0" />
              {serverError}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Username */}
          <div className="space-y-1">
            <label htmlFor="register-username" className="block text-sm font-semibold text-text-main ml-1">Username</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                id="register-username"
                type="text"
                name="username"
                autoComplete="username"
                className={fieldClass('username')}
                placeholder="min. 3 karakter (huruf, angka, _)"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.username && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {errors.username
                    ? <XCircle size={16} className="text-red-400" />
                    : <CheckCircle size={16} className="text-green-400" />}
                </div>
              )}
            </div>
            <AnimatePresence>
              {touched.username && errors.username && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-500 ml-1">{errors.username}</motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Nama Lengkap */}
          <div className="space-y-1">
            <label htmlFor="register-full-name" className="block text-sm font-semibold text-text-main ml-1">Nama Lengkap</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Type size={18} className="text-gray-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                id="register-full-name"
                type="text"
                name="full_name"
                autoComplete="name"
                className={fieldClass('full_name')}
                placeholder="Nama lengkap kamu"
                value={formData.full_name}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.full_name && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {errors.full_name
                    ? <XCircle size={16} className="text-red-400" />
                    : <CheckCircle size={16} className="text-green-400" />}
                </div>
              )}
            </div>
            <AnimatePresence>
              {touched.full_name && errors.full_name && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-500 ml-1">{errors.full_name}</motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="register-email" className="block text-sm font-semibold text-text-main ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                id="register-email"
                type="email"
                name="email"
                autoComplete="email"
                className={fieldClass('email')}
                placeholder="email@contoh.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.email && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {errors.email
                    ? <XCircle size={16} className="text-red-400" />
                    : <CheckCircle size={16} className="text-green-400" />}
                </div>
              )}
            </div>
            <AnimatePresence>
              {touched.email && errors.email && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-500 ml-1">{errors.email}</motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="register-password" className="block text-sm font-semibold text-text-main ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                className={fieldClass('password')}
                placeholder="Min. 8 karakter (huruf + angka)"
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

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2 space-y-1 px-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.level ? strength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  strength.level <= 1 ? 'text-red-500'
                  : strength.level === 2 ? 'text-yellow-600'
                  : 'text-green-600'
                }`}>
                  Kekuatan: {strength.label}
                </p>
              </div>
            )}

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

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary-soft text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mendaftarkan...
              </span>
            ) : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-text-muted">
            Sudah punya akun?
            <Link to="/login" className="text-primary font-bold hover:text-primary-soft hover:underline ml-1 transition-colors">
              Login di sini
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
