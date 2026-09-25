// src/pages/WisataDetail.jsx

import React, { useState, useEffect } from 'react';
import NgrokImage from '../components/NgrokImage';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
// Import Icon Modern
import { MapPin, ArrowLeft, Tag, Info, DollarSign, Star, Sparkles, Compass, Clock } from 'lucide-react';
// Import Animasi
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function WisataDetail() {
  const { id } = useParams(); 
  
  const [wisata, setWisata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rekomendasiList, setRekomendasiList] = useState([]);
  const [loadingRek, setLoadingRek] = useState(false);

  const fetchRekomendasiAI = async (queryText) => {
    setLoadingRek(true);
    try {
        const res = await axios.post(`${API_BASE_URL}/api/v1/rekomendasi`, { 
            query: queryText, 
            k: 15 
        });
        
        const rawResults = res.data.results;
        
        let candidates = rawResults
            .map(item => item.metadata)
            .filter(item => String(item.id) !== String(id));

        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        const finalResults = candidates.slice(0, 3);
        setRekomendasiList(finalResults);
    } catch (err) {
        console.error("Gagal fetch rekomendasi:", err);
    } finally {
        setLoadingRek(false);
    }
  };

  const recordHistory = async (dataWisata) => {
      const token = localStorage.getItem('token');
      if (!token) return; 
      
      try {
          await axios.post(`${API_BASE_URL}/api/history`,
              { wisata_id: String(dataWisata.id), wisata_name: dataWisata.nama_wisata },
              { headers: { Authorization: `Bearer ${token}` } }
          );
      } catch (err) {
          console.error("Gagal mencatat history:", err);
      }
  };

  // 1. Fetch Detail & Logic
  useEffect(() => {
    const fetchDetailAndRecommendation = async () => {
      setLoading(true);
      setRekomendasiList([]); 
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/wisata/${id}`);
        const dataWisata = response.data.data;
        setWisata(dataWisata);
        setLoading(false); 

        if (dataWisata) {
            fetchRekomendasiAI(dataWisata.nama_wisata + " " + dataWisata.kategori);
            recordHistory(dataWisata);
        }
      } catch (err) {
        console.error(err);
        setError("Gagal mengambil data detail wisata.");
        setLoading(false);
      }
    };

    fetchDetailAndRecommendation();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (wisata) {
      document.title = `${wisata.nama_wisata} - JemberTrip`;
    } else {
      document.title = "Memuat Wisata... - JemberTrip";
    }
  }, [wisata]);

  const VERCEL_URL = "https://jembertrip.vercel.app";

  const getImageUrl = (gambarPath, width = 800) => {
      if (!gambarPath) return "https://placehold.co/800x600?text=No+Image";
      
      let fullUrl;
      if (gambarPath.startsWith('http')) {
          if (gambarPath.includes('ngrok') || gambarPath.includes('127.0.0.1') || gambarPath.includes('localhost')) {
              return gambarPath;
          }
          fullUrl = gambarPath;
      } else {
          const cleanPath = gambarPath.startsWith('/') ? gambarPath : `/${gambarPath}`;
          fullUrl = `${VERCEL_URL}${cleanPath}`;
      }
      return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&w=${width}&output=webp&q=80`;
  };

  const getMapsUrl = (nama, alamat) => {
    const query = encodeURIComponent(`${nama}, ${alamat}, Jember`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  // --- UI LOADING ---
  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] bg-page-bg">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-text-muted font-medium">Memuat informasi wisata...</p>
    </div>
  );

  // --- UI ERROR ---
  if (error || !wisata) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-page-bg p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md border border-red-100">
            <div className="w-16 h-16 bg-red-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
            <h2 className="text-xl font-bold text-text-main mb-2">Wisata Tidak Ditemukan</h2>
            <p className="text-text-muted mb-6 text-sm">Data wisata yang kamu cari mungkin sudah dihapus atau tautan salah.</p>
            <Link to="/" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-soft transition-all min-h-[44px]">
                <ArrowLeft size={18} /> Kembali ke Home
            </Link>
        </div>
    </div>
  );

  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-h-screen bg-page-bg pb-16 pt-6 md:pt-10"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        {/* BREADCRUMB / BACK BUTTON */}
        <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-text-muted hover:text-primary font-medium transition-colors gap-2 bg-white px-4 py-2.5 rounded-full shadow-xs border border-gray-100 group min-h-[44px]">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Kembali
            </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
            
            {/* --- KOLOM KIRI: GAMBAR UTAMA & DESKRIPSI --- */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
                {/* Gambar Hero - Responsive Aspect Ratio (video on mobile, 21/9 on desktop) */}
                <div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden shadow-xl shadow-primary/5 bg-gray-200 aspect-video md:aspect-[21/9] group">
                    <NgrokImage 
                        src={getImageUrl(wisata.gambar)} 
                        alt={wisata.nama_wisata} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 md:top-6 md:left-6">
                        <span className="bg-white/95 backdrop-blur-md text-primary text-xs md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-xl shadow-md uppercase tracking-wider flex items-center gap-2 border border-white/50">
                            <Tag size={14} className="text-primary" /> {wisata.kategori}
                        </span>
                    </div>
                </div>

                {/* Deskripsi */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-100">
                    <h2 className="text-xl md:text-2xl font-bold text-text-main mb-4 flex items-center gap-2">
                        <Info className="text-primary" /> Tentang Destinasi
                    </h2>
                    <p className="text-text-main leading-relaxed text-base md:text-lg whitespace-pre-wrap font-light text-justify">
                        {wisata.deskripsi || "Tidak ada deskripsi detail."}
                    </p>
                </div>

                {/* PETA LOKASI INTERAKTIF (MOBILE-READY) */}
                {wisata.latitude && wisata.longitude && (
                  <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-100">
                    <h2 className="text-xl md:text-2xl font-bold text-text-main mb-4 flex items-center gap-2">
                      <MapPin className="text-primary" /> Peta Lokasi
                    </h2>
                    <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-inner border border-gray-200">
                      <iframe
                        title={`Peta ${wisata.nama_wisata}`}
                        src={`https://maps.google.com/maps?q=${wisata.latitude},${wisata.longitude}&hl=id&z=14&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        aria-label="Peta Google Maps"
                      />
                    </div>
                  </div>
                )}

                {/* AI REKOMENDASI SECTION */}
                <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
                        <Sparkles className="text-accent" /> Wisata Serupa
                    </h3>
                    
                    {loadingRek ? (
                        <div className="flex items-center gap-3 text-text-muted bg-white p-4 rounded-xl animate-pulse border border-gray-100">
                            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                            Sedang mencari rekomendasi terbaik...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {rekomendasiList.map((rec, idx) => (
                                <Link 
                                    to={`/wisata/${rec.id}`} 
                                    key={idx} 
                                    className="group bg-white rounded-2xl p-3 border border-gray-100 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all flex flex-col"
                                >
                                    <div className="h-32 rounded-xl overflow-hidden bg-gray-100 mb-3 relative">
                                        <NgrokImage 
                                            src={getImageUrl(rec.gambar)} 
                                            alt={rec.nama_wisata} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        />
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                            {rec.kategori}
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-text-main text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                        {rec.nama_wisata}
                                    </h4>
                                    <p className="text-xs text-text-muted line-clamp-1 mt-1">{rec.alamat}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                    
                    {!loadingRek && rekomendasiList.length === 0 && (
                         <p className="text-text-muted text-sm italic">Belum ada rekomendasi tambahan.</p>
                    )}
                </div>
            </div>

            {/* --- KOLOM KANAN: INFO SIDEBAR (STICKY ON DESKTOP) --- */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl p-6 shadow-lg shadow-primary/5 border border-gray-100 lg:sticky lg:top-28 space-y-6">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-extrabold text-text-main mb-2 leading-tight">
                          {wisata.nama_wisata}
                      </h1>
                      
                      <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-accent fill-accent" />)}
                          <span className="text-sm text-text-muted ml-2 font-medium">4.8 (Review)</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                        {/* Box Lokasi */}
                        <div className="flex gap-4 items-start p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <MapPin className="text-primary shrink-0 mt-1" />
                            <div>
                                <p className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-1">Lokasi</p>
                                <p className="text-text-main font-medium text-sm leading-snug">{wisata.alamat}</p>
                            </div>
                        </div>

                        {/* Box Jam Operasional */}
                        {(wisata.jam_buka || wisata.jam_tutup) && (
                            <div className="flex gap-4 items-start p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
                                <Clock className="text-blue-600 shrink-0 mt-1" />
                                <div>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Jam Buka</p>
                                    <p className="text-text-main font-bold text-sm">
                                        {wisata.jam_buka ? `${wisata.jam_buka} - ${wisata.jam_tutup || 'Selesai'}` : "Setiap Hari"}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Box Harga */}
                        <div className="flex gap-4 items-start p-4 bg-secondary/10 rounded-2xl border border-secondary/20">
                            <DollarSign className="text-secondary shrink-0 mt-1" />
                            <div>
                                <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Harga Tiket</p>
                                <p className="text-text-main font-bold text-lg">
                                    {wisata.harga_tiket ? `Rp ${Number(wisata.harga_tiket).toLocaleString('id-ID')}` : "Gratis / Info -"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* TOMBOL NAVIGASI MAPS */}
                    <a 
                        href={getMapsUrl(wisata.nama_wisata, wisata.alamat)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-6 bg-gradient-to-r from-primary to-primary-soft text-white py-4 rounded-xl font-bold text-base md:text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                    >
                        <Compass size={20} /> Buka Google Maps
                    </a>
                </div>
            </div>

        </div>
      </div>
    </motion.div>
  );
}

export default WisataDetail;
