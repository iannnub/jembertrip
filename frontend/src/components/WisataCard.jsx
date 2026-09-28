import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Sparkles } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';
import { getImageUrl } from '../utils/imageHelper';
import { useLazyLoad } from '../hooks/useLazyLoad';

export default function WisataCard({ wisata }) {
  const [ref, isVisible] = useLazyLoad({ rootMargin: '150px' });

  return (
    <div ref={ref} className="h-full">
      {isVisible ? (
        <Link
          to={`/wisata/${wisata.id}`}
          className="block h-full bg-card-bg rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-primary/10 border border-gray-100 overflow-hidden transition-all duration-300 group"
        >
          {/* Image Container */}
          <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden rounded-t-2xl">
            <ProgressiveImage
              src={getImageUrl(wisata.gambar)}
              alt={wisata.nama_wisata}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              fallback="/placeholder-wisata.svg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />
            <div className="absolute top-4 left-4 pointer-events-none">
              <span className="bg-white/90 backdrop-blur-md text-text-main text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm tracking-wide uppercase">
                {wisata.kategori || 'Umum'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-1">
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
                <span className="text-xs font-bold text-text-main">
                  {wisata.rating && wisata.rating !== '[Unverified]' ? wisata.rating : '4.8'}
                </span>
                <span className="text-[10px] text-text-muted">(Review)</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-page-bg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors border border-primary/10">
                <Sparkles size={14} />
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div className="h-full min-h-[340px] bg-slate-50 border border-slate-100 rounded-3xl p-4 flex flex-col justify-between animate-pulse">
          <div className="aspect-[4/3] bg-slate-200 rounded-2xl w-full" />
          <div className="space-y-3 mt-4">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
          <div className="h-8 bg-slate-200 rounded-full w-full mt-4" />
        </div>
      )}
    </div>
  );
}
