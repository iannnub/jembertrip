// src/pages/ChatPage.jsx

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
// Import Icon
import { Send, Bot, User, Info, Sparkles, Menu, X, Plus, Trash2, ChevronRight, Mic, MicOff, Languages } from 'lucide-react';
// Import Animasi
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
// Import Markdown Renderer
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function ChatPage() {
  // ===== SIDEBAR STATE =====
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  // ===== CHAT STATE =====
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Halo! 👋 Saya Cak Jember. Mau cari wisata apa hari ini? Atau hanya butuh rekomendasi tempat? atau hanya ingin bertanya tanya terkait dengan wisata yang ada dijember?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // [MODIFIKASI] Load bahasa dari LocalStorage saat awal, default 'id'
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
        setInput(transcript);
    }
  }, [transcript]);

  const handleMicClick = () => {
      if (listening) {
          SpeechRecognition.stopListening();
      } else {
          resetTranscript();
          // Sesuaikan bahasa recognition dengan pilihan user
          const langCode = language === 'id' ? 'id-ID' : (language === 'jowo' ? 'jv-ID' : 'id-ID');
          SpeechRecognition.startListening({ continuous: true, language: langCode });
      }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getImageUrl = (gambarPath) => {
      if (!gambarPath) return "https://placehold.co/400x300?text=No+Image";
      if (gambarPath.startsWith('http')) return gambarPath; 
      return `/${gambarPath}`; 
  };

  useEffect(() => {
    if (token) {
      loadChatSessions();
    }
    const handleResize = () => {
        if (window.innerWidth >= 768) {
            setSidebarOpen(true);
        } else {
            setSidebarOpen(false);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadChatSessions = async () => {
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
  };

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
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        text: 'Halo! 👋 Saya Cak Jember. Mau cari wisata apa hari ini? Atau butuh rekomendasi kuliner?',
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
    setInput(""); 
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/chat`, {
        question: userMessage.text,
        session_id: currentSessionId,
        language: language // Kirim bahasa yang tersimpan
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
      let errorText = "Waduh, sori banget Bro! Server lagi pusing nih 😵 Coba tanya lagi nanti ya.";
      if (err.response?.status === 401) {
        errorText = "❌ Token expired. Silakan login ulang.";
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

  // [MODIFIKASI] Fungsi ganti bahasa + Simpan ke Storage
  const changeLanguage = (lang) => {
      setLanguage(lang);
      localStorage.setItem('chatLanguage', lang); // Simpan permanen di browser
      setShowLangMenu(false);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-page-bg overflow-hidden relative">
      
      {/* ===== SIDEBAR ===== */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="md:hidden fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed md:static inset-y-0 left-0 w-72 bg-white border-r border-gray-200 flex flex-col h-full shadow-2xl md:shadow-none z-[70]"
            >
              <div className="p-5 border-b border-gray-100 flex-shrink-0 bg-white">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-text-main text-lg">Riwayat Chat</h2>
                  <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-red-50 text-text-muted hover:text-red-500 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl hover:bg-primary-soft active:scale-95 transition-all text-sm font-bold shadow-lg shadow-primary/20">
                  <Plus size={18} /> Percakapan Baru
                </button>
              </div>

              <div className="flex-grow overflow-y-auto px-3 py-4 space-y-2 custom-scrollbar">
                {loadingSessions ? (
                  <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div></div>
                ) : chatSessions.length === 0 ? (
                  <div className="text-center py-10 px-6"><p className="text-text-muted text-sm">Belum ada riwayat chat.</p></div>
                ) : (
                  chatSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className={`group p-3.5 rounded-xl cursor-pointer transition-all border ${
                        currentSessionId === session.id ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
                      }`}
                      onClick={() => loadChatSession(session.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-grow min-w-0">
                          <h3 className={`text-sm font-semibold truncate ${currentSessionId === session.id ? 'text-primary' : 'text-text-main'}`}>{session.title}</h3>
                          <p className="text-[10px] text-text-muted mt-1">{new Date(session.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <button onClick={(e) => handleDeleteSession(session.id, e)} disabled={deletingSessionId === session.id} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-all flex-shrink-0 md:group-hover:opacity-100 focus:opacity-100">
                          {deletingSessionId === session.id ? <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-center text-text-muted font-medium">Cak Jember AI - buat ngobrol anda</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== MAIN CHAT AREA ===== */}
      <div className="flex-grow flex flex-col h-full w-full bg-page-bg relative">
        
        {/* HEADER CHAT */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors md:hidden text-gray-600"><Menu size={24} /></button>}
            <div className="relative">
                {/* Avatar Bot: Gradient Pink-Orange */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/20"><Bot size={22} /></div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
            </div>
            <div>
                <h1 className="text-base font-bold text-text-main leading-tight">Cak Jember</h1>
                <p className="text-[10px] text-secondary font-medium bg-secondary/10 px-2 py-0.5 rounded-full inline-block mt-0.5">Online • AI Assistant</p>
            </div>
          </div>

          {/* LANGUAGE SELECTOR */}
          <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-xs font-bold text-text-main"
              >
                  <Languages size={16} />
                  <span className="uppercase">{language}</span>
              </button>
              
              {showLangMenu && (
                  <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                      <button onClick={() => changeLanguage('id')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${language === 'id' ? 'font-bold text-primary' : 'text-text-main'}`}>Indonesia</button>
                      <button onClick={() => changeLanguage('jowo')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${language === 'jowo' ? 'font-bold text-primary' : 'text-text-main'}`}>Jawa</button>
                      <button onClick={() => changeLanguage('madura')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${language === 'madura' ? 'font-bold text-primary' : 'text-text-main'}`}>Madura</button>
                  </div>
              )}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar scroll-smooth">
          <div className="max-w-3xl mx-auto w-full pb-4">
              <AnimatePresence>
                  {messages.map((msg, index) => (
                      <motion.div 
                          key={index} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }}
                          className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                          <div className={`flex max-w-[95%] md:max-w-[80%] gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                              {/* Avatar */}
                              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-auto shadow-sm border ${msg.sender === 'user' ? 'bg-white border-primary/20 text-primary' : 'bg-secondary/10 border-secondary/20 text-secondary'}`}>
                                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                              </div>

                              <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} min-w-0`}>
                                  {/* Bubble Chat */}
                                    <div className={`px-5 py-3.5 text-sm leading-relaxed shadow-sm relative break-words w-full ${
                                      msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-none' // <--- GANTI DI SINI
                                        : msg.isError
                                          ? 'bg-red-50 text-red-600 border border-red-100 rounded-2xl rounded-bl-none'
                                          : 'bg-white text-text-main border border-gray-200 rounded-2xl rounded-bl-none'
                                    }`}>
                                      <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                            ul: ({...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                            ol: ({...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                            li: ({...props}) => <li className="mb-1" {...props} />,
                                            strong: ({...props}) => <span className="font-bold" {...props} />,
                                            a: ({...props}) => <a className="underline hover:text-blue-200" target="_blank" rel="noopener noreferrer" {...props} />,
                                        }}
                                      >
                                        {msg.text}
                                      </ReactMarkdown>
                                  </div>
                                  
                                  {msg.sources && msg.sources.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1.5 ml-1">
                                          {msg.sources.map((src, i) => (
                                              <span key={i} className="flex items-center gap-1 text-[10px] text-text-muted bg-white border border-gray-200 px-2 py-1 rounded-full shadow-sm"><Info size={10} /> {src}</span>
                                          ))}
                                      </div>
                                  )}

                                  {msg.sender === 'ai' && msg.recommendations && msg.recommendations.length > 0 && (
                                      <div className="mt-4 w-full -ml-2 md:ml-0">
                                          <p className="text-xs font-bold text-text-muted mb-2 px-2 flex items-center gap-1"><Sparkles size={12} className="text-accent" /> Rekomendasi Pilihan:</p>
                                          <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x snap-mandatory no-scrollbar w-[85vw] md:w-full">
                                              {msg.recommendations.map((rec, idx) => (
                                                  <div key={idx} onClick={() => window.location.href = `/wisata/${rec.id}`} className="snap-center flex-shrink-0 w-[240px] md:w-56 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
                                                      <div className="h-32 bg-gray-100 relative overflow-hidden">
                                                           <img src={getImageUrl(rec.gambar)} alt={rec.nama_wisata} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                                                           <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg">{rec.kategori}</div>
                                                      </div>
                                                      <div className="p-3.5">
                                                          <h4 className="font-bold text-text-main text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">{rec.nama_wisata}</h4>
                                                          <p className="text-xs text-text-muted line-clamp-1 mb-3 flex items-center gap-1">📍 {rec.alamat}</p>
                                                          <button className="w-full bg-primary/5 text-primary text-xs font-bold py-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center gap-1">Lihat Detail <ChevronRight size={12} /></button>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                                  <span className={`text-[10px] text-text-muted mt-1 px-1 opacity-70 font-medium ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</span>
                              </div>
                          </div>
                      </motion.div>
                  ))}
              </AnimatePresence>

              {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
                      <div className="flex gap-3 max-w-[85%]">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 border border-secondary/20 text-secondary flex-shrink-0 flex items-center justify-center mt-auto"><Bot size={16} /></div>
                          <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm flex items-center gap-1.5">
                              <span className="text-xs text-text-muted font-medium mr-1">Ngetik</span>
                              <div className="flex gap-1">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                              </div>
                          </div>
                      </div>
                  </motion.div>
              )}
              <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT AREA (FIXED BOTTOM) */}
        <div className="bg-white border-t border-gray-200 p-3 md:p-4 sticky bottom-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-safe">
          <div className="max-w-3xl mx-auto w-full">
              <form onSubmit={handleSend} className="relative flex items-center gap-3">
                  
                  {browserSupportsSpeechRecognition && (
                      <button
                        type="button"
                        onClick={handleMicClick}
                        className={`p-3 rounded-full transition-all ${
                            listening 
                            ? 'bg-red-50 text-red-500 animate-pulse border border-red-200' 
                            : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                        }`}
                        title="Tekan untuk bicara"
                      >
                          {listening ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>
                  )}

                  <input 
                      type="text" 
                      placeholder={listening ? "Mendengarkan..." : "Tanya Cak Jember..."} 
                      className={`w-full py-3.5 rounded-full bg-gray-100 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm text-text-main placeholder-gray-400 font-medium ${browserSupportsSpeechRecognition ? 'px-4' : 'pl-5 pr-14'}`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={loading}
                  />
                  
                  <button 
                      type="submit" 
                      disabled={loading || !input.trim()}
                      className="p-3 bg-primary text-white rounded-full hover:bg-primary-soft active:scale-90 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                  >
                      <Send size={18} className={loading ? "opacity-0" : ""} />
                      {loading && <div className="absolute inset-0 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                  </button>
              </form>
              <p className="text-center text-[10px] text-gray-400 mt-2">✨ AI terkadang bisa salah. Cek info lagi ya! salam dari iannnub</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ChatPage;