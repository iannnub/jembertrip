// src/pages/WisataHome.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
// Import Icon
import { Search, MapPin, Star, Compass, Sparkles } from 'lucide-react';
// Import Animasi
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Konfigurasi URL API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const API_DESTINASI_URL = `${API_BASE_URL}/api/v1/list-wisata?limit=100&offset=0`;

function WisataHome() {
  // --- STATE ---
  const [masterWisataList, setMasterWisataList] = useState([]);
  const [displayedWisata, setDisplayedWisata] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  
  const [personalRek, setPersonalRek] = useState([]);
  const [user, setUser] = useState(null);

  // Ref untuk target scroll
  const resultsRef = useRef(null);

  // Kategori sesuai CSV Data
  const categories = ["Semua", "Pantai", "Rekreasi", "Agrowisata", "Edukasi", "Religi", "Rural Tourism", "Air Terjun", "Situs", "Panorama"];

  // --- HELPER GAMBAR SAKTI (Hybrid Logic) ---
  const getImageUrl = (gambarPath) => {
      if (!gambarPath) return "https://placehold.co/600x400?text=No+Image";
      if (gambarPath.startsWith('http')) {
          return gambarPath; 
      }
      const cleanPath = gambarPath.startsWith('/') ? gambarPath.slice(1) : gambarPath;
      return `/${cleanPath}`; 
  };

  // --- 1. FETCH DATA UTAMA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_DESTINASI_URL);
        const dataBersih = response.data.data;
        setMasterWisataList(dataBersih);
        setDisplayedWisata(dataBersih);
      } catch (err) {
        console.error("Error API:", err);
        setError("Gagal memuat data wisata. Cek koneksi backend!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. FETCH PERSONALISASI (AI) ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        axios.get(`${API_BASE_URL}/api/v1/recommendations/personal`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
          if (res.data.status === "success") setPersonalRek(res.data.data);
        })
        .catch((err) => {
            console.log("Info Rekomendasi:", err.message);
        });
      } catch (e) {
          console.error("User data error", e);
      }
    }
  }, []);

  // --- 3. LOGIKA FILTERING (REAL-TIME) ---
  useEffect(() => {
    let result = masterWisataList;
    
    // Filter Kategori
    if (selectedCategory !== "Semua") {
      result = result.filter(item => 
        item.kategori && item.kategori.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Filter Search
    if (searchTerm) {
      result = result.filter(item => 
        item.nama_wisata.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setDisplayedWisata(result);
  }, [searchTerm, selectedCategory, masterWisataList]);


  // --- 4. HANDLER KHUSUS SCROLL ---
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    if (resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setSelectedCategory("Semua");
    setDisplayedWisata(masterWisataList);
  };

  // --- RENDER LOADING ---
  if (loading) return (
    <div className="container mx-auto px-4 pt-32 pb-12 min-h-screen bg-page-bg">
      <div className="animate-pulse space-y-8">
        <div className="h-64 bg-gray-200 rounded-3xl w-full"></div>
        <div className="flex gap-4">
          <div className="h-12 bg-gray-200 rounded-full w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded-full w-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-80 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- RENDER ERROR ---
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 bg-page-bg">
      <div className="bg-white p-8 rounded-3xl border border-red-100 max-w-md shadow-xl">
        <div className="w-16 h-16 bg-red-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles size={32} className="rotate-180" />
        </div>
        <h3 className="text-xl font-bold text-text-main mb-2">Oops, ada gangguan!</h3>
        <p className="text-text-muted mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-primary-soft transition-all">
          Coba Refresh
        </button>
      </div>
    </div>
  );

  return (
    // Update: Gunakan page-bg dan text-main
    <div className="min-h-screen pb-20 bg-page-bg text-text-main">
      
      {/* === HERO SECTION === */}
      {/* Update: Hapus bg-slate-900, ganti jadi bg-gray-900 agar netral dengan pink */}
      <div className="relative bg-gray-900 pt-32 pb-32 overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
             <img 
               src="/assets/home.png"
               alt="Background" 
               className="w-full h-full object-cover opacity-50"
             />
             {/* Gradient Overlay: Hitam transparan agar teks pop-up */}
             <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div 
              layout
              whileHover={{ y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {/* Badge: Putih Transparan */}
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest mb-6">
                <Compass size={14} /> Explore Jatim
              </span>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                Temukan Pesona <br/>
                {/* Gradient Text: Accent (Gold) ke Primary (Pink) */}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">
                  Bumi Pandalungan
                </span>
              </h1>
              <p className="text-gray-200 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-light">
                Jelajahi keindahan alam, budaya, edukasi dan rekreasi Jember dengan panduan cerdas berbasis AI.
              </p>
            </motion.div>
        </div>
      </div>  

      {/* === SEARCH & FILTER === */}
      <div className="container mx-auto px-4 -mt-16 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-primary/5 p-6 border border-white/50"
        >
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            
            {/* Input Search */}
            <div className="relative w-full lg:flex-1 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Cari pantai, gunung, atau cafe... (Tekan Enter)" 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-page-bg border border-gray-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-gray-400 text-text-main font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown} 
              />
            </div>

            {/* Filter Categories */}
            <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${
                      selectedCategory === cat 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 transform scale-105" 
                      : "bg-white text-text-muted border-gray-200 hover:border-primary/50 hover:text-primary hover:bg-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* === CONTENT SECTION === */}
      <div ref={resultsRef} className="container mx-auto px-4 mt-16 space-y-16 scroll-mt-32 transition-all duration-500">

        {/* 1. PERSONALISASI (AI) */}
        {personalRek.length > 0 && user && (
          <motion.section 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text-main">Rekomendasi Spesial</h3>
                <p className="text-sm text-text-muted">Dipilihkan AI khusus untuk {user.full_name.split(' ')[0]}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {personalRek.map((wisata, index) => (
                <Link to={`/wisata/${wisata.id}`} key={`rek-${index}`} className="group block h-full">
                  {/* Card AI: Hapus Indigo, ganti jadi Page BG / Pink Soft */}
                  <div className="bg-gradient-to-br from-white to-page-bg rounded-2xl p-4 border border-primary/10 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/10 h-full flex items-start gap-4">
                    <img 
                      src={getImageUrl(wisata.gambar)} 
                      alt={wisata.nama_wisata}
                      className="w-24 h-24 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-500"
                    />
                    <div>
                      <h4 className="font-bold text-text-main line-clamp-2 mb-1 group-hover:text-primary transition-colors">{wisata.nama_wisata}</h4>
                      <p className="text-xs text-text-muted line-clamp-2 mb-3">{wisata.alamat}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-primary to-accent px-2 py-1 rounded-md shadow-sm">
                        <Star size={10} fill="currentColor" /> mungkin yang anda suka
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* 2. ALL WISATA LIST */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-text-main">Destinasi Populer</h2>
              <p className="text-text-muted mt-1">Jelajahi tempat hits di Jember</p>
            </div>
            <div className="text-sm font-medium text-text-muted bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm">
              Total: <span className="text-primary font-bold">{displayedWisata.length}</span>
            </div>
          </div>

          {displayedWisata.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="text-4xl mb-4">🤔</div>
              <h3 className="text-lg font-bold text-text-main">Tidak ditemukan</h3>
              <p className="text-text-muted text-sm mb-4">Coba cari dengan kata kunci lain.</p>
              <button 
                onClick={handleReset}
                className="text-primary font-semibold text-sm hover:underline"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              <AnimatePresence>
                {displayedWisata.map((wisata, index) => (
                  <motion.div
                    layout
                    key={wisata.id || index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link to={`/wisata/${wisata.id}`} className="block h-full bg-card-bg rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-primary/10 border border-gray-100 overflow-hidden transition-all duration-300 group">
                      {/* Image Container */}
                      <div className="relative h-56 overflow-hidden">
                        <img 
                          src={getImageUrl(wisata.gambar)}
                          alt={wisata.nama_wisata} 
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "https://placehold.co/600x400?text=No+Image";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                        <div className="absolute top-4 left-4">
                          <span className="bg-white/90 backdrop-blur-md text-text-main text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm tracking-wide uppercase">
                            {wisata.kategori || "Umum"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-5 flex flex-col h-[calc(100%-14rem)]">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-text-main leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {wisata.nama_wisata}
                          </h3>
                        </div>

                        <div className="flex items-start gap-2 text-sm text-text-muted mb-4">
                          <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="line-clamp-2 text-xs leading-relaxed">{wisata.alamat}</p>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-accent fill-accent" />
                            <span className="text-xs font-bold text-text-main">4.8</span>
                            <span className="text-[10px] text-text-muted">(Review)</span>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-page-bg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors border border-primary/10">
                            <Sparkles size={14} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

      </div>
    </div>
  );
}

export default WisataHome;