// src/App.jsx

import React, { useState, useEffect } from 'react';
// Import Routing
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
// Import Library UI
import { Toaster, toast } from 'react-hot-toast'; 
// Import Icon Modern
import { MapPin, LogOut, LogIn, Home, Sparkles, Menu, X, LayoutDashboard } from 'lucide-react'; 

// Import Halaman
import AdminPage from './pages/AdminPage';
import WisataHome from './pages/WisataHome';
import WisataDetail from './pages/WisataDetail';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage'; 

// --- KOMPONEN PROTEKSI RUTE ADMIN ---
const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);
  if (user.role !== 'admin') {
    toast.error("Eits! Kamu bukan admin 😜");
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const noFooterPaths = ['/rekomendasi', '/login', '/register'];
  const shouldShowFooter = !noFooterPaths.includes(location.pathname);

  // 1. Cek Login
  useEffect(() => {
    const cekUserLogin = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error("Data user korup", e);
          localStorage.clear();
        }
      } else {
        setUser(null);
      }
    };
    cekUserLogin();
  }, [location]); 

  // 2. Cegah scroll saat menu mobile terbuka
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'; 
    } else {
      document.body.style.overflow = 'unset'; 
    }
  }, [isMobileMenuOpen]);

  // 3. Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsMobileMenuOpen(false); 
    toast.success("Berhasil logout! Sampai jumpa 👋");
    navigate('/login');
  };

  // Helper Active Menu (Updated Colors)
  const isActive = (path) => 
    location.pathname === path 
      ? "text-primary font-bold bg-primary/10 ring-1 ring-primary/20" 
      : "text-text-muted hover:text-primary hover:bg-white";

  return (
    // Global Wrapper: Gunakan page-bg dan text-main
    <div className="flex flex-col min-h-screen bg-page-bg font-sans text-text-main selection:bg-primary/20 selection:text-primary">
      
      {/* --- TOASTER --- */}
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          style: { borderRadius: '12px', background: '#333', color: '#fff', fontSize: '14px' },
          success: { style: { background: '#10B981', color: 'white' } }, // Green for success
          error: { style: { background: '#EC4899', color: 'white' } },   // Pink for error (Match theme)
        }}
      />

      {/* --- NAVBAR MODERN --- */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-page-bg/80 backdrop-blur-md border-b border-primary/10 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between relative z-50">
          
          {/* LOGO */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 group select-none" 
            onClick={() => setIsMobileMenuOpen(false)} 
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary blur-sm opacity-20 rounded-xl group-hover:opacity-40 transition-opacity"></div>
              {/* Gradien Logo: Primary -> Accent */}
              <div className="relative bg-gradient-to-br from-primary to-accent p-2 rounded-xl text-white shadow-lg shadow-primary/30 transform group-hover:scale-105 transition-transform duration-300">
                <MapPin size={22} fill="currentColor" className="text-white" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xl font-bold tracking-tight text-text-main leading-none">
                JemberTrip
              </span>
              <span className="text-[10px] font-bold tracking-widest text-secondary uppercase">
                Explore Jatim
              </span>
            </div>
          </Link>
          
          {/* TOMBOL TOGGLE (Mobile) */}
          <button 
            className="md:hidden p-2 text-text-muted bg-white border border-primary/10 rounded-full hover:bg-primary/5 hover:text-primary transition-colors focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* MENU DESKTOP */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center bg-white/60 border border-primary/10 p-1.5 rounded-full backdrop-blur-md shadow-sm mr-4">
              <Link to="/" className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-all duration-300 ${isActive('/')}`}>
                <Home size={16} /> Home
              </Link>
              <Link to="/rekomendasi" className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-all duration-300 ${isActive('/rekomendasi')}`}>
                <Sparkles size={16} /> AI Chat
              </Link>
              
              {/* Menu Dashboard Admin (Accent Color) */}
              {user && user.role === 'admin' && (
                <Link to="/admin" className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-all duration-300 text-accent hover:bg-yellow-50 font-medium ${isActive('/admin')}`}>
                    <LayoutDashboard size={16} /> Dashboard
                </Link>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-primary/10">
                {/* Profile Pill */}
                <Link to="/profile" className="flex items-center gap-3 bg-white/50 border border-primary/10 pl-4 pr-1.5 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <div className="text-right">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'text-accent' : 'text-text-muted'}`}>
                        {user.role === 'admin' ? 'Administrator' : 'User'}
                    </p>
                    <p className="text-sm font-bold text-text-main leading-none truncate max-w-[100px] group-hover:text-primary transition-colors">
                      {user.full_name.split(' ')[0]}
                    </p>
                  </div>
                  
                  {/* Avatar: Pink Gradient */}
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md overflow-hidden ${user.role === 'admin' ? 'bg-gradient-to-tr from-accent to-orange-400 shadow-orange-200' : 'bg-gradient-to-tr from-primary to-primary-soft shadow-pink-200'}`}>
                    {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        user.full_name.charAt(0).toUpperCase()
                    )}
                  </div>
                </Link>

                <button 
                  onClick={handleLogout}
                  className="h-10 w-10 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/5 rounded-full transition-all border border-transparent hover:border-primary/10"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              // Tombol Login Desktop: Gradient Pink
              <Link 
                to="/login" 
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-primary to-primary-soft hover:shadow-lg hover:shadow-primary/30 rounded-full focus:outline-none hover:-translate-y-0.5"
              >
                <LogIn size={16} /> Masuk Akun
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* --- MENU MOBILE OVERLAY --- */}
      <div 
        className={`fixed inset-0 bg-page-bg z-40 flex flex-col pt-24 px-6 transition-all duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-5 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto pb-10">
            <div className="flex flex-col gap-4 w-full">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Menu Utama</p>
                
                <Link 
                  to="/" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-primary/10 active:scale-95 transition-all group hover:border-primary/30"
                >
                      <div className="h-10 w-10 bg-primary/5 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <Home size={20} />
                      </div>
                      <span className="text-lg font-bold text-text-main">Home</span>
                </Link>

                <Link 
                  to="/rekomendasi" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-primary/10 active:scale-95 transition-all group hover:border-primary/30"
                >
                      <div className="h-10 w-10 bg-primary/5 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <Sparkles size={20} />
                      </div>
                      <span className="text-lg font-bold text-text-main">AI Chat Recommendation</span>
                </Link>

                {user && user.role === 'admin' && (
                    <Link 
                    to="/admin" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-50 border border-yellow-100 active:scale-95 transition-all group"
                    >
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-accent">
                            <LayoutDashboard size={20} />
                        </div>
                        <span className="text-lg font-bold text-yellow-800">Dashboard Admin</span>
                    </Link>
                )}
            </div>

            <div className="w-full h-px bg-primary/10 my-6"></div>

            <div className="mt-auto md:mt-0">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Akun Saya</p>
                
                {user ? (
                    <div className="flex flex-col gap-4">
                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-primary/10 active:scale-95 transition-transform">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary to-primary-soft flex items-center justify-center text-white font-bold text-xl shadow-md overflow-hidden">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user.full_name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-primary font-bold uppercase">
                                    {user.role === 'admin' ? 'Administrator' : 'Sedang Login'}
                                </p>
                                <p className="font-bold text-text-main text-lg line-clamp-1">{user.full_name}</p>
                            </div>
                        </Link>

                        <button 
                            onClick={handleLogout}
                            className="w-full py-4 text-primary font-bold bg-primary/5 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/10 active:scale-95 transition-all border border-primary/10"
                        >
                            <LogOut size={20} /> Keluar Aplikasi
                        </button>
                    </div>
                ) : (
                    <Link 
                        to="/login" 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg text-center flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-transform"
                    >
                        <LogIn size={20} /> Masuk Akun
                    </Link>
                )}
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className={`flex-grow pt-20 ${!shouldShowFooter ? 'h-[calc(100vh-80px)] overflow-hidden' : 'pb-12 px-4 md:px-0'}`}>
        <Routes>
          <Route path="/" element={<WisataHome />} />
          <Route path="/wisata/:id" element={<WisataDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/rekomendasi" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          <Route 
            path="/admin" 
            element={
                <ProtectedAdminRoute>
                    <AdminPage />
                </ProtectedAdminRoute>
            } 
          />
        </Routes>
      </main>

      {/* --- FOOTER (Updated Theme) --- */}
      {shouldShowFooter && (
        <footer className="bg-primary/5 border-t border-primary/10 pt-10 pb-6 mt-auto">
          <div className="container mx-auto px-6 text-center">
              <div className="flex flex-col items-center">
                  
                  <div className="bg-white p-3 rounded-full mb-4 shadow-sm border border-primary/20">
                      <MapPin size={22} className="text-primary" />
                  </div>

                  <p className="text-text-muted text-sm font-medium mb-1">
                      Semua Karna ❤️ untuk <span className="text-primary font-bold tracking-wide">Masyrakat Jember</span>
                  </p>
                  <p className="text-xs text-text-muted/60">
                     iannnub &copy; {new Date().getFullYear()} JemberTrip - Universitas Muhammadiyah Jember
                  </p>
              </div>
          </div>
        </footer>
      )}

    </div>
  );
}

export default App;