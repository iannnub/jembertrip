// src/pages/WisataDetail.jsx

import React, { useState, useEffect } from 'react';
import NgrokImage from '../components/NgrokImage';
import SEO from '../components/SEO';
import Breadcrumb from '../components/Breadcrumb';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { trackEvent } from '../utils/analytics';
import { getImageUrl } from '../utils/imageHelper';
// Import Icon Modern
import { MapPin, ArrowLeft, Tag, Info, DollarSign, Sparkles, Compass, Clock, AlertTriangle } from 'lucide-react';

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

  // 1. Fetch Detail & Logic (Instant Local Hydration + Background Sync)
  useEffect(() => {
    let isMounted = true;

    const fetchDetailAndRecommendation = async () => {
      // 1. Hydrate immediately from local static bundle (< 15ms) so page switch is instant
      try {
        const fallbackRes = await axios.get('/data/wisata-fallback.json');
        if (isMounted && Array.isArray(fallbackRes.data)) {
          const found = fallbackRes.data.find(item => String(item.id) === String(id));
          if (found) {
            setWisata(found);
            setLoading(false);
            const similar = fallbackRes.data
              .filter(item => String(item.id) !== String(id) && item.kategori === found.kategori)
              .slice(0, 3);
            setRekomendasiList(similar);
          }
        }
      } catch {
        // Fallback to backend API below
      }

      // 2. Refresh in background from live Backend API & record user history
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/wisata/${id}`, { timeout: 5000 });
        const dataWisata = response.data?.data;
        if (isMounted && dataWisata) {
          setWisata(dataWisata);
          setError(null);
          setLoading(false);

          fetchRekomendasiAI(dataWisata.nama_wisata + " " + dataWisata.kategori);
          recordHistory(dataWisata);
          trackEvent('view_wisata_detail', {
            wisata_id: dataWisata.id,
            wisata_name: dataWisata.nama_wisata,
            kategori: dataWisata.kategori
          });
        }
      } catch {
        if (isMounted) {
          setWisata((prev) => {
            if (!prev) setError("Gagal mengambil data detail wisata.");
            return prev;
          });
          setLoading(false);
        }
      }
    };

    fetchDetailAndRecommendation();
    window.scrollTo(0, 0);
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (wisata) {
      document.title = `${wisata.nama_wisata} - JemberTrip`;
    } else {
      document.title = "Memuat Wisata... - JemberTrip";
    }
  }, [wisata]);

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
      <div className="liquid-card p-8 rounded-3xl text-center max-w-md">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-main mb-2">Wisata Tidak Ditemukan</h2>
        <p className="text-text-muted mb-6 text-sm">Data wisata yang kamu cari mungkin sudah dihapus atau tautan salah.</p>
        <Link to="/" className="ios-press inline-flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-rose-700 transition-all min-h-[44px]">
          <ArrowLeft size={18} /> Kembali ke Home
        </Link>
      </div>
    </div>
  );

  // Schema Markup untuk Google Rich Results (TouristAttraction)
  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": wisata.nama_wisata,
    "description": wisata.deskripsi,
    "image": wisata.gambar?.startsWith('http') ? wisata.gambar : `https://jembertrip.vercel.app/${wisata.gambar?.replace(/^\//, '')}`,
    "url": `https://jembertrip.vercel.app/wisata/${wisata.id}`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": wisata.alamat,
      "addressLocality": "Jember",
      "addressRegion": "Jawa Timur",
      "addressCountry": "ID"
    },
    ...(wisata.latitude && wisata.longitude ? {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": Number(wisata.latitude) || wisata.latitude,
        "longitude": Number(wisata.longitude) || wisata.longitude
      }
    } : {}),
    "touristType": wisata.kategori,
    "isAccessibleForFree": wisata.harga_tiket === "0" || wisata.harga_tiket === 0,
    "publicAccess": true
  };

  return (
    <>
      <SEO
        title={`${wisata.nama_wisata} - Destinasi Wisata ${wisata.kategori}`}
        description={(wisata.deskripsi || '').substring(0, 155)}
        keywords={`${wisata.nama_wisata}, wisata ${wisata.kategori?.toLowerCase()}, jember, ${wisata.alamat}`}
        image={getImageUrl(wisata.gambar, 1200)}
        url={`https://jembertrip.vercel.app/wisata/${wisata.id}`}
        type="article"
        schema={schema}
      />

      <div className="min-h-screen bg-page-bg pb-16 pt-6 md:pt-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          
          {/* BREADCRUMB & BACK BUTTON */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Breadcrumb
              items={[
                { label: wisata.kategori, href: `/?kategori=${encodeURIComponent(wisata.kategori)}` },
                { label: wisata.nama_wisata }
              ]}
            />
            <Link to="/" className="liquid-glass-pill ios-press inline-flex items-center text-slate-700 hover:text-rose-600 font-semibold transition-colors gap-2 px-4 py-2 rounded-full group min-h-[44px] shrink-0 self-start sm:self-auto">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Home
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
            
            {/* --- KOLOM KIRI: GAMBAR UTAMA & DESKRIPSI --- */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* Gambar Hero - Responsive Aspect Ratio (video on mobile, 21/9 on desktop) */}
              <div className="relative rounded-3xl md:rounded-[2rem] overflow-hidden shadow-xl bg-slate-200 aspect-video md:aspect-[21/9] group border border-white/80">
                <NgrokImage 
                  src={getImageUrl(wisata.gambar)} 
                  alt={wisata.nama_wisata} 
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 md:top-6 md:left-6">
                  <span className="liquid-glass-pill text-rose-700 text-xs md:text-sm font-extrabold px-3.5 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-wider flex items-center gap-2">
                    <Tag size={14} className="text-rose-600" /> {wisata.kategori}
                  </span>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="liquid-card rounded-3xl p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Info className="text-rose-600" /> Tentang Destinasi
                </h2>
                <p className="text-slate-700 leading-relaxed text-base md:text-lg whitespace-pre-wrap font-normal text-justify">
                  {wisata.deskripsi || "Tidak ada deskripsi detail."}
                </p>
              </div>

              {/* PETA LOKASI INTERAKTIF (MOBILE-READY) */}
              {wisata.latitude && wisata.longitude && (
                <div className="liquid-card rounded-3xl p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <MapPin className="text-rose-600" /> Peta Lokasi
                  </h2>
                  <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
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
              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                  <Sparkles className="text-amber-500" /> Wisata Serupa
                </h3>
                
                {loadingRek && rekomendasiList.length === 0 ? (
                  <div className="flex items-center gap-3 text-slate-500 liquid-card p-4 rounded-2xl animate-pulse">
                    <div className="w-5 h-5 bg-slate-200 rounded-full"></div>
                    Sedang mencari rekomendasi terbaik...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {rekomendasiList.map((rec, idx) => (
                      <Link 
                        to={`/wisata/${rec.id}`} 
                        key={idx}
                        onClick={() => trackEvent('click_recommendation', {
                          recommendation_type: 'similar_wisata',
                          source_wisata_id: wisata?.id,
                          target_wisata_id: rec.id,
                          target_wisata_name: rec.nama_wisata
                        })} 
                        className="group liquid-card rounded-2xl p-4 flex flex-col"
                      >
                        <div className="h-32 rounded-xl overflow-hidden bg-slate-100 mb-3.5 relative">
                          <NgrokImage 
                            src={getImageUrl(rec.gambar)} 
                            alt={rec.nama_wisata} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute top-2.5 left-2.5 liquid-glass-pill text-slate-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            {rec.kategori}
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-rose-600 transition-colors">
                          {rec.nama_wisata}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">{rec.alamat}</p>
                      </Link>
                    ))}
                  </div>
                )}
                
                {!loadingRek && rekomendasiList.length === 0 && (
                  <p className="text-slate-500 text-sm italic">Belum ada rekomendasi tambahan.</p>
                )}
              </div>
            </div>

            {/* --- KOLOM KANAN: INFO SIDEBAR (LIQUID GLASS STICKY ON DESKTOP) --- */}
            <div className="lg:col-span-1">
              <div className="liquid-glass rounded-3xl p-6 lg:sticky lg:top-28 space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full mb-3">
                    <Tag size={12} /> {wisata.kategori} • Kabupaten Jember
                  </span>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                    {wisata.nama_wisata}
                  </h1>
                </div>

                <div className="space-y-4">
                  {/* Box Lokasi */}
                  <div className="flex gap-4 items-start p-4 bg-rose-50/80 rounded-2xl border border-rose-100">
                    <MapPin className="text-rose-600 shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-extrabold text-rose-700 uppercase tracking-wider mb-1">Lokasi</p>
                      <p className="text-slate-900 font-medium text-sm leading-snug">{wisata.alamat}</p>
                    </div>
                  </div>

                  {/* Box Jam Operasional */}
                  {(wisata.jam_buka || wisata.jam_tutup) && (
                    <div className="flex gap-4 items-start p-4 bg-sky-50/80 rounded-2xl border border-sky-100">
                      <Clock className="text-sky-700 shrink-0 mt-1" />
                      <div>
                        <p className="text-xs font-extrabold text-sky-700 uppercase tracking-wider mb-1">Jam Buka</p>
                        <p className="text-slate-900 font-bold text-sm tabular-nums">
                          {wisata.jam_buka
                            ? (wisata.jam_tutup && wisata.jam_tutup !== wisata.jam_buka
                                ? `${wisata.jam_buka} - ${wisata.jam_tutup}`
                                : wisata.jam_buka)
                            : "Setiap Hari"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Box Harga */}
                  <div className="flex gap-4 items-start p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                    <DollarSign className="text-emerald-700 shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mb-1">Harga Tiket</p>
                      <p className="text-slate-900 font-extrabold text-lg tabular-nums">
                        {wisata.harga_tiket === "0" || wisata.harga_tiket === 0
                          ? "Gratis"
                          : wisata.harga_tiket && wisata.harga_tiket !== "[Unverified]"
                            ? (isNaN(Number(wisata.harga_tiket)) ? wisata.harga_tiket : `Rp ${Number(wisata.harga_tiket).toLocaleString('id-ID')}`)
                            : "Info di Lokasi"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* TOMBOL NAVIGASI MAPS */}
                <a 
                  href={getMapsUrl(wisata.nama_wisata, wisata.alamat)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('open_google_maps', {
                    wisata_id: wisata.id,
                    wisata_name: wisata.nama_wisata
                  })}
                  className="ios-press w-full mt-6 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                >
                  <Compass size={20} /> Buka Google Maps
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default WisataDetail;
