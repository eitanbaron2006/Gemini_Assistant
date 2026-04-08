import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AudioRecorder, AudioPlayer } from '@/lib/audio';

export function useLiveAPI() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{ text: string; isUser: boolean }[]>([]);

  const sessionRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const isMutedRef = useRef(false);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      isMutedRef.current = next;
      return next;
    });
  }, []);

  const updatePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(rate);
    }
  }, []);

  const updateVolume = useCallback((vol: number) => {
    setVolume(vol);
    if (playerRef.current) {
      playerRef.current.setVolume(vol);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close()).catch(() => {});
      sessionRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsMuted(false);
    isMutedRef.current = false;
  }, []);

  const connect = useCallback(async (voiceName: string = "Zephyr", language: 'he' | 'en' = 'he') => {
    if (isConnected || isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    setTranscript([]);
    setIsMuted(false);
    isMutedRef.current = false;

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set");
      }

      const ai = new GoogleGenAI({ apiKey });

      playerRef.current = new AudioPlayer();
      playerRef.current.init();
      playerRef.current.setPlaybackRate(playbackRate);
      playerRef.current.setVolume(volume);

      recorderRef.current = new AudioRecorder((base64Data) => {
        if (isMutedRef.current) return;
        if (sessionRef.current) {
          sessionRef.current.then((session: any) => {
            session.sendRealtimeInput({
              audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
            });
          });
        }
      });

      const langName = language === 'he' ? 'Hebrew' : 'English';
      const systemInstruction = `You are a helpful, conversational voice companion. You MUST speak ONLY in ${langName}. Keep your answers concise and conversational. Start the conversation by introducing yourself in ${langName}.`;

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            recorderRef.current?.start();
            
            // Send a trigger message to get the AI to introduce itself
            // Using a small timeout to ensure the session is ready to receive input
            setTimeout(() => {
              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({ text: "Please introduce yourself" });
              });
            }, 500);
          },
          onmessage: (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData)?.inlineData?.data;
            if (base64Audio && playerRef.current) {
              playerRef.current.playBase64Pcm(base64Audio);
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              playerRef.current?.interrupt();
            }

            // Handle transcription (model)
            const modelTurn = message.serverContent?.modelTurn;
            const modelText = modelTurn?.parts?.map(p => p.text).filter(Boolean).join(" ") || (message as any).serverContent?.outputTranscription?.text;
            if (modelText) {
              setTranscript(prev => {
                const last = prev[prev.length - 1];
                // If the last message was also from model, append to it (streaming)
                if (last && !last.isUser) {
                  return [...prev.slice(0, -1), { ...last, text: last.text + " " + modelText }];
                }
                return [...prev, { text: modelText, isUser: false }];
              });
            }

            // Handle transcription (user)
            const userTurn = (message.serverContent as any)?.userTurn;
            const userText = userTurn?.parts?.map((p: any) => p.text).filter(Boolean).join(" ") || (message as any).serverContent?.inputTranscription?.text;
            if (userText) {
              setTranscript(prev => {
                const last = prev[prev.length - 1];
                // If the last message was also from user, append to it (streaming/correction)
                if (last && last.isUser) {
                  return [...prev.slice(0, -1), { ...last, text: last.text + " " + userText }];
                }
                return [...prev, { text: userText, isUser: true }];
              });
            }
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            setError(err.message || "An error occurred");
            disconnect();
          },
          onclose: () => {
            disconnect();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Connection failed:", err);
      setError(err.message || "Failed to connect");
      setIsConnecting(false);
      disconnect();
    }
  }, [isConnected, isConnecting, disconnect, playbackRate, volume]);

  return {
    isConnected,
    isConnecting,
    isMuted,
    playbackRate,
    volume,
    error,
    transcript,
    connect,
    disconnect,
    toggleMute,
    updatePlaybackRate,
    updateVolume
  };
}
