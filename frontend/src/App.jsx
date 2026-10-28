// src/App.jsx

import MobileNav from './components/MobileNav';
import Footer from './components/Footer';
import { getAvatarUrl } from './utils/imageHelper';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import axios from 'axios';
// Import Routing
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
// Import Library UI
import { Toaster, toast } from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
// Import Icon Modern
import { MapPin, LogOut, LogIn, Home, Sparkles, LayoutDashboard } from 'lucide-react'; 

// Bypass ngrok interstitial globally for all axios requests
axios.defaults.headers.common['ngrok-skip-browser-warning'] = '69420';

// Eager load primary pages for 0ms instant navigation
import WisataHome from './pages/WisataHome';
import WisataDetail from './pages/WisataDetail';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';

// Lazy load secondary route chunks
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

import { trackPageView } from './utils/analytics';

function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);
  return null;
}

// Loading fallback spinner
const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-medium text-slate-500">Memuat halaman...</span>
  </div>
);

// --- KOMPONEN PROTEKSI RUTE ADMIN ---
const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);
  if (user.role !== 'admin') {
    toast.error("Akses terbatas untuk akun administrator.");
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll listener for sticky navbar shadow & blur
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const noFooterPaths = ['/rekomendasi', '/login', '/register', '/onboard'];
  const shouldShowFooter = !noFooterPaths.includes(location.pathname);
  const isChatRoute = location.pathname === '/rekomendasi' || location.pathname === '/chat';

  // 1. Cek Login
  useEffect(() => {
    const cekUserLogin = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Proteksi Onboarding (Mencegah user skip)
          if (!parsedUser.has_onboarded && location.pathname !== '/onboard' && location.pathname !== '/login' && location.pathname !== '/register') {
            navigate('/onboard');
          } else if (parsedUser.has_onboarded && location.pathname === '/onboard') {
            navigate('/');
          }
        } catch (e) {
          console.error("Data user korup", e);
          localStorage.clear();
        }
      } else {
        setUser(null);
      }
    };
    cekUserLogin();
  }, [location, navigate]); 

  // 2. Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success("Berhasil logout.");
    navigate('/login');
  };

  // Dynamic Island Navigation Items
  const navItems = [
    { path: '/', label: 'Beranda', icon: Home, match: (p) => p === '/' || p === '/wisata' },
    { path: '/rekomendasi', label: 'AI Chat', icon: Sparkles, match: (p) => p === '/rekomendasi' || p === '/chat' },
    ...(user && user.role === 'admin'
      ? [{ path: '/admin', label: 'Dashboard', icon: LayoutDashboard, match: (p) => p === '/admin' }]
      : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-page-bg font-sans text-text-main selection:bg-primary/20 selection:text-primary">
      <RouteTracker />
      
      {/* --- TOASTER --- */}
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          style: { borderRadius: '16px', background: '#0F172A', color: '#fff', fontSize: '14px' },
          success: { style: { background: '#059669', color: 'white' } },
          error: { style: { background: '#E11D48', color: 'white' } },
        }}
      />

      {/* --- NAVBAR IPHONE LIQUID GLASS & DYNAMIC ISLAND MORPHING (z-50) --- */}
      <header 
        className={`sticky top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'liquid-glass border-b border-white/70' 
            : 'bg-white/70 backdrop-blur-xl border-b border-slate-200/60'
        }`}
      >
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          
          {/* LOGO */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 group select-none min-h-[44px] ios-press"
          >
            <div className="relative bg-rose-600 p-2.5 rounded-2xl text-white shadow-md shadow-rose-600/20 border border-white/30 transform group-hover:scale-105 transition-transform duration-300">
              <MapPin size={20} fill="currentColor" className="text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                JemberTrip
              </span>
              <span className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase mt-0.5">
                Explore Jatim
              </span>
            </div>
          </Link>

          {/* MENU DESKTOP: DYNAMIC ISLAND MORPHING PILL BAR */}
          <div className="hidden md:flex items-center gap-3">
            <nav
              aria-label="Navigasi Utama"
              className="liquid-glass-pill flex items-center p-1.5 rounded-full mr-2"
            >
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const active = item.match(location.pathname);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors duration-200 min-h-[44px] ${
                      active ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-liquid-pill"
                        transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                        className="absolute inset-0 bg-slate-900 rounded-full shadow-sm"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <IconComponent size={16} />
                      <span>{item.label}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>

            {user ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200/80">
                {/* Profile Liquid Pill */}
                <Link
                  to="/profile"
                  className="liquid-glass-pill flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full hover:border-rose-200 transition-all cursor-pointer group ios-press min-h-[44px]"
                >
                  <div className="text-right">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'text-amber-700' : 'text-slate-500'}`}>
                      {user.role === 'admin' ? 'Administrator' : 'Wisatawan'}
                    </p>
                    <p className="text-sm font-bold text-slate-900 leading-none truncate max-w-[110px] group-hover:text-rose-600 transition-colors">
                      {user.full_name?.split(' ')[0]}
                    </p>
                  </div>
                  
                  {/* Avatar: Solid Badge */}
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xs overflow-hidden ring-2 ring-white ${user.role === 'admin' ? 'bg-amber-600' : 'bg-rose-600'}`}>
                    {user.avatar ? (
                      <img
                        src={getAvatarUrl(user.avatar, user.full_name || 'User')}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'U')}&background=e11d48&color=fff`;
                        }}
                      />
                    ) : (
                      user.full_name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                </Link>

                <button 
                  onClick={handleLogout}
                  className="h-11 w-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-rose-600 liquid-glass-pill rounded-full transition-all ios-press"
                  title="Logout"
                  aria-label="Keluar Akun"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="ios-press inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 rounded-full border border-white/20"
              >
                <LogIn size={16} /> Masuk Akun
              </Link>
            )}
          </div>

          {/* MOBILE NAV DRAWER */}
          <MobileNav user={user} onLogout={handleLogout} />
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className={`flex-grow ${isChatRoute ? 'h-[calc(100vh-80px)] overflow-hidden' : 'min-h-[calc(100vh-80px)] pb-12 px-4 md:px-0'}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<WisataHome />} />
            <Route path="/wisata" element={<WisataHome />} />
            <Route path="/wisata/:id" element={<WisataDetail />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboard" element={<OnboardingPage />} />
            <Route path="/rekomendasi" element={<ChatPage />} />
            <Route path="/chat" element={<Navigate to="/rekomendasi" replace />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedAdminRoute>
                  <AdminPage />
                </ProtectedAdminRoute>
              } 
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* --- FOOTER DENGAN SITEMAP & INTERNAL LINKS --- */}
      {shouldShowFooter && <Footer />}
    </div>
  );
}

export default App;
