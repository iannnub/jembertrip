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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Kolom 1: About */}
          <div className="md:col-span-1">
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

          {/* Kolom 4: Informasi & Legal */}
          <div>
            <h4 className="text-sm font-bold text-text-main uppercase tracking-wider mb-3">
              Informasi & SEO
            </h4>
            <ul className="space-y-2 text-xs md:text-sm">
              <li>
                <a 
                  href="/privacy-policy.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Shield size={14} className="text-gray-400" /> Kebijakan Privasi
                </a>
              </li>
              <li>
                <a 
                  href="http://127.0.0.1:8000/sitemap.xml" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <FileText size={14} className="text-gray-400" /> Peta Situs (Sitemap XML) <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a 
                  href="http://127.0.0.1:8000/robots.txt" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <FileText size={14} className="text-gray-400" /> Robots.txt <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-primary/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <p className="text-xs text-text-muted">
            Semua Karna ❤️ untuk <span className="text-primary font-bold">Masyarakat & Wisatawan Jember</span>
          </p>
          <p className="text-xs text-text-muted/70">
            iannnub &copy; {new Date().getFullYear()} JemberTrip - Universitas Muhammadiyah Jember
          </p>
        </div>
      </div>
    </footer>
  );
}
