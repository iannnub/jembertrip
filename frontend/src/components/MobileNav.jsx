// src/components/MobileNav.jsx
// Solid white drawer dari kiri: z-50 (drawer) + z-40 (backdrop) + body scroll lock
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import {
  Home, MessageSquare, LayoutDashboard, User,
  LogOut, LogIn, Menu, X, Compass
} from 'lucide-react';
import { getAvatarUrl } from '../utils/imageHelper';
import SocialLinks from './SocialLinks';

export default function MobileNav({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
    document.body.classList.remove('drawer-open');
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  };

  // Body scroll lock saat drawer terbuka & cleanup saat tutup / unmount
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('drawer-open');
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.classList.remove('drawer-open');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.classList.remove('drawer-open');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  // Global unmount cleanup
  useEffect(() => {
    return () => {
      document.body.classList.remove('drawer-open');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

  // Tutup drawer dengan tombol Escape (a11y & UX)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogout = () => {
    close();
    onLogout?.();
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
      isActive
        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
        : 'text-slate-700 hover:bg-rose-50 hover:text-rose-600'
    }`;

  const drawerContent = (
    <>
      {/* Backdrop: z-40, opaque */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer: z-50, SOLID white, slide dari kiri */}
      <div
        className={`fixed top-0 left-0 bottom-0 h-screen h-[100dvh] w-[82%] max-w-[340px] bg-white z-50 shadow-2xl shadow-slate-900/20 flex flex-col transform transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0 pointer-events-auto visible' : '-translate-x-full pointer-events-none invisible'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        style={{ touchAction: 'pan-y' }}
      >
        {/* Header: Solid */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-rose-200 shrink-0">
              <Compass size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-none tracking-tight">JemberTrip</p>
              <p className="text-[11px] tracking-[0.14em] text-emerald-600 font-bold mt-0.5">EXPLORE JATIM</p>
            </div>
          </div>
          <button
            onClick={close}
            className="w-10 h-10 grid place-items-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors touch-manipulation"
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="mx-4 mt-4 p-3.5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 flex items-center gap-3 shrink-0">
            <img
              src={getAvatarUrl(user.avatar || user.foto_profil, user.full_name || user.username || 'User')}
              alt={user.full_name || user.username}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
              onError={(e) => {
                e.currentTarget.onerror = null;
                const name = encodeURIComponent(user.full_name || user.username || 'U');
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${name}&background=f43f5e&color=fff&bold=true`;
              }}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-widest text-rose-500 uppercase">
                {user.role === 'admin' ? 'Administrator' : 'Wisatawan'}
              </p>
              <p className="font-semibold text-slate-900 truncate text-sm">
                {user.full_name || user.username}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <NavLink to="/" onClick={close} className={navLinkClass} end>
            <Home size={18} />
            <span>Beranda</span>
          </NavLink>

          <NavLink to="/rekomendasi" onClick={close} className={navLinkClass}>
            <MessageSquare size={18} />
            <span>AI Chat Cak Jember</span>
            <span className="ml-auto text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">AI</span>
          </NavLink>

          {user && (
            <NavLink to="/profile" onClick={close} className={navLinkClass}>
              <User size={18} />
              <span>Profil Saya</span>
            </NavLink>
          )}

          {user?.role === 'admin' && (
            <NavLink to="/admin" onClick={close} className={navLinkClass}>
              <LayoutDashboard size={18} />
              <span>Dashboard Admin</span>
              <span className="ml-auto text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">ADM</span>
            </NavLink>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-rose-100 text-rose-600 font-semibold text-sm hover:bg-rose-50 active:bg-rose-100 transition-colors min-h-[44px]"
            >
              <LogOut size={18} />
              Keluar Aplikasi
            </button>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={close}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-black transition-colors min-h-[44px]"
              >
                <LogIn size={18} />
                Masuk Akun
              </Link>
              <Link
                to="/register"
                onClick={close}
                className="w-full flex items-center justify-center py-2.5 rounded-xl text-slate-600 font-medium text-xs hover:bg-slate-50 transition-colors"
              >
                Belum punya akun? Daftar gratis
              </Link>
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col items-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Connect with @iannnub
            </div>
            <SocialLinks variant="compact" />
            <p className="text-center text-[10px] text-slate-400 mt-2.5">
              © {new Date().getFullYear()} JemberTrip • Crafted by{' '}
              <a href="https://github.com/iannnub" target="_blank" rel="noreferrer" className="font-semibold text-slate-600 hover:text-primary transition underline">
                iannnub
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 active:scale-95 transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Buka menu navigasi"
        aria-expanded={isOpen}
      >
        <Menu size={20} className="text-slate-700" />
      </button>

      {/* Render drawer via portal directly on document.body */}
      {typeof document !== 'undefined' && createPortal(drawerContent, document.body)}
    </>
  );
}

