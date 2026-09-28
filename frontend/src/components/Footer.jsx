// frontend/src/components/Footer.jsx
// Distinctive minimal footer: accent line gradasi, 1 baris, pill links
// Hapus total blok teks panjang (4-kolom lama)
import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Sparkles, ArrowUpRight, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-300">
      {/* Top accent gradient line */}
      <div className="h-[3px] w-full bg-gradient-to-r from-rose-500 via-orange-400 to-emerald-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
              <Compass size={18} className="text-slate-900" />
            </div>
            <div>
              <p className="font-bold text-white tracking-tight leading-none">JemberTrip</p>
              <p className="text-xs text-slate-400 mt-0.5">Jelajahi Bumi Pandalungan dengan AI</p>
            </div>
          </div>

          {/* Pill Navigation Links */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              to="/"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white hover:text-slate-900 transition-all duration-200 font-medium"
            >
              Home
            </Link>
            <Link
              to="/rekomendasi"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white hover:text-slate-900 transition-all duration-200 font-medium inline-flex items-center gap-1.5"
            >
              <Sparkles size={13} className="text-orange-300" />
              Cak Jember AI
            </Link>
            <a
              href="https://github.com/iannnub/jembertrip"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white hover:text-slate-900 transition-all duration-200 font-medium inline-flex items-center gap-1"
            >
              GitHub <ArrowUpRight size={13} />
            </a>
          </div>

          {/* Copyright & Watermark */}
          <div className="text-xs text-slate-500 leading-relaxed">
            <p>
              © {new Date().getFullYear()} JemberTrip. Crafted with{' '}
              <Heart size={11} className="inline text-rose-400 fill-rose-400" />{' '}
              for Jember.
            </p>
            <p className="text-slate-600 mt-0.5">
              Pandalungan • Tembakau • Pantai Selatan
            </p>
            <p className="text-slate-600 mt-0.5">
              Dibuat oleh{' '}
              <span className="font-semibold text-slate-400">iannnub</span>
              {' '}• Universitas Muhammadiyah Jember
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
