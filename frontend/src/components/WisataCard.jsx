import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Sparkles } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';
import { getImageUrl } from '../utils/imageHelper';
import { useLazyLoad } from '../hooks/useLazyLoad';

function WisataCard({ wisata }) {
  const [ref, isVisible] = useLazyLoad({ rootMargin: '150px' });

  return (
    <div ref={ref} className="h-full">
      {isVisible ? (
        <Link
          to={`/wisata/${wisata.id}`}
          className="liquid-card group flex flex-col h-full rounded-3xl overflow-hidden"
        >
          {/* Image Container */}
          <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden rounded-t-3xl">
            <ProgressiveImage
              src={getImageUrl(wisata.gambar)}
              alt={wisata.nama_wisata}
              className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              fallback="/placeholder-wisata.svg"
            />
            
            <div className="absolute top-3.5 left-3.5 pointer-events-none">
              <span className="liquid-glass-pill text-slate-900 text-[10px] font-extrabold px-3 py-1.5 rounded-full tracking-wide uppercase">
                {wisata.kategori || 'Umum'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4.5 flex flex-col flex-1">
            <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1 group-hover:text-rose-600 transition-colors">
              {wisata.nama_wisata}
            </h3>

            <div className="flex items-start gap-1.5 text-xs text-slate-600 leading-relaxed line-clamp-2 mt-1.5 mb-3">
              <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="line-clamp-2">{wisata.alamat}</p>
            </div>

            <div className="mt-auto flex items-center justify-between pt-3.5 border-t border-slate-100">
              <div className="flex items-center gap-1 tabular-nums">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-slate-900">
                  {wisata.rating && wisata.rating !== '[Unverified]' ? wisata.rating : '4.8'}
                </span>
                <span className="text-[10px] text-slate-500">(Review)</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors border border-rose-100">
                <Sparkles size={14} />
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div className="h-full min-h-[340px] liquid-card rounded-3xl p-4 flex flex-col justify-between animate-pulse">
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

export default memo(WisataCard, (prevProps, nextProps) => {
  return (
    (prevProps.wisata?.id || prevProps.wisata?.id_wisata) === (nextProps.wisata?.id || nextProps.wisata?.id_wisata) &&
    prevProps.wisata?.nama_wisata === nextProps.wisata?.nama_wisata &&
    prevProps.wisata?.gambar === nextProps.wisata?.gambar
  );
});
