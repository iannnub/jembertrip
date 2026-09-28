// src/pages/WisataHome.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { getImageUrl } from '../utils/imageHelper';
import ProgressiveImage from '../components/ProgressiveImage';
import WisataCard from '../components/WisataCard';
// Import Icon
import { Search, MapPin, Star, Compass, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
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

  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('kategori') || "Semua";
  const initialSearch = searchParams.get('search') || "";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  
  const [personalRek, setPersonalRek] = useState([]);
  const [hybridRek, setHybridRek] = useState([]);
  const [user, setUser] = useState(null);

  // Ref untuk target scroll
  const resultsRef = useRef(null);

  // Kategori sesuai CSV Data
  const categories = ["Semua", "Pantai", "Rekreasi", "Agrowisata", "Edukasi", "Religi", "Rural Tourism", "Air Terjun", "Situs", "Panorama"];

  // Sinkronisasi kategori/search jika URL params berubah
  useEffect(() => {
    const cat = searchParams.get('kategori');
    if (cat && cat !== selectedCategory) {
      setSelectedCategory(cat);
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [searchParams, selectedCategory]);

  // Schema Markup untuk WebSite & Organization (Google Rich Results)
  const schemaWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "JemberTrip",
    "url": "https://jembertrip.id",
    "description": "Platform eksplorasi destinasi wisata, kuliner, dan budaya Jember berbasis AI.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://jembertrip.id/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const schemaOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "JemberTrip",
    "url": "https://jembertrip.id",
    "logo": "https://jembertrip.vercel.app/banner-jembertrip.jpg",
    "sameAs": [
      "https://facebook.com/jembertrip",
      "https://instagram.com/jembertrip"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "info@jembertrip.id"
    }
  };

  // getImageUrl sekarang dari utils/imageHelper.js (terpusat)


  useEffect(() => {
    document.title = "Beranda - JemberTrip";
  }, []);
  
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

        // Helper: handle 401 = token expired, bersihkan session
        const handleAuthError = (err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        };

        axios.get(`${API_BASE_URL}/api/v1/recommendations/personal`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
          if (res.data.status === "success") setPersonalRek(res.data.data);
        })
        .catch((err) => {
            handleAuthError(err);
        });

        axios.get(`${API_BASE_URL}/api/v1/recommendations/hybrid`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
          if (res.data.status === "success") setHybridRek(res.data.data);
        })
        .catch((err) => {
            handleAuthError(err);
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


  // --- 4. HANDLER KHUSUS SCROLL & ANALYTICS ---
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchTerm.trim()) {
        trackEvent('search_wisata', { search_term: searchTerm.trim(), result_count: displayedWisata.length });
      }
      if (resultsRef.current) {
        setTimeout(() => {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    trackEvent('select_category', { category_name: cat });
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      <SEO 
        title="JemberTrip - Panduan Wisata Cerdas Kabupaten Jember"
        description="Eksplorasi destinasi wisata pantai, alam, air terjun, rekreasi, dan kuliner Jember dengan asisten cerdas AI Cak Jember dan rekomendasi personalisasi."
        url="https://jembertrip.id"
        image="https://jembertrip.vercel.app/banner-jembertrip.jpg"
        schema={[schemaWebSite, schemaOrganization]}
      />
      
      {/* === HERO SECTION === */}
      {/* Update: Hapus bg-slate-900, ganti jadi bg-gray-900 agar netral dengan pink */}
      <div className="relative bg-gray-900 pt-24 pb-24 md:pt-32 md:pb-32 overflow-hidden">
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
              
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
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

      {/* === SEARCH & FILTER GLASS (TASK 2) === */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 -mt-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white/95 backdrop-blur-md border border-white/30 shadow-2xl rounded-[1.5rem] p-2"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 px-4">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Cari pantai, gunung, atau cafe... (Tekan Enter)"
                className="flex-1 bg-transparent border-0 text-slate-700 placeholder:text-slate-500 focus:outline-0 text-sm py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button 
              onClick={() => {
                if (resultsRef.current) {
                  resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="bg-gradient-to-r from-rose-500 to-orange-400 text-white px-6 py-3 rounded-full font-semibold text-sm hover:shadow-lg transition shrink-0"
            >
              Cari
            </button>
          </div>
        </motion.div>
        
        {/* Integrated Category Pills */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {categories.map((k) => (
            <button
              key={k}
              onClick={() => handleCategoryClick(k)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition ${
                selectedCategory === k
                  ? "bg-rose-500 text-white shadow-sm"
                  : "bg-white/90 backdrop-blur-sm text-slate-700 border border-white/40 hover:bg-white"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
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
                <h3 className="text-2xl font-bold text-text-main">Rekomendasi Spesial Untuk Anda</h3>
                <p className="text-sm text-text-muted">Rekomendasi kolaboratif (CF) khusus untuk {user.full_name.split(' ')[0]}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {personalRek.map((wisata, index) => (
                <Link 
                  to={`/wisata/${wisata.id}`} 
                  key={`cf-${index}`} 
                  onClick={() => trackEvent('click_recommendation', { source: 'cf', wisata_id: wisata.id, wisata_name: wisata.nama_wisata })}
                  className="group block h-full"
                >
                  <div className="bg-gradient-to-br from-white to-page-bg rounded-2xl p-4 border border-primary/10 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/10 h-full flex items-start gap-4">
                    <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm shrink-0">
                      <ProgressiveImage
                        src={getImageUrl(wisata.gambar)}
                        alt={wisata.nama_wisata}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        fallback="/placeholder-wisata.svg"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main line-clamp-2 mb-1 group-hover:text-primary transition-colors">{wisata.nama_wisata}</h4>
                      <p className="text-xs text-text-muted line-clamp-2 mb-3">{wisata.alamat}</p>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-400 px-2.5 py-1 rounded-md shadow-sm">
                        <Star size={10} fill="currentColor" /> Cocok Untukmu
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* 1.B. PERSONALISASI (HYBRID) */}
        {hybridRek.length > 0 && user && (
          <motion.section 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
                <Compass size={20} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text-main">Mungkin Anda Sukai</h3>
                <p className="text-sm text-text-muted">Hasil racikan cerdas Hybrid (CF + CBF) untuk {user.full_name?.split(' ')[0]}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {hybridRek.map((wisata, index) => (
                <Link 
                  to={`/wisata/${wisata.id}`} 
                  key={`hf-${index}`} 
                  onClick={() => trackEvent('click_recommendation', { source: 'hybrid', wisata_id: wisata.id, wisata_name: wisata.nama_wisata })}
                  className="group block h-full"
                >
                  <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl p-4 border border-pink-200 hover:border-pink-400 transition-all hover:shadow-xl hover:shadow-pink-200 h-full flex items-start gap-4">
                    <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm shrink-0">
                      <ProgressiveImage
                        src={getImageUrl(wisata.gambar)}
                        alt={wisata.nama_wisata}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        fallback="/placeholder-wisata.svg"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main line-clamp-2 mb-1 group-hover:text-pink-600 transition-colors">{wisata.nama_wisata}</h4>
                      <p className="text-xs text-text-muted line-clamp-2 mb-3">{wisata.alamat}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-accent to-pink-500 px-2 py-1 rounded-md shadow-sm">
                        <Star size={10} fill="currentColor" /> Hybrid Filtering
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
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
                    <WisataCard wisata={wisata} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* CAK JEMBER: Editorial Card (bukan gradient block) */}
        <section className="mt-12">
          <div className="relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 shadow-sm">
            {/* soft wash */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-orange-50/60" />
            <div className="absolute -right-24 -top-24 w-96 h-96 bg-gradient-to-br from-rose-500/10 to-orange-400/10 rounded-full blur-3xl" />
            <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"radial-gradient(circle at 1px 1px, #0F172A 1px, transparent 0)", backgroundSize:"20px 20px"}} />

            <div className="relative grid md:grid-cols-[1.15fr_0.85fr] gap-8 p-7 md:p-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] tracking-widest font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> ASISTEN CERDAS CAK JEMBER
                </div>
                <h2 className="mt-4 text-[1.7rem] md:text-[2rem] font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                  Bingung mau liburan<br/>ke mana di Jember?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 max-w-[48ch]">
                  Tanya langsung ke Cak Jember. Asisten AI berdialek Pandalungan yang siap bantu rekomendasikan pantai tersembunyi sampai kuliner legendaris sesuai seleramu.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link 
                    to="/rekomendasi" 
                    onClick={() => trackEvent('click_cta_cak_jember', { location: 'home_bottom_banner' })}
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-black transition shadow-sm hover:shadow-md"
                  >
                    Mulai Ngobrol dengan Cak Jember <span aria-hidden>→</span>
                  </Link>
                  <span className="inline-flex items-center text-xs text-slate-500 self-center">Gratis • Dialek Pandalungan • RAG</span>
                </div>
              </div>

              {/* mockup chat */}
              <div className="relative">
                <div className="bg-slate-900 rounded-[1.25rem] p-4 shadow-xl border border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-orange-400 grid place-items-center text-white text-xs font-bold">CJ</div>
                    <div className="text-xs">
                      <div className="font-semibold text-white leading-none">Cak Jember</div>
                      <div className="text-emerald-400 text-[11px]">● Online</div>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full bg-white/20" />
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white text-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed">Rekomendasi pantai sepi sing cocok gawe healing, Cak?</div>
                    <div className="bg-gradient-to-br from-rose-500 to-orange-400 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed ml-6">Wes, coba nang Pantai Papuma pas sunrise, Lur! Sepi, ombake apik, cocok gawe ngopi santai.</div>
                    <div className="flex gap-1.5 ml-6">
                      <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/80">Papuma</span>
                      <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/80">Watu Ulo</span>
                      <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/80">Kuliner</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default WisataHome;
