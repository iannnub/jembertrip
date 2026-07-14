import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const CATEGORIES = [
  { id: "Pantai", name: "Pantai", icon: "🌊" },
  { id: "Rekreasi", name: "Rekreasi", icon: "🎡" },
  { id: "Agrowisata", name: "Agrowisata", icon: "🍓" },
  { id: "Edukasi", name: "Edukasi", icon: "📚" },
  { id: "Religi", name: "Religi", icon: "🕌" },
  { id: "Rural Tourism", name: "Pedesaan", icon: "🌾" },
  { id: "Air Terjun", name: "Air Terjun", icon: "💧" },
  { id: "Situs", name: "Situs Sejarah", icon: "🏛️" },
  { id: "Panorama", name: "Panorama Alam", icon: "🏔️" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleCategory = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, id]);
      } else {
        toast.error("Maksimal pilih 3 kategori saja ya!");
      }
    }
  };

  const handleSave = async () => {
    if (selected.length !== 3) {
      toast.error("Pilih tepat 3 kategori agar AI kami bisa bekerja maksimal!");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/v1/user/onboard`, {
        categories: selected
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local storage user data
      const userData = JSON.parse(localStorage.getItem('user'));
      userData.has_onboarded = true;
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success("Kategori berhasil disimpan! Selamat menjelajah.");
      navigate("/");
    } catch (error) {
      toast.error("Gagal menyimpan preferensi: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-3">Tunggu Sebentar, Petualang!</h1>
          <p className="text-text-muted text-lg">Pilih <span className="font-bold text-primary">3 kategori favoritmu</span>, dan biarkan AI kami meracik rekomendasi rahasia khusus untukmu.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.id);
            return (
              <div 
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`relative cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 h-32
                  ${isSelected ? 'bg-primary/5 border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-white border-gray-100 hover:border-primary/30 hover:shadow-md'}`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 text-primary">
                    <CheckCircle2 size={20} className="fill-white" />
                  </div>
                )}
                <span className="text-4xl">{cat.icon}</span>
                <span className={`font-bold ${isSelected ? 'text-primary' : 'text-text-main'}`}>{cat.name}</span>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button 
            onClick={handleSave}
            disabled={loading || selected.length !== 3}
            className={`w-full md:w-auto px-12 py-4 rounded-full font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-2 mx-auto
              ${selected.length === 3 
                ? 'bg-gradient-to-r from-primary to-accent text-white hover:scale-105 hover:shadow-primary/40 cursor-pointer' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {loading ? "Menyiapkan AI..." : (
              <>
                Mulai Petualangan <MapPin size={20} />
              </>
            )}
          </button>
          <p className="mt-4 text-sm text-text-muted">
            Terpilih: <span className="font-bold text-primary">{selected.length}</span> / 3
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default OnboardingPage;
