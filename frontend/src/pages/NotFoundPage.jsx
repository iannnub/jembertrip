// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Compass, MapPin } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="404 - Halaman Tidak Ditemukan | JemberTrip"
        description="Oops! Halaman yang kamu cari tidak ditemukan. Kembali ke JemberTrip dan jelajahi destinasi wisata Jember lainnya."
      />
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-page-bg px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto"
        >
          {/* Ilustrasi 404 */}
          <div className="relative mb-8 inline-block">
            <div className="w-40 h-40 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-primary/20">
              <MapPin size={64} className="text-primary/40" />
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20 text-white font-bold text-sm"
            >
              404
            </motion.div>
          </div>

          {/* Text */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main mb-3 leading-tight">
            Ups, Tersesat?
          </h1>
          <p className="text-text-muted text-base mb-2 leading-relaxed">
            Halaman yang kamu cari tidak ditemukan atau mungkin sudah dipindahkan.
          </p>
          <p className="text-text-muted text-sm mb-8">
            Jangan khawatir, Cak Jember siap memandu kamu kembali! 🗺️
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-primary to-primary-soft text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all min-h-[48px] text-sm"
            >
              <Home size={18} />
              Kembali ke Beranda
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-text-main font-semibold rounded-2xl border border-gray-200 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all min-h-[48px] text-sm shadow-xs"
            >
              <ArrowLeft size={18} />
              Halaman Sebelumnya
            </button>
          </div>

          {/* Explore Suggestion */}
          <div className="mt-10 pt-8 border-t border-gray-100">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center justify-center gap-2">
              <Compass size={14} className="text-accent" /> Mungkin kamu mencari
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Pantai Papuma', 'Kawah Ijen', 'Taman Botani', 'Chat AI Cak Jember'].map((item, idx) => (
                <Link
                  key={idx}
                  to={idx < 3 ? `/?search=${encodeURIComponent(item)}` : '/rekomendasi'}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-text-muted hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all shadow-xs"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
