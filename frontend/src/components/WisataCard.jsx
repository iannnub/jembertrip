import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Clock } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';
import { getImageUrl } from '../utils/imageHelper';

function formatTicketBadge(wisata) {
  const raw = wisata?.harga_tiket;
  if (raw === '0' || raw === 0) {
    return { label: 'Gratis', isFree: true };
  }
  if (raw && raw !== '[Unverified]') {
    const num = Number(String(raw).replace(/[^0-9]/g, ''));
    if (!Number.isNaN(num) && num > 0) {
      return { label: `Rp ${num.toLocaleString('id-ID')}`, isFree: false };
    }
    if (String(raw).toLowerCase().includes('gratis')) {
      return { label: 'Gratis', isFree: true };
    }
    return { label: String(raw), isFree: false };
  }
  if (wisata?.jam_buka && wisata.jam_buka !== '[Unverified]') {
    return { label: wisata.jam_buka, isClock: true };
  }
  return { label: 'Destinasi Jember', isClock: false };
}

function WisataCard({ wisata }) {
  const ticket = formatTicketBadge(wisata);

  return (
    <div className="h-full">
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
            <span className="liquid-glass-pill text-slate-900 text-[11px] font-extrabold px-3 py-1.5 rounded-full tracking-wide uppercase">
              {wisata.kategori || 'Umum'}
            </span>
          </div>
        </div>

        {/* Content with generous padding (p-5 = 20px) so text never touches card borders */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-rose-600 transition-colors">
            {wisata.nama_wisata}
          </h3>

          <div className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed mt-2 mb-4">
            <MapPin size={15} className="text-rose-500 mt-0.5 flex-shrink-0" />
            <p className="line-clamp-2">{wisata.alamat}</p>
          </div>

          <div className="mt-auto flex items-center justify-between pt-3.5 border-t border-slate-100">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full tabular-nums ${
                ticket.isFree
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {ticket.isClock && <Clock size={12} className="text-slate-500" />}
              {ticket.label}
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 group-hover:text-white bg-rose-50 group-hover:bg-rose-600 px-3 py-1.5 rounded-full transition-colors border border-rose-100">
              Detail <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </Link>
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
