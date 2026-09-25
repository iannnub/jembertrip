// src/components/MobileNav.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Sparkles, LayoutDashboard, User, LogOut, LogIn, MapPin } from 'lucide-react';
import NgrokImage from './NgrokImage';

export default function MobileNav({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(prev => !prev);
  const closeMenu = () => setIsOpen(false);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="md:hidden flex items-center">
      {/* Hamburger Toggle Button (Min 44x44px touch area) */}
      <button
        onClick={toggleMenu}
        className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-primary/15 text-text-main hover:text-primary hover:bg-primary/5 active:scale-95 transition-all shadow-sm focus:outline-none"
        aria-label={isOpen ? "Tutup menu" : "Buka menu navigasi"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={22} className="text-primary" /> : <Menu size={22} />}
      </button>

      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi mobile"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-page-bg/50">
          <div className="flex items-center gap-2.5 select-none">
            <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-xl text-white shadow-md shadow-primary/20">
              <MapPin size={20} fill="currentColor" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-main leading-none">JemberTrip</p>
              <p className="text-[10px] font-bold tracking-widest text-secondary uppercase mt-0.5">Explore Jatim</p>
            </div>
          </div>

          <button
            onClick={closeMenu}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-text-muted hover:text-text-main transition-colors"
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body - Navigation Links */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3 px-1">
              Navigasi Utama
            </p>
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                onClick={closeMenu}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium transition-all min-h-[48px] ${
                  isActive('/')
                    ? 'bg-primary text-white shadow-md shadow-primary/25 font-semibold'
                    : 'text-text-main hover:bg-primary/5 hover:text-primary active:bg-primary/10'
                }`}
              >
                <Home size={20} />
                <span>Beranda</span>
              </Link>

              <Link
                to="/rekomendasi"
                onClick={closeMenu}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium transition-all min-h-[48px] ${
                  isActive('/rekomendasi')
                    ? 'bg-primary text-white shadow-md shadow-primary/25 font-semibold'
                    : 'text-text-main hover:bg-primary/5 hover:text-primary active:bg-primary/10'
                }`}
              >
                <Sparkles size={20} />
                <span>Chat Cak Jember (AI)</span>
              </Link>

              {user && user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={closeMenu}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium transition-all min-h-[48px] ${
                    isActive('/admin')
                      ? 'bg-accent text-white shadow-md shadow-accent/25 font-semibold'
                      : 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200'
                  }`}
                >
                  <LayoutDashboard size={20} />
                  <span>Dashboard Admin</span>
                </Link>
              )}

              {user && (
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium transition-all min-h-[48px] ${
                    isActive('/profile')
                      ? 'bg-primary text-white shadow-md shadow-primary/25 font-semibold'
                      : 'text-text-main hover:bg-primary/5 hover:text-primary active:bg-primary/10'
                  }`}
                >
                  <User size={20} />
                  <span>Profil Saya</span>
                </Link>
              )}
            </nav>
          </div>
        </div>

        {/* Drawer Footer - User Section */}
        <div className="p-5 border-t border-gray-100 bg-page-bg/40 safe-area-bottom">
          {user ? (
            <div className="space-y-3">
              <Link
                to="/profile"
                onClick={closeMenu}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-primary/10 hover:border-primary/30 transition-all shadow-xs"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-soft flex items-center justify-center text-white font-bold text-sm shadow-xs overflow-hidden shrink-0">
                  {user.avatar ? (
                    <NgrokImage src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.full_name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {user.role === 'admin' ? 'Administrator' : 'Wisatawan'}
                  </p>
                  <p className="font-bold text-text-main text-sm truncate">{user.full_name}</p>
                </div>
              </Link>

              <button
                onClick={() => {
                  onLogout();
                  closeMenu();
                }}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 font-semibold text-sm transition-colors min-h-[44px]"
              >
                <LogOut size={18} />
                <span>Keluar Aplikasi</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={closeMenu}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary hover:bg-primary-soft text-white font-bold text-sm shadow-md shadow-primary/25 transition-all min-h-[48px]"
              >
                <LogIn size={18} />
                <span>Masuk Akun</span>
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="w-full flex items-center justify-center py-2.5 rounded-xl text-primary font-semibold text-xs hover:bg-primary/5 transition-all min-h-[40px]"
              >
                Belum punya akun? Daftar
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
