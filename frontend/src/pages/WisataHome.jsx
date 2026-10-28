// src/pages/WisataHome.jsx

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { getImageUrl } from '../utils/imageHelper';
import ProgressiveImage from '../components/ProgressiveImage';
import WisataCard from '../components/WisataCard';
// Import Icon
import { Search, Star, Compass, Sparkles } from 'lucide-react';
// Import Animasi
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Konfigurasi URL API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const API_DESTINASI_URL = `${API_BASE_URL}/api/v1/list-wisata?limit=100&offset=0`;

// Skeleton Card untuk feedback transisi filter kategori
const WisataCardSkeleton = () => (
  <div className="liquid-card rounded-3xl overflow-hidden animate-pulse flex flex-col h-full min-h-[340px]">
    <div className="aspect-[4/3] bg-slate-200 rounded-t-3xl w-full" />
    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
      <div className="h-6 bg-slate-100 rounded-lg w-1/3" />
    </div>
  </div>
);

function WisataHome() {
  // --- STATE ---
  const [masterWisataList, setMasterWisataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const filterTimeoutRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const selectedCategory = searchParams.get('kategori') || "Semua";
  
  const [personalRek, setPersonalRek] = useState([]);
  const [hybridRek, setHybridRek] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  });

  // Ref untuk target scroll
  const resultsRef = useRef(null);

  // Kategori sesuai CSV Data
  const categories = ["Semua", "Pantai", "Rekreasi", "Agrowisata", "Edukasi", "Religi", "Rural Tourism", "Air Terjun", "Situs", "Panorama"];

  // Scroll ke hasil jika kategori ada di URL params
  useEffect(() => {
    const cat = searchParams.get('kategori');
    if (cat && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams]);

  // Schema Markup untuk WebSite & Organization (Google Rich Results)
  const schemaWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "JemberTrip",
    "url": "https://jembertrip.vercel.app/",
    "description": "Platform eksplorasi destinasi wisata, kuliner, dan budaya Jember berbasis AI.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://jembertrip.vercel.app/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const schemaOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "JemberTrip",
    "url": "https://jembertrip.vercel.app/",
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

  useEffect(() => {
    document.title = "Beranda - JemberTrip";
  }, []);
  
  // --- 1. FETCH DATA UTAMA (WITH OFFLINE STATIC FALLBACK) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_DESTINASI_URL, { timeout: 6000 });
        const dataBersih = response.data.data;
        setMasterWisataList(dataBersih);
      } catch {
        try {
          const fallbackRes = await axios.get('/data/wisata-fallback.json');
          if (Array.isArray(fallbackRes.data)) {
            setMasterWisataList(fallbackRes.data);
          } else {
            setError("Gagal memuat data wisata. Cek koneksi backend!");
          }
        } catch {
          setError("Gagal memuat data wisata. Cek koneksi backend!");
        }
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
        const handleAuthError = (err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        };

        axios.get(`${API_BASE_URL}/api/v1/recommendations/personal`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 6000
        })
        .then(res => {
          if (res.data.status === "success") setPersonalRek(res.data.data.slice(0, 6));
        })
        .catch(async (err) => {
          handleAuthError(err);
          if (err.response?.status !== 401) {
            try {
              const fb = await axios.get('/data/wisata-fallback.json');
              if (Array.isArray(fb.data)) setPersonalRek(fb.data.slice(0, 6));
            } catch {
              // ignore fallback error
            }
          }
        });

        axios.get(`${API_BASE_URL}/api/v1/recommendations/hybrid`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 6000
        })
        .then(res => {
          if (res.data.status === "success") setHybridRek(res.data.data.slice(0, 6));
        })
        .catch(async (err) => {
          handleAuthError(err);
          if (err.response?.status !== 401) {
            try {
              const fb = await axios.get('/data/wisata-fallback.json');
              if (Array.isArray(fb.data)) setHybridRek(fb.data.slice(6, 12));
            } catch {
              // ignore fallback error
            }
          }
        });
      } catch (e) {
        console.error("User data error", e);
      }
    }
  }, []);

  // --- 3. LOGIKA FILTERING (MEMOIZED & INSTANT) ---
  const displayedWisata = useMemo(() => {
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
        item.nama_wisata && item.nama_wisata.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return result;
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

  const handleCategoryClick = useCallback((cat) => {
    if (isFiltering) return;
    
    setIsFiltering(true);
    trackEvent('select_category', { category_name: cat });
    
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cat === "Semua") {
        next.delete('kategori');
      } else {
        next.set('kategori', cat);
      }
      return next;
    }, { replace: true });

    if (resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(() => {
      setIsFiltering(false);
    }, 220);
  }, [isFiltering, setSearchParams]);

  const handleReset = () => {
    setSearchTerm("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('kategori');
      return next;
    }, { replace: true });
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
            <div key={i} className="h-80 bg-gray-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- RENDER ERROR ---
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 bg-page-bg">
      <div className="liquid-card p-8 rounded-3xl max-w-md">
        <div className="w-16 h-16 bg-red-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles size={32} className="rotate-180" />
        </div>
        <h3 className="text-xl font-bold text-text-main mb-2">Oops, ada gangguan!</h3>
        <p className="text-text-muted mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="ios-press px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-primary-soft transition-all min-h-[44px]">
          Coba Refresh
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 bg-page-bg text-text-main">
      <SEO 
        title="JemberTrip - Panduan Wisata Cerdas Kabupaten Jember"
        description="Eksplorasi destinasi wisata pantai, alam, air terjun, rekreasi, dan kuliner Jember dengan asisten cerdas AI Cak Jember dan rekomendasi personalisasi."
        url="https://jembertrip.vercel.app/"
        image="https://jembertrip.vercel.app/banner-jembertrip.jpg"
        schema={[schemaWebSite, schemaOrganization]}
      />
      
      {/* Hero section */}
      <div className="relative bg-slate-900 pt-24 pb-28 md:pt-32 md:pb-36 overflow-hidden rounded-b-[2.5rem] shadow-lg">
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/home.png"
            alt="Panorama Destinasi Wisata Jember" 
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-slate-950/60"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="h-full"
          >
            <span className="liquid-glass-dark inline-flex items-center gap-2 py-2 px-4 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-6">
              <Compass size={14} className="text-rose-400" /> Explore Jatim • {masterWisataList.length || 56} Destinasi
            </span>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Temukan Pesona <br/>
              <span className="text-rose-400">
                Bumi Pandalungan
              </span>
            </h1>
            <p className="text-slate-200 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-normal">
              Cari {masterWisataList.length || 56} destinasi wisata dan rekomendasi rute di Jember bersama asisten Cak Jember.
            </p>
          </motion.div>
        </div>
      </div>  

      {/* Search and category filter */}
      <div className="relative z-20 max-w-3xl mx-4 md:mx-auto -mt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 30, delay: 0.1 }}
          className="liquid-glass rounded-full p-2 md:p-2.5"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex-1 flex items-center gap-2.5 md:gap-3 px-4 md:px-6 min-w-0">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-500 shrink-0" />
              <input
                type="text"
                aria-label="Cari destinasi wisata di Jember"
                placeholder="Cari pantai, gunung, atau tempat wisata..."
                className="w-full min-w-0 bg-transparent border-0 text-slate-900 placeholder:text-slate-500 focus:outline-none text-sm md:text-base py-2 truncate font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button 
              onClick={() => {
                if (searchTerm.trim()) {
                  trackEvent('search_wisata', { search_term: searchTerm.trim(), result_count: displayedWisata.length });
                }
                if (resultsRef.current) {
                  resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="ios-press shrink-0 bg-rose-600 hover:bg-rose-700 text-white px-5 sm:px-7 md:px-8 py-3 md:py-3.5 min-h-[44px] rounded-full font-bold text-xs sm:text-sm md:text-base shadow-md shadow-rose-600/25 flex items-center justify-center gap-2"
              aria-label="Cari Destinasi"
            >
              <Search className="w-4 h-4 text-white shrink-0" />
              <span className="hidden sm:inline">Cari</span>
            </button>
          </div>
        </motion.div>
        
        {/* iOS Morphing Category Pills */}
        <div
          role="tablist"
          aria-label="Filter Kategori Wisata"
          className="mt-4 flex flex-wrap gap-2 justify-center"
        >
          {categories.map((k) => {
            const isSelected = selectedCategory === k;
            return (
              <button
                key={k}
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleCategoryClick(k)}
                disabled={isFiltering}
                className={`category-pill relative px-4 py-2 min-h-[44px] rounded-full text-xs font-bold transition-colors ${
                  isFiltering ? "opacity-75 cursor-wait" : ""
                } ${
                  isSelected
                    ? "text-white"
                    : "liquid-glass-pill text-slate-700 hover:text-slate-900"
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="category-liquid-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
                    className="absolute inset-0 bg-rose-600 rounded-full shadow-md shadow-rose-600/25"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">{k}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* === CONTENT SECTION === */}
      <div ref={resultsRef} className="container mx-auto px-4 mt-16 space-y-16 scroll-mt-32 transition-all duration-500">

        {/* 1. PERSONALISASI (AI) */}
        {personalRek.length > 0 && user && (
          <motion.section 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-11 w-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/25">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text-main">Rekomendasi Pilihan</h3>
                <p className="text-sm text-text-muted">Destinasi yang disukai wisatawan dengan minat serupa untuk {user.full_name.split(' ')[0]}</p>
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
                  <div className="liquid-card rounded-3xl p-4 h-full flex items-start gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm shrink-0">
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
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white bg-rose-600 px-2.5 py-1 rounded-full shadow-xs">
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
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-11 w-11 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/25">
                <Compass size={20} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text-main">Mungkin Anda Sukai</h3>
                <p className="text-sm text-text-muted">Rekomendasi yang disesuaikan dengan preferensi dan riwayat jelajahmu</p>
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
                  <div className="liquid-card rounded-3xl p-4 h-full flex items-start gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm shrink-0">
                      <ProgressiveImage
                        src={getImageUrl(wisata.gambar)}
                        alt={wisata.nama_wisata}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        fallback="/placeholder-wisata.svg"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main line-clamp-2 mb-1 group-hover:text-rose-600 transition-colors">{wisata.nama_wisata}</h4>
                      <p className="text-xs text-text-muted line-clamp-2 mb-3">{wisata.alamat}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-amber-600 px-2.5 py-1 rounded-full shadow-xs">
                        <Star size={10} fill="currentColor" /> Pilihan Serupa
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
          <div className="flex items-end justify-between border-b border-slate-200 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Destinasi Populer</h2>
              <p className="text-sm text-slate-600 mt-1">Jelajahi tempat hits di Kabupaten Jember</p>
            </div>
            <div className="liquid-glass-pill px-4 py-2 rounded-2xl flex items-center gap-2">
              <div className="h-6 w-[3px] bg-rose-600 rounded-full" />
              <span className="text-2xl font-black text-slate-900 tabular-nums">{displayedWisata.length || 56}</span>
              <span className="text-xs text-slate-600 font-semibold">destinasi</span>
            </div>
          </div>

          {isFiltering ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 wisata-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <WisataCardSkeleton key={`filter-skeleton-${i}`} />
              ))}
            </div>
          ) : displayedWisata.length === 0 ? (
            <div className="text-center py-20 liquid-card rounded-3xl">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Search size={24} />
              </div>
              <h3 className="text-lg font-bold text-text-main">Tidak ditemukan</h3>
              <p className="text-text-muted text-sm mb-4">Coba cari dengan kata kunci lain.</p>
              <button 
                onClick={handleReset}
                className="ios-press px-5 py-2.5 bg-rose-600 text-white rounded-full font-semibold text-sm min-h-[44px]"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 wisata-grid">
              {displayedWisata.map((wisata) => (
                <WisataCard key={wisata.id_wisata || wisata.id} wisata={wisata} />
              ))}
            </div>
          )}
        </section>

        {/* CAK JEMBER: iPhone Liquid Glass Editorial Card (Zero Gradients) */}
        <section className="mt-12">
          <div className="relative overflow-hidden rounded-[2.25rem] liquid-glass p-7 md:p-10">
            <div className="relative grid md:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] tracking-widest font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-rose-600" /> ASISTEN CERDAS CAK JEMBER
                </div>
                <h2 className="mt-4 text-[1.75rem] md:text-[2.15rem] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                  Bingung mau liburan<br/>ke mana di Jember?
                </h2>
                <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-600 max-w-[48ch]">
                  Tanya langsung ke Cak Jember. Asisten AI berdialek Pandalungan yang siap bantu rekomendasikan pantai tersembunyi sampai kuliner legendaris sesuai seleramu.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link 
                    to="/rekomendasi" 
                    onClick={() => trackEvent('click_cta_cak_jember', { location: 'home_bottom_banner' })}
                    className="ios-press inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 min-h-[44px] rounded-full text-sm font-bold hover:bg-black transition shadow-md"
                  >
                    Mulai Ngobrol dengan Cak Jember <span aria-hidden>→</span>
                  </Link>
                  <span className="inline-flex items-center text-xs font-medium text-slate-600 self-center">Gratis • Dialek Pandalungan • Info Akurat</span>
                </div>
              </div>

              {/* iPhone iMessage Mockup Card */}
              <div className="relative">
                <div className="bg-slate-900 rounded-[1.75rem] p-5 shadow-xl border border-slate-800">
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-rose-600 grid place-items-center text-white text-xs font-bold">CJ</div>
                    <div className="text-xs">
                      <div className="font-bold text-white leading-none">Cak Jember</div>
                      <div className="text-emerald-400 text-[11px] font-medium mt-0.5">Online • iMessage AI</div>
                    </div>
                    <div className="ml-auto w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-bl-xs px-4 py-3 text-sm leading-relaxed border border-slate-700">
                      Rekomendasi pantai sepi sing cocok gawe healing, Cak?
                    </div>
                    <div className="bg-rose-600 text-white rounded-2xl rounded-br-xs px-4 py-3 text-sm leading-relaxed ml-6 shadow-sm">
                      Wes, coba nang Pantai Papuma pas sunrise, Lur! Sepi, ombake apik.
                    </div>
                    <div className="flex flex-wrap gap-1.5 ml-6 pt-1">
                      <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">Pantai Papuma</span>
                      <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">Teluk Love</span>
                      <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">Kuliner</span>
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
