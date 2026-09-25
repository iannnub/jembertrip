// src/App.jsx

import NgrokImage from './components/NgrokImage';
import MobileNav from './components/MobileNav';
import Footer from './components/Footer';
import React, { useState, useEffect } from 'react';
// Import Routing
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
// Import Library UI
import { Toaster, toast } from 'react-hot-toast'; 
// Import Icon Modern
import { MapPin, LogOut, LogIn, Home, Sparkles, LayoutDashboard } from 'lucide-react'; 

// Import Halaman
import AdminPage from './pages/AdminPage';
import WisataHome from './pages/WisataHome';
import WisataDetail from './pages/WisataDetail';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage'; 
import OnboardingPage from './pages/OnboardingPage';

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
  
  const navigate = useNavigate();
  const location = useLocation();

  const noFooterPaths = ['/rekomendasi', '/login', '/register', '/onboard'];
  const shouldShowFooter = !noFooterPaths.includes(location.pathname);

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
    <div className="flex flex-col min-h-screen bg-page-bg font-sans text-text-main selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      
      {/* --- TOASTER --- */}
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          style: { borderRadius: '12px', background: '#333', color: '#fff', fontSize: '14px' },
          success: { style: { background: '#10B981', color: 'white' } },
          error: { style: { background: '#EC4899', color: 'white' } },
        }}
      />

      {/* --- NAVBAR MODERN STICKY --- */}
      <header className="sticky top-0 left-0 w-full z-40 bg-page-bg/90 backdrop-blur-md border-b border-primary/10 shadow-xs transition-all duration-300">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          
          {/* LOGO */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 group select-none min-h-[44px]"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary blur-xs opacity-20 rounded-xl group-hover:opacity-40 transition-opacity"></div>
              {/* Gradien Logo: Primary -> Accent */}
              <div className="relative bg-gradient-to-br from-primary to-accent p-2 rounded-xl text-white shadow-md shadow-primary/20 transform group-hover:scale-105 transition-transform duration-300">
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

          {/* MENU DESKTOP */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center bg-white/60 border border-primary/10 p-1.5 rounded-full backdrop-blur-md shadow-xs mr-4">
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
                <Link to="/profile" className="flex items-center gap-3 bg-white/50 border border-primary/10 pl-4 pr-1.5 py-1.5 rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer group">
                  <div className="text-right">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'text-accent' : 'text-text-muted'}`}>
                        {user.role === 'admin' ? 'Administrator' : 'User'}
                    </p>
                    <p className="text-sm font-bold text-text-main leading-none truncate max-w-[100px] group-hover:text-primary transition-colors">
                      {user.full_name?.split(' ')[0]}
                    </p>
                  </div>
                  
                  {/* Avatar: Pink Gradient */}
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xs overflow-hidden ${user.role === 'admin' ? 'bg-gradient-to-tr from-accent to-orange-400 shadow-orange-200' : 'bg-gradient-to-tr from-primary to-primary-soft shadow-pink-200'}`}>
                    {user.avatar ? (
                        <NgrokImage src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        user.full_name?.charAt(0)?.toUpperCase() || 'U'
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

          {/* MOBILE NAV DRAWER */}
          <MobileNav user={user} onLogout={handleLogout} />
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className={`flex-grow ${!shouldShowFooter ? 'h-[calc(100vh-80px)] overflow-hidden' : 'pb-12 px-4 md:px-0'}`}>
        <Routes>
          <Route path="/" element={<WisataHome />} />
          <Route path="/wisata/:id" element={<WisataDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboard" element={<OnboardingPage />} />
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
          {/* Fallback Route 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* --- FOOTER DENGAN SITEMAP & INTERNAL LINKS --- */}
      {shouldShowFooter && <Footer />}

    </div>
  );
}

export default App;