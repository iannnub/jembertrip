// src/pages/ChatPage.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import NgrokImage from '../components/NgrokImage';
import SEO from '../components/SEO';
import axios from 'axios';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { trackEvent } from '../utils/analytics';
import { getImageUrl } from '../utils/imageHelper';
// Import Icon
import { Send, Bot, User, Info, Sparkles, Menu, X, Plus, Trash2, ChevronRight, Mic, MicOff, Languages, MapPin } from 'lucide-react';
// Import Animasi
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
// Import Markdown Renderer
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function formatSessionDate(session) {
  const raw = session?.created_at || session?.updated_at;
  if (!raw) return 'Baru saja';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return 'Baru saja';
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function ChatPage() {
  // ===== SIDEBAR STATE =====
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(() => Boolean(localStorage.getItem('token')));
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  // ===== CHAT STATE =====
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Halo, Rek! Saya Cak Jember. Mau cari pantai, kuliner, atau wisata alam apa di Jember hari ini?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [language, setLanguage] = useState(localStorage.getItem('chatLanguage') || "id");
  const [showLangMenu, setShowLangMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('token');

  // ===== VOICE RECOGNITION SETUP =====
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      const timer = setTimeout(() => {
        setInput(transcript);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [transcript]);

  const handleMicClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      const langCode = language === 'id' ? 'id-ID' : (language === 'jowo' ? 'jv-ID' : 'id-ID');
      SpeechRecognition.startListening({ continuous: true, language: langCode });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === "success") {
        setChatSessions(response.data.data);
      }
    } catch (err) {
      console.error("Error loading chat sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    if (token) {
      axios.get(`${API_BASE_URL}/api/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((response) => {
        if (isMounted && response.data.status === "success") {
          setChatSessions(response.data.data);
        }
      })
      .catch((err) => {
        console.error("Error loading chat sessions:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingSessions(false);
      });
    }

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
    };
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadChatSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    if (window.innerWidth < 768) setSidebarOpen(false);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === "success") {
        const formattedMessages = response.data.data.map(msg => ({
          sender: msg.sender,
          text: msg.content,
          sources: msg.sources,
          recommendations: msg.recommendations,
          timestamp: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        }));
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error("Error loading chat messages:", err);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
    setMessages([
      {
        sender: 'ai',
        text: 'Halo, Rek! Mau cari rekomendasi wisata atau info kuliner apa di Jember?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInput("");
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!window.confirm("Yakin mau hapus percakapan ini?")) return;

    setDeletingSessionId(sessionId);
    try {
      await axios.delete(`${API_BASE_URL}/api/chat/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (listening) SpeechRecognition.stopListening();

    if (!token) {
      const errorMessage = { 
        sender: 'ai', 
        text: "Oops! Token tidak ditemukan. Silakan login ulang.",
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const userMessage = { 
      sender: 'user', 
      text: input,
      timestamp: currentTime
    };
    setMessages((prev) => [...prev, userMessage]);
    
    trackEvent('ask_cak_jember', {
      question_length: userMessage.text.length,
      language: language,
      input_method: listening ? 'voice' : 'text'
    });

    setInput(""); 
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/chat`, {
        question: userMessage.text,
        session_id: currentSessionId,
        language: language
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === "success") {
        if (!currentSessionId && response.data.session_id) {
          setCurrentSessionId(response.data.session_id);
          await loadChatSessions();
        }

        const aiMessage = { 
          sender: 'ai', 
          text: response.data.answer,
          sources: response.data.sources,
          recommendations: response.data.recommendations,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error("Error Chat AI:", err);
      let errorText = "Koneksi ke server terputus. Silakan coba kirim pertanyaan sekali lagi.";
      if (err.response?.status === 401) {
        errorText = "Token kedaluwarsa. Silakan login ulang.";
      }
      const errorMessage = { 
        sender: 'ai', 
        text: errorText,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('chatLanguage', lang);
    setShowLangMenu(false);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-page-bg overflow-hidden relative">
      <SEO
        title="Chat Cak Jember - Asisten Wisata Kabupaten Jember"
        description="Konsultasi rencana liburan dan rekomendasi destinasi wisata Jember secara interaktif bersama asisten Cak Jember."
        url="https://jembertrip.vercel.app/rekomendasi"
      />
      
      {/* ===== SIDEBAR ===== */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-900/50 z-20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed md:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col h-full shadow-2xl md:shadow-none z-20"
            >
              <div className="p-5 border-b border-slate-100 flex-shrink-0 bg-white">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-extrabold text-slate-900 text-lg">Riwayat Chat</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden p-2 min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-full transition-colors"
                    aria-label="Tutup riwayat chat"
                  >
                    <X size={20} />
                  </button>
                </div>
                <button
                  onClick={handleNewChat}
                  className="ios-press w-full flex items-center justify-center gap-2 bg-rose-600 text-white py-3 min-h-[44px] rounded-2xl hover:bg-rose-700 transition-all text-sm font-bold shadow-md shadow-rose-600/20"
                >
                  <Plus size={18} /> Percakapan Baru
                </button>
              </div>

              <div className="flex-grow overflow-y-auto px-3 py-4 space-y-2 custom-scrollbar">
                {loadingSessions ? (
                  <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-slate-300 border-t-rose-600 rounded-full animate-spin"></div></div>
                ) : chatSessions.length === 0 ? (
                  <div className="text-center py-10 px-6"><p className="text-slate-500 text-sm">Belum ada riwayat chat.</p></div>
                ) : (
                  chatSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className={`group p-3.5 rounded-2xl cursor-pointer transition-all border ${
                        currentSessionId === session.id ? 'bg-rose-50/80 border-rose-200 shadow-xs' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                      }`}
                      onClick={() => loadChatSession(session.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-grow min-w-0">
                          <h3 className={`text-sm font-bold truncate ${currentSessionId === session.id ? 'text-rose-600' : 'text-slate-900'}`}>
                            {session.title || 'Percakapan Wisata'}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                            {formatSessionDate(session)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          disabled={deletingSessionId === session.id}
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 p-2 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-xl transition-all flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          aria-label="Hapus percakapan"
                        >
                          {deletingSessionId === session.id ? <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-center text-slate-500 font-semibold">
                Asisten Wisata Jember
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== MAIN CHAT AREA ===== */}
      <div className="flex-grow flex flex-col h-full w-full bg-page-bg relative">
        
        {/* HEADER CHAT: IPHONE LIQUID GLASS (z-10) */}
        <div className="liquid-glass border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 min-w-[44px] min-h-[44px] -ml-2 hover:bg-slate-100 rounded-full transition-colors md:hidden text-slate-700 flex items-center justify-center"
                aria-label="Buka riwayat chat"
              >
                <Menu size={22} />
              </button>
            )}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/20">
                <Bot size={22} />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">Cak Jember</h1>
              <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                Online • AI Assistant
              </p>
            </div>
          </div>

          {/* LANGUAGE SELECTOR */}
          <div className="relative">
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="liquid-glass-pill ios-press flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-full text-xs font-bold text-slate-800"
              aria-label="Pilih bahasa percakapan"
            >
              <Languages size={16} />
              <span className="uppercase">{language}</span>
            </button>
            
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-2 w-36 liquid-glass rounded-2xl overflow-hidden z-20 py-1">
                <button onClick={() => changeLanguage('id')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100/70 ${language === 'id' ? 'font-bold text-rose-600' : 'text-slate-800'}`}>Indonesia</button>
                <button onClick={() => changeLanguage('jowo')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100/70 ${language === 'jowo' ? 'font-bold text-rose-600' : 'text-slate-800'}`}>Jawa</button>
                <button onClick={() => changeLanguage('madura')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100/70 ${language === 'madura' ? 'font-bold text-rose-600' : 'text-slate-800'}`}>Madura</button>
              </div>
            )}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar scroll-smooth">
          <div className="max-w-3xl mx-auto w-full pb-4 space-y-5">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[95%] md:max-w-[80%] gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-auto shadow-xs border ${msg.sender === 'user' ? 'bg-white border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                      {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>

                    <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} min-w-0`}>
                      {/* Bubble Chat */}
                      <div className={`px-5 py-3.5 text-sm leading-relaxed shadow-xs relative break-words w-full ${
                        msg.sender === 'user'
                          ? 'bg-rose-600 text-white rounded-2xl rounded-br-xs'
                          : msg.isError
                            ? 'bg-red-50 text-red-700 border border-red-200 rounded-2xl rounded-bl-xs'
                            : 'liquid-card text-slate-900 rounded-2xl rounded-bl-xs'
                      }`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                            ol: ({...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                            li: ({...props}) => <li className="mb-1" {...props} />,
                            strong: ({...props}) => <span className="font-bold" {...props} />,
                            a: ({...props}) => <a className="underline hover:text-rose-200" target="_blank" rel="noopener noreferrer" {...props} />,
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                      
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 ml-1">
                          {msg.sources.map((src, i) => (
                            <span key={i} className="flex items-center gap-1 text-[10px] text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-xs">
                              <Info size={10} /> {src}
                            </span>
                          ))}
                        </div>
                      )}

                      {msg.sender === 'ai' && msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-4 w-full">
                          <p className="text-xs font-bold text-slate-700 mb-2 px-1 flex items-center gap-1">
                            <Sparkles size={12} className="text-amber-500" /> Rekomendasi Pilihan:
                          </p>
                          <div className="flex gap-3.5 overflow-x-auto pb-3 px-1 snap-x snap-mandatory max-w-full">
                            {msg.recommendations.map((rec, idx) => (
                              <Link 
                                key={idx} 
                                to={`/wisata/${rec.id}`}
                                onClick={() => {
                                  trackEvent('click_recommendation', {
                                    source: 'chatbot_rag',
                                    wisata_id: rec.id,
                                    recommendation_type: 'chatbot_rag',
                                    target_wisata_name: rec.nama_wisata
                                  });
                                }} 
                                className="snap-center flex-shrink-0 w-[230px] sm:w-60 liquid-card rounded-2xl overflow-hidden cursor-pointer group block"
                              >
                                <div className="h-32 bg-slate-100 relative overflow-hidden">
                                  <NgrokImage src={getImageUrl(rec.gambar)} alt={rec.nama_wisata} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  <div className="absolute top-2.5 left-2.5 liquid-glass-pill text-slate-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{rec.kategori}</div>
                                </div>
                                <div className="p-4">
                                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1.5 group-hover:text-rose-600 transition-colors">{rec.nama_wisata}</h4>
                                  <p className="text-xs text-slate-500 line-clamp-1 mb-3 flex items-center gap-1.5">
                                    <MapPin size={12} className="text-slate-400 shrink-0" />
                                    <span className="truncate">{rec.alamat}</span>
                                  </p>
                                  <span className="w-full bg-rose-50 text-rose-700 text-xs font-bold py-2 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all flex items-center justify-center gap-1 min-h-[36px]">
                                    Lihat Detail <ChevronRight size={12} />
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      <span className={`text-[10px] text-slate-500 mt-1 px-1 font-medium tabular-nums ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex-shrink-0 flex items-center justify-center mt-auto"><Bot size={16} /></div>
                  <div className="liquid-card px-4 py-3 rounded-2xl rounded-bl-xs flex items-center gap-1.5">
                    <span className="text-xs text-slate-600 font-medium mr-1">Mengetik</span>
                    <div className="flex gap-1">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT AREA (FIXED BOTTOM LIQUID GLASS DOCK - z-10) */}
        <div className="liquid-glass border-t border-slate-200/80 p-3 md:p-4 sticky bottom-0 z-10 safe-area-bottom">
          <div className="max-w-3xl mx-auto w-full">
            <form onSubmit={handleSend} className="relative flex items-center gap-2 sm:gap-3">
              {browserSupportsSpeechRecognition && (
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`ios-press p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all shrink-0 ${
                    listening 
                      ? 'bg-red-50 text-red-600 animate-pulse border border-red-200' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Tekan untuk bicara"
                  aria-label="Input suara"
                >
                  {listening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}

              <input 
                type="text" 
                placeholder={listening ? "Mendengarkan..." : "Tanya Cak Jember..."} 
                className={`w-full py-3.5 rounded-full bg-white border border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all text-base md:text-sm text-slate-900 placeholder-slate-400 font-medium min-h-[44px] ${browserSupportsSpeechRecognition ? 'px-4' : 'pl-5 pr-14'}`}
                style={{ fontSize: '16px' }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="ios-press p-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-rose-600/20 shrink-0 relative"
                aria-label="Kirim pesan"
              >
                <Send size={18} className={loading ? "opacity-0" : ""} />
                {loading && <div className="absolute inset-0 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
              </button>
            </form>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              Informasi tiket atau jam buka dapat berubah. Pastikan cek kontak resmi destinasi.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ChatPage;
