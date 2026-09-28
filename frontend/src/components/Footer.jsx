import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      {/* accent hairline */}
      <div className="h-1 h-[3px] w-full bg-gradient-to-r from-rose-500 via-orange-400 to-emerald-500" />
      <div className="max-w-6xl mx-auto px-6">
        {/* top grid */}
        <div className="grid md:grid-cols-[1.6fr_1fr_1fr] gap-10 py-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-slate-900 grid place-items-center font-black text-sm">JT</div>
              <div>
                <div className="font-bold text-white leading-none tracking-tight">JemberTrip</div>
                <div className="text-xs text-slate-400">Jelajahi Bumi Pandalungan dengan AI</div>
              </div>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-sm">
              Kurasi pantai selatan, tembakau, dan panorama Jember. Dipandu Cak Jember, asisten AI berdialek Pandalungan.
            </p>
            <div className="mt-4 flex gap-2">
              <a href="https://github.com/iannnub/jembertrip" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 grid place-items-center hover:bg-slate-700 transition text-xs" title="GitHub iannnub">↗</a>
              <span className="text-xs text-slate-500 self-center">Pandalungan • Tembakau • Pantai Selatan</span>
            </div>
          </div>

          {/* Jelajahi */}
          <div>
            <div className="text-[11px] tracking-widest font-semibold text-slate-400 mb-3">JELAJAHI</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition">Beranda</Link></li>
              <li><Link to="/wisata" className="hover:text-white transition">Eksplor Wisata</Link></li>
              <li><Link to="/rekomendasi" className="hover:text-white transition">Rekomendasi AI</Link></li>
              <li><Link to="/rekomendasi" className="hover:text-white transition">Chat Cak Jember</Link></li>
            </ul>
          </div>

          {/* Kategori */}
          <div>
            <div className="text-[11px] tracking-widest font-semibold text-slate-400 mb-3">KATEGORI</div>
            <div className="flex flex-wrap gap-2">
              {["Pantai","Air Terjun","Agrowisata","Edukasi"].map((c) => (
                <Link key={c} to={`/wisata?kategori=${encodeURIComponent(c)}`} className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition">
                  {c}
                </Link>
              ))}
              <Link to="/wisata" className="px-3 py-1.5 rounded-full border border-slate-700 text-xs text-slate-400 hover:text-white transition">+2 lagi</Link>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className="border-t border-slate-800 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">© 2026 JemberTrip. Crafted with <span className="text-rose-400">♥</span> for Jember.</div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> System Online
            </span>
            <span className="text-slate-400">Dibuat oleh</span>
            <a href="https://github.com/iannnub" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-100 transition">
              iannnub <span className="text-[10px]">↗</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
