'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Loader2, Sparkles, Volume2, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveAPI } from '@/hooks/use-live-api';

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

export default function Home() {
  const { isConnected, isConnecting, isMuted, playbackRate, volume, error, transcript, connect, disconnect, toggleMute, updatePlaybackRate, updateVolume } = useLiveAPI();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [language, setLanguage] = useState<'he' | 'en'>('he');
  const [showChat, setShowChat] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isRTL = language === 'he';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

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

  return (
    <main className="relative min-h-screen w-full overflow-y-auto flex flex-col items-center justify-start font-sans bg-[#0a0505] scroll-smooth pb-20">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_#3a1510_0%,_transparent_60%),_radial-gradient(circle_at_10%_80%,_var(--color-accent)_0%,_transparent_50%)] blur-[60px] opacity-80" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-3xl px-4 py-8 flex flex-col items-center pb-32">
        
        {/* Header */}
        <div className="text-center mb-4 mt-2 relative w-full flex-shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-2 mb-3 rounded-full bg-[var(--color-glass-surface)] border border-[var(--color-glass-border)] backdrop-blur-xl"
          >
            <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-light tracking-tight mb-4"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Voice Companion
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-lg tracking-wide uppercase text-sm font-medium"
          >
            Powered by Gemini 3.1 Live
          </motion.p>
        </div>

        {/* Settings Panel (Accordion) */}
        <div className="w-full max-w-md mb-6 z-20">
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--color-glass-surface)] border border-[var(--color-glass-border)] backdrop-blur-xl transition-all hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Settings2 className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-sm font-medium uppercase tracking-widest text-white/80">Settings / הגדרות</span>
            </div>
            {isSettingsOpen ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
          </button>

          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-5 rounded-3xl bg-[var(--color-glass-surface)] border border-[var(--color-glass-border)] backdrop-blur-xl flex flex-col gap-5">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-widest text-white/60 mb-3 text-center">Language / שפה</h3>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleLanguageChange('he')}
                          className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${language === 'he' ? 'bg-[var(--color-accent)] text-white shadow-[0_0_15px_rgba(255,78,0,0.4)]' : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'}`}
                        >
                          עברית
                        </button>
                        <button
                          onClick={() => handleLanguageChange('en')}
                          className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${language === 'en' ? 'bg-[var(--color-accent)] text-white shadow-[0_0_15px_rgba(255,78,0,0.4)]' : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'}`}
                        >
                          English
                        </button>
                      </div>
                    </div>

                    <div className="h-px bg-white/10 w-full" />

                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-widest text-white/60 mb-3 text-center">Select Voice</h3>
                      <div className="flex flex-wrap justify-center gap-2">
                        {VOICES.map(voice => (
                          <button
                            key={voice}
                            onClick={() => handleVoiceChange(voice)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedVoice === voice ? 'bg-[var(--color-accent)] text-white shadow-[0_0_15px_rgba(255,78,0,0.4)]' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'}`}
                          >
                            {voice}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-medium uppercase tracking-widest text-white/60">Volume</h3>
                      <span className="text-white/80 font-mono text-xs">{Math.round(volume * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={volume}
                      onChange={(e) => updateVolume(parseFloat(e.target.value))}
                      className="w-full accent-[var(--color-accent)] bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-medium uppercase tracking-widest text-white/60">Speech Speed</h3>
                      <span className="text-white/80 font-mono text-xs">{playbackRate.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.0" 
                      step="0.1" 
                      value={playbackRate}
                      onChange={(e) => updatePlaybackRate(parseFloat(e.target.value))}
                      className="w-full accent-[var(--color-accent)] bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                    <div className="flex justify-between text-white/40 text-[10px] mt-2 font-mono">
                      <span>0.5x</span>
                      <span>1.0x</span>
                      <span>2.0x</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <h3 className="text-xs font-medium uppercase tracking-widest text-white/60">Show Chat History</h3>
                    <button 
                      onClick={() => setShowChat(!showChat)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${showChat ? 'bg-[var(--color-accent)]' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${showChat ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Transcript Area */}
        {showChat && (
          <div 
            className="w-full max-w-2xl flex flex-col relative my-4 rounded-3xl border border-white/5 bg-white/[0.02] h-[350px] md:h-[400px] lg:h-[450px] overflow-hidden"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div 
              className="flex-1 overflow-y-auto px-4 py-8 scrollbar-hide"
              ref={scrollRef}
            >
              <div className="flex flex-col gap-4">
                {transcript.length === 0 && isConnected && (
                  <div className="flex flex-col items-center justify-center py-20 text-white/30 italic font-serif text-lg">
                    <motion.div
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {isRTL ? 'מקשיב לקולך...' : 'Listening for your voice...'}
                    </motion.div>
                  </div>
                )}
                {transcript.map((t, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`flex ${t.isUser ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg ${t.isUser ? 'bg-[var(--color-accent)] text-white' : 'bg-white/10 border border-white/10 backdrop-blur-md text-white'} ${isRTL ? 'text-right' : 'text-left'}`}>
                      <p className="text-base md:text-lg leading-relaxed font-serif">{t.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2 z-20 pb-2 pt-2 w-full">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-xs mb-2 backdrop-blur-md">
              {error}
            </div>
          )}

          <div className="flex items-center gap-6">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="group relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-black hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isConnecting ? (
                  <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
                ) : (
                  <Mic className="w-6 h-6 md:w-8 md:h-8" />
                )}
                <div className="absolute inset-0 rounded-full border border-white/20 scale-150 opacity-0 group-hover:animate-ping pointer-events-none" />
              </button>
            ) : (
              <div className="flex items-center gap-6">
                <button
                  onClick={toggleMute}
                  className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                >
                  {isMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[var(--color-accent)]/20 animate-ping scale-150 pointer-events-none" />
                  <button
                    onClick={disconnect}
                    className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--color-accent)] text-white hover:opacity-90 transition-all shadow-[0_0_40px_rgba(255,78,0,0.4)]"
                  >
                    <Square className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-white/40 text-[10px] uppercase tracking-widest font-mono mt-2">
            {isConnecting ? 'Connecting...' : isConnected ? 'Live Session Active' : 'Tap to Start'}
          </div>
        </div>
      </div>
    </main>
  );
}
