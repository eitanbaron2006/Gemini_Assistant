'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Loader2, Sparkles, Volume2, ChevronDown, ChevronUp, Settings2, X, MessageSquare, LogOut, History, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveAPI } from '@/hooks/use-live-api';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, db, User, handleFirestoreError, OperationType } from '@/firebase';
import { doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

export default function Home() {
  const { isConnected, isConnecting, isMuted, playbackRate, volume, error, transcript, connect, disconnect, toggleMute, updatePlaybackRate, updateVolume } = useLiveAPI();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [language, setLanguage] = useState<'he' | 'en'>('he');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  const isRTL = language === 'he';

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (currentUser) {
        // Sync user profile
        const userRef = doc(db, 'users', currentUser.uid);
        setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          createdAt: Timestamp.now()
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`));
      }
    });
    return () => unsubscribe();
  }, []);

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-save conversation when disconnected and transcript exists
  useEffect(() => {
    if (!isConnected && transcript.length > 0 && user) {
      const saveConversation = async () => {
        try {
          await addDoc(collection(db, 'conversations'), {
            userId: user.uid,
            title: transcript[0]?.text?.slice(0, 30) + '...',
            transcript: transcript.map(t => ({
              ...t,
              timestamp: Timestamp.now()
            })),
            createdAt: Timestamp.now(),
            language: language
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'conversations');
        }
      };
      saveConversation();
    }
  }, [isConnected, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcript]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (isConnected) disconnect();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleConnect = () => {
    connect(selectedVoice, language);
  };

  const handleVoiceChange = (voice: string) => {
    setSelectedVoice(voice);
    if (isConnected) {
      disconnect();
      setTimeout(() => {
        connect(voice, language);
      }, 500);
    }
  };

  const handleLanguageChange = (lang: 'he' | 'en') => {
    setLanguage(lang);
    if (isConnected) {
      disconnect();
      setTimeout(() => {
        connect(selectedVoice, lang);
      }, 500);
    }
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a0505] flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-[var(--color-accent)] to-[#3a1510] flex items-center justify-center shadow-[0_0_60px_rgba(255,78,0,0.3)]">
            <Sparkles className="w-16 h-16 text-white" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-[2.5rem] bg-[var(--color-accent)] blur-2xl -z-10"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <h1 className="text-4xl font-serif tracking-tight mb-2">Companion</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-bold">Live AI Experience</p>
        </motion.div>

        <div className="absolute bottom-12 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent"
          />
        </div>
      </div>
    );
  }

  if (!user && !isAuthLoading) {
    return (
      <main className="relative h-[100dvh] w-full overflow-hidden flex flex-col font-sans bg-[#0a0505] text-white select-none max-w-md mx-auto">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#3a1510_0%,_transparent_60%)] opacity-60" />
        </div>
        
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-3xl flex items-center justify-center mb-8 shadow-2xl">
            <UserIcon className="w-10 h-10 text-[var(--color-accent)]" />
          </div>
          <h2 className="text-3xl font-serif mb-4">Welcome Back</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-12">
            Sign in to access your personal AI companion and save your conversation history.
          </p>
          
          <button
            onClick={handleLogin}
            className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden flex flex-col font-sans bg-[#0a0505] text-white select-none max-w-md mx-auto shadow-[0_0_100px_rgba(0,0,0,0.5)]">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_#3a1510_0%,_transparent_50%),_radial-gradient(circle_at_80%_80%,_var(--color-accent)_0%,_transparent_40%)] blur-[80px] opacity-60" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Header */}
      <header className="relative z-20 flex-shrink-0 px-6 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[var(--color-accent)] opacity-20 group-hover:opacity-30 transition-opacity" />
            <Sparkles className="w-6 h-6 text-[var(--color-accent)] relative z-10" />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight font-serif">Companion</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Live AI Experience</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-white/20'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'text-green-400' : 'text-white/20'}`}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Transcript Area (Scrollable Middle) */}
      <section 
        className="relative z-10 flex-1 overflow-y-auto px-6 py-4 scroll-smooth scrollbar-hide"
        ref={scrollRef}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-col gap-6 min-h-full justify-end pb-12">
          {transcript.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 opacity-40">
              <div className="w-16 h-16 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-lg font-serif italic leading-relaxed">
                {isRTL ? 'התחל שיחה כדי לראות את התמלול כאן' : 'Start a conversation to see the transcript here'}
              </p>
            </div>
          )}
          
          {transcript.map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${t.isUser ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
            >
              <div className={`max-w-[85%] rounded-[2rem] px-6 py-4 shadow-2xl backdrop-blur-3xl ${
                t.isUser 
                  ? 'bg-[var(--color-accent)] text-white rounded-br-none' 
                  : 'bg-white/10 border border-white/10 text-white/90 rounded-bl-none'
              } ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-lg leading-relaxed font-serif">{t.text}</p>
              </div>
            </motion.div>
          ))}
          
          {isConnected && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: [8, 24, 8],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{ 
                      duration: 0.8, 
                      repeat: Infinity, 
                      delay: i * 0.15,
                      ease: "easeInOut"
                    }}
                    className="w-1 rounded-full bg-[var(--color-accent)]"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Menu / Navigation */}
      <nav className="relative z-30 flex-shrink-0 px-6 pb-10 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          {/* Settings Toggle */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl flex items-center justify-center transition-all active:scale-90"
          >
            <Settings2 className="w-6 h-6 text-white/60" />
          </button>

          {/* Main Action Button */}
          <div className="relative flex-1 flex justify-center">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all disabled:opacity-50"
              >
                {isConnecting ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleMute}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                    isMuted ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-white/5 border border-white/10 text-white'
                  }`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                
                <button
                  onClick={disconnect}
                  className="w-20 h-20 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center shadow-[0_0_50px_rgba(255,78,0,0.4)] active:scale-95 transition-all"
                >
                  <Square className="w-6 h-6 fill-current" />
                </button>
              </div>
            )}
          </div>

          {/* Language Indicator / Quick Toggle */}
          <button 
            onClick={() => handleLanguageChange(language === 'he' ? 'en' : 'he')}
            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl flex items-center justify-center text-xs font-bold transition-all active:scale-90"
          >
            {language === 'he' ? 'HE' : 'EN'}
          </button>
        </div>
      </nav>

      {/* Settings Overlay (Bottom Sheet Style) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-[#121212] border-t border-white/10 rounded-t-[3rem] px-8 pt-4 pb-12"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-serif">{isRTL ? 'הגדרות' : 'Settings'}</h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Language Selection */}
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Language / שפה</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleLanguageChange('he')}
                      className={`py-4 rounded-2xl text-sm font-bold transition-all ${language === 'he' ? 'bg-[var(--color-accent)] text-white' : 'bg-white/5 border border-white/10 text-white/60'}`}
                    >
                      עברית
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`py-4 rounded-2xl text-sm font-bold transition-all ${language === 'en' ? 'bg-[var(--color-accent)] text-white' : 'bg-white/5 border border-white/10 text-white/60'}`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Voice Selection */}
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Voice Model</h3>
                  <div className="flex flex-wrap gap-2">
                    {VOICES.map(voice => (
                      <button
                        key={voice}
                        onClick={() => handleVoiceChange(voice)}
                        className={`px-6 py-3 rounded-full text-xs font-bold transition-all ${selectedVoice === voice ? 'bg-white text-black' : 'bg-white/5 border border-white/10 text-white/60'}`}
                      >
                        {voice}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Volume</h3>
                      <span className="text-xs font-mono">{Math.round(volume * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={volume}
                      onChange={(e) => updateVolume(parseFloat(e.target.value))}
                      className="w-full accent-[var(--color-accent)] bg-white/10 rounded-lg appearance-none h-2 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Speed</h3>
                      <span className="text-xs font-mono">{playbackRate.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="2.0" step="0.1" value={playbackRate}
                      onChange={(e) => updatePlaybackRate(parseFloat(e.target.value))}
                      className="w-full accent-[var(--color-accent)] bg-white/10 rounded-lg appearance-none h-2 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
