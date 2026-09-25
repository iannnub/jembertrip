// frontend/src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Sparkles, Compass, Shield, FileText, ExternalLink } from 'lucide-react';

export default function Footer() {
  const categories = [
    { name: 'Pantai', query: 'Pantai' },
    { name: 'Air Terjun', query: 'Air Terjun' },
    { name: 'Rekreasi', query: 'Rekreasi' },
    { name: 'Agrowisata', query: 'Agrowisata' },
    { name: 'Edukasi', query: 'Edukasi' },
    { name: 'Religi', query: 'Religi' },
    { name: 'Panorama', query: 'Panorama' },
  ];

  return (
    <footer className="bg-white border-t border-primary/10 pt-12 pb-8 mt-auto text-text-muted">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          
          {/* Kolom 1: About */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-xl text-white shadow-sm">
                <MapPin size={18} fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-text-main tracking-tight">
                JemberTrip
              </span>
            </div>
            <p className="text-xs md:text-sm text-text-muted leading-relaxed mb-4">
              Platform eksplorasi pariwisata cerdas Kabupaten Jember berbasis AI. Menghadirkan asisten Cak Jember dan sistem rekomendasi personalisasi.
            </p>
            <div className="flex items-center gap-2 text-xs text-primary font-semibold">
              <Sparkles size={14} /> Didukung AI RAG & Hybrid Filtering
            </div>
          </div>

          {/* Kolom 2: Jelajahi Destinasi */}
          <div>
            <h4 className="text-sm font-bold text-text-main uppercase tracking-wider mb-3">
              Jelajahi Wisata
            </h4>
            <ul className="space-y-2 text-xs md:text-sm">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <Link 
                    to={`/?kategori=${encodeURIComponent(cat.query)}`} 
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                    Wisata {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 3: Fitur Utama */}
          <div>
            <h4 className="text-sm font-bold text-text-main uppercase tracking-wider mb-3">
              Fitur Platform
            </h4>
            <ul className="space-y-2 text-xs md:text-sm">
              <li>
                <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Compass size={14} className="text-primary/70" /> Eksplorasi Destinasi
                </Link>
              </li>
              <li>
                <Link to="/rekomendasi" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Sparkles size={14} className="text-accent" /> Chatbot AI Cak Jember
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  Masuk Akun Wisatawan
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  Daftar Akun Baru
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider & Watermark Lisensi iannnub */}
        <div className="border-t border-primary/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="text-xs text-text-muted">
              Semua Karna ❤️ untuk <span className="text-primary font-bold">Masyarakat & Wisatawan Jember</span>
            </p>
            <p className="text-[11px] text-text-muted/70 mt-1">
              Didesain, dikembangkan & dilisensikan oleh <span className="font-semibold text-text-main">iannnub</span> • Universitas Muhammadiyah Jember
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              <Sparkles size={12} /> Karya Asli iannnub
            </span>
            <span className="text-xs text-text-muted">
              &copy; {new Date().getFullYear()} JemberTrip
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
