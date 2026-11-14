import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  X,
  Volume2,
  VolumeX,
  Camera,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  Activity,
  Layers,
  MessageSquare,
  Radio,
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { apiUrl } from '../../utils/platform';

interface LiveConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExchange: (userMsg: ChatMessage, assistantMsg: ChatMessage) => void;
  theme: 'light' | 'dark' | 'system';
  activeModelName?: string;
}

export const LiveConversationModal: React.FC<LiveConversationModalProps> = ({
  isOpen,
  onClose,
  onSaveExchange,
  theme,
  activeModelName = 'Automate-X1 · Gemini 4 Hydrogen Live',
}) => {
  // Mode: 'orb' (ChatGPT Voice style) or 'camera' (Gemini Live Multimodal)
  const [viewMode, setViewMode] = useState<'orb' | 'camera'>('orb');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Conversation state
  const [state, setState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [statusMessage, setStatusMessage] = useState('Listening to your voice...');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(16).fill(10));
  const [isScanning, setIsScanning] = useState(false);
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null);

  // Media references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const lastTranscriptRef = useRef<string>('');
  const conversationHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // Stop TTS immediately
  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Speak AI text aloud
  const speakText = useCallback(
    (text: string) => {
      if (isAudioMuted || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Pick natural modern voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Ava'))) ||
        voices.find((v) => v.lang.startsWith('en'));
      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onstart = () => {
        setState('speaking');
        setStatusMessage('Automate AI is speaking...');
      };

      utterance.onend = () => {
        setState('listening');
        setStatusMessage('Listening to your voice...');
      };

      utterance.onerror = () => {
        setState('listening');
        setStatusMessage('Listening to your voice...');
      };

      window.speechSynthesis.speak(utterance);
    },
    [isAudioMuted]
  );

  // Capture video frame from camera
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = Math.min(video.videoWidth, 800);
    canvas.height = (canvas.width / video.videoWidth) * video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [isCameraActive]);

  // Send query to server /api/live-analyze
  const handleQuery = useCallback(
    async (spokenText: string) => {
      if (state === 'thinking') return;
      stopSpeech();
      setState('thinking');
      setStatusMessage('Analyzing...');

      const frameBase64 = isCameraActive ? captureFrame() : null;
      if (frameBase64) {
        setCapturedThumbnail(frameBase64);
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 900);
      }

      const promptToSend = spokenText.trim() || (frameBase64 ? 'What is in front of the camera right now?' : 'Hello');

      try {
        const res = await fetch(apiUrl('/api/live-analyze'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptToSend,
            imageBase64: frameBase64,
            history: conversationHistoryRef.current,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();
        const reply = data.text || "I'm listening and tracking your camera feed clearly.";
        setAiResponse(reply);

        // Record history
        conversationHistoryRef.current.push({ role: 'user', content: promptToSend });
        conversationHistoryRef.current.push({ role: 'assistant', content: reply });

        // Save exchange to parent conversation thread
        const now = new Date().toISOString();
        const userMsg: ChatMessage = {
          id: `live-usr-${Date.now()}`,
          role: 'user',
          content: promptToSend,
          timestamp: now,
          attachments: frameBase64
            ? [
                {
                  name: `Live_Camera_Frame_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`,
                  type: 'image/jpeg',
                  mimeType: 'image/jpeg',
                  base64: frameBase64,
                  dataUrl: frameBase64,
                },
              ]
            : undefined,
        };

        const assistantMsg: ChatMessage = {
          id: `live-ai-${Date.now() + 1}`,
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
          model: data.model || activeModelName,
        };

        onSaveExchange(userMsg, assistantMsg);

        // Speak aloud
        speakText(reply);
      } catch (err: any) {
        console.error('Live conversation analyze failed:', err);
        const fallbackMsg = "I had a quick glitch connecting to the live neural model. Could you please repeat that?";
        setAiResponse(fallbackMsg);
        speakText(fallbackMsg);
      }
    },
    [state, isCameraActive, captureFrame, onSaveExchange, speakText, stopSpeech, activeModelName]
  );

  // Initialize Microphone & Audio Frequency Visualizer
  const initAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // Realtime Audio Visualizer Loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume level (0 - 100)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        // Top 16 frequency bands for the waveform bars
        const bands: number[] = [];
        const step = Math.floor(bufferLength / 16) || 1;
        for (let i = 0; i < 16; i++) {
          bands.push(Math.max(8, Math.round((dataArray[i * step] || 0) * 0.4)));
        }
        setFrequencyData(bands);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      animFrameRef.current = requestAnimationFrame(updateMeter);
    } catch (err) {
      console.warn('Microphone audio context initialization failed:', err);
    }
  }, []);

  // Initialize Camera stream
  const startCamera = useCallback(
    async (facing: 'user' | 'environment') => {
      try {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
        setViewMode('camera');
      } catch (err) {
        console.error('Camera stream access failed:', err);
        setIsCameraActive(false);
      }
    },
    []
  );

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setViewMode('orb');
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setState((curr) => (curr === 'speaking' || curr === 'thinking' ? curr : 'listening'));
      };

      recognition.onresult = (event: any) => {
        // If AI is currently speaking, user speech interrupts AI
        if (window.speechSynthesis.speaking) {
          stopSpeech();
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        const combined = (final || interim).trim();
        if (combined) {
          setUserTranscript(combined);
          lastTranscriptRef.current = combined;
          setState('listening');
          setStatusMessage('Listening...');

          // Silence timeout: auto-submit query after 1.4s of quiet
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (lastTranscriptRef.current.trim().length > 1) {
              const query = lastTranscriptRef.current;
              lastTranscriptRef.current = '';
              handleQuery(query);
            }
          }, 1400);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning:', event.error);
      };

      recognition.onend = () => {
        // Auto restart if modal still open and not muted
        if (isOpen && !isMicMuted) {
          try {
            recognition.start();
          } catch {}
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition start failed:', e);
      }
    }

    initAudio();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      stopCamera();
      stopSpeech();
    };
  }, [isOpen, isMicMuted, initAudio, stopCamera, stopSpeech, handleQuery]);

  // Handle Close
  const handleClose = () => {
    stopSpeech();
    stopCamera();
    onClose();
  };

  // Flip Camera
  const toggleFacingMode = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startCamera(next);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-2xl"
        >
          <canvas ref={canvasRef} className="hidden" />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950/75 text-white border border-white/20 backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.28),0_28px_72px_rgba(0,0,0,0.75)] ${
              isFullscreen ? 'fixed inset-0 rounded-none' : 'sm:max-w-4xl sm:h-[88vh] sm:rounded-[32px]'
            }`}
          >
            {/* Top Bar Navigation */}
            <div className="flex flex-wrap items-center justify-between px-3 sm:px-6 py-3 sm:py-4 gap-2 z-20 border-b border-white/15 bg-white/[0.04] backdrop-blur-xl">
              {/* Left: Branding & Live Badge */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-white">
                    Live
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="text-violet-300">✦</span>
                  <span>{activeModelName}</span>
                </div>
              </div>

              {/* Center: Mode Switcher Droplet Pills */}
              <div className="flex items-center p-1 rounded-full bg-white/10 border border-white/15 text-[11px] sm:text-xs">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    stopCamera();
                    setViewMode('orb');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    viewMode === 'orb'
                      ? 'liquid-glass-cta'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Voice Orb</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    startCamera(facingMode);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    viewMode === 'camera'
                      ? 'liquid-glass-cta'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Vision</span>
                </motion.button>
              </div>

              {/* Right: Controls & Close */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="hidden sm:flex w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 items-center justify-center transition-colors cursor-pointer"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="End Live Session"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              </div>
            </div>

            {/* Center Stage: Voice Orb or Camera Viewport */}
            <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden p-4 sm:p-6">
              {/* Viewport 1: Gemini Live Camera Multimodal Feed */}
              {viewMode === 'camera' && (
                <div className="relative w-full h-full max-w-2xl max-h-[520px] rounded-[26px] overflow-hidden border border-white/20 bg-black shadow-2xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      isCameraActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Laser Scanning Animation when AI analyzes frame */}
                  {isScanning && (
                    <motion.div
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      transition={{ duration: 0.9, ease: 'linear' }}
                      className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-20"
                    />
                  )}

                  {/* HUD Overlay */}
                  <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 p-3 sm:p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono text-cyan-300">
                      <span className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-md border border-cyan-400/35">
                        <Activity className="w-3.5 h-3.5 animate-pulse shrink-0" />
                        <span className="truncate">MULTIMODAL VISION</span>
                      </span>
                      <span className="bg-black/50 px-2.5 py-1 rounded-full border border-white/15 text-slate-200 backdrop-blur-md shrink-0">
                        {facingMode === 'user' ? 'FRONT' : 'REAR'}
                      </span>
                    </div>

                    {/* Center Target Reticle */}
                    <div className="self-center flex items-center justify-center w-24 h-24 border border-cyan-400/30 rounded-2xl relative">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
                    </div>

                    {/* Bottom Viewport Hint */}
                    <div className="flex items-center justify-between gap-2 text-xs text-white/85 bg-black/55 p-2 rounded-2xl backdrop-blur-xl border border-white/15">
                      <span className="truncate text-[11px] pl-1">Point camera at any object or screen</span>
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => handleQuery('Describe what you see in front of the camera')}
                        className="pointer-events-auto px-3 py-1 rounded-full bg-cyan-500/25 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-400/40 font-medium transition-colors flex items-center gap-1 text-[11px] shrink-0 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                        Analyze View
                      </motion.button>
                    </div>
                  </div>

                  {/* Flip camera control */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleFacingMode}
                    className="absolute top-12 right-3 sm:top-4 sm:right-4 z-30 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/25 backdrop-blur-md flex items-center justify-center transition-all shadow-md cursor-pointer"
                    title="Switch Front/Rear Camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.button>
                </div>
              )}

              {/* Viewport 2: Circular Liquid Glass AI Voice Crystal Orb (inspired by Reference Video 2) */}
              {viewMode === 'orb' && (
                <div className="relative flex flex-col items-center justify-center my-auto">
                  {/* Soft Atmospheric Ambient Glow Behind Crystal Sphere */}
                  <motion.div
                    animate={{
                      scale:
                        state === 'speaking'
                          ? [1.05, 1.24, 1.1]
                          : state === 'thinking'
                          ? [1, 1.15, 1]
                          : 0.95 + (audioLevel / 100) * 0.28,
                      opacity: state === 'idle' ? 0.35 : 0.58,
                    }}
                    transition={{
                      repeat: state === 'speaking' || state === 'thinking' ? Infinity : 0,
                      duration: 2.6,
                      ease: 'easeInOut',
                    }}
                    className={`absolute rounded-full blur-3xl pointer-events-none ${
                      state === 'speaking'
                        ? 'w-64 h-64 sm:w-80 sm:h-80 bg-sky-400/45'
                        : state === 'thinking'
                        ? 'w-60 h-60 sm:w-76 sm:h-76 bg-indigo-400/45'
                        : 'w-56 h-56 sm:w-72 sm:h-72 bg-cyan-400/35'
                    }`}
                  />

                  {/* Subtle Outer Acoustic Fresnel Rings */}
                  <motion.div
                    animate={{
                      scale: 1 + (audioLevel / 100) * 0.35,
                      opacity: 0.16 + (audioLevel / 100) * 0.34,
                    }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-white/25 pointer-events-none"
                  />
                  <motion.div
                    animate={{
                      scale: 1 + (audioLevel / 100) * 0.58,
                      opacity: 0.08 + (audioLevel / 100) * 0.24,
                    }}
                    transition={{ type: 'spring', stiffness: 210, damping: 26 }}
                    className="absolute w-68 h-68 sm:w-84 sm:h-84 rounded-full border border-sky-300/20 pointer-events-none"
                  />

                  {/* 3D Frosted Crystal Liquid Glass Sphere */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.94 }}
                    animate={{
                      scale:
                        state === 'speaking'
                          ? [1, 1.055, 0.985, 1.04, 1]
                          : state === 'thinking'
                          ? [1, 0.96, 1.03, 0.98, 1]
                          : 1 + (audioLevel / 100) * 0.16,
                    }}
                    transition={{
                      scale:
                        state === 'speaking' || state === 'thinking'
                          ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }
                          : { type: 'spring', stiffness: 360, damping: 24 },
                    }}
                    onClick={() => {
                      if (state === 'speaking') {
                        stopSpeech();
                      } else if (state === 'listening' && userTranscript) {
                        handleQuery(userTranscript);
                      }
                    }}
                    aria-label={statusMessage}
                    className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full cursor-pointer select-none overflow-hidden focus-visible:outline-2 focus-visible:outline-sky-300"
                    style={{
                      background:
                        'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.72) 0%, rgba(226,238,255,0.28) 38%, rgba(148,197,255,0.16) 72%, rgba(99,102,241,0.22) 100%)',
                      backdropFilter: 'blur(26px) saturate(190%)',
                      WebkitBackdropFilter: 'blur(26px) saturate(190%)',
                      border: '1.5px solid rgba(255, 255, 255, 0.52)',
                      boxShadow:
                        'inset 0 8px 24px rgba(255, 255, 255, 0.65), inset 0 -14px 28px rgba(56, 189, 248, 0.24), 0 24px 60px -12px rgba(56, 189, 248, 0.42), 0 12px 32px rgba(0, 0, 0, 0.45)',
                    }}
                  >
                    {/* Internal Iridescent Fluid Core */}
                    <motion.div
                      animate={{
                        rotate: state === 'thinking' ? 360 : [0, 18, -14, 0],
                        scale: state === 'speaking' ? [1, 1.16, 1] : [1, 1.06, 1],
                      }}
                      transition={{
                        rotate:
                          state === 'thinking'
                            ? { repeat: Infinity, duration: 4.5, ease: 'linear' }
                            : { repeat: Infinity, duration: 7, ease: 'easeInOut' },
                        scale: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' },
                      }}
                      className="absolute inset-3 rounded-full pointer-events-none"
                      style={{
                        background:
                          state === 'speaking'
                            ? 'radial-gradient(circle at 60% 45%, rgba(56,189,248,0.68), rgba(167,139,250,0.42) 48%, transparent 74%)'
                            : state === 'thinking'
                            ? 'radial-gradient(circle at 42% 55%, rgba(99,102,241,0.72), rgba(56,189,248,0.45) 52%, transparent 75%)'
                            : 'radial-gradient(circle at 58% 52%, rgba(59,130,246,0.52), rgba(125,211,252,0.28) 50%, transparent 74%)',
                        filter: 'blur(14px)',
                      }}
                    />

                    {/* Fluid Harmonic Wave Ribbons Clipped Inside the Crystal Orb */}
                    <svg
                      viewBox="0 0 200 200"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      <defs>
                        <linearGradient id="liquidOrbRibbon1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                          <stop offset="45%" stopColor="rgba(56,189,248,0.92)" />
                          <stop offset="80%" stopColor="rgba(167,139,250,0.85)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
                        </linearGradient>
                        <linearGradient id="liquidOrbRibbon2" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                          <stop offset="50%" stopColor="rgba(96,165,250,0.78)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                        </linearGradient>
                      </defs>
                      {[0, 1, 2, 3, 4, 5].map((idx) => {
                        const baseAmp =
                          state === 'speaking'
                            ? 26 + idx * 3.5
                            : state === 'thinking'
                            ? 18 + idx * 2.5
                            : 10 + (audioLevel / 100) * 28 + idx * 2;
                        const yCenter = 96 + (idx - 2.5) * 4.5;
                        const pathA = `M -10 ${yCenter} Q 45 ${yCenter - baseAmp}, 100 ${yCenter} T 210 ${yCenter}`;
                        const pathB = `M -10 ${yCenter} Q 55 ${yCenter + baseAmp * 0.85}, 100 ${yCenter} T 210 ${yCenter}`;
                        return (
                          <motion.path
                            key={idx}
                            d={pathA}
                            fill="none"
                            stroke={idx % 2 === 0 ? 'url(#liquidOrbRibbon1)' : 'url(#liquidOrbRibbon2)'}
                            strokeWidth={1.6 - idx * 0.14}
                            strokeLinecap="round"
                            animate={{
                              d: [pathA, pathB, pathA],
                              opacity: [0.45 + idx * 0.06, 0.9, 0.45 + idx * 0.06],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration:
                                state === 'speaking'
                                  ? 1.2 + idx * 0.14
                                  : state === 'thinking'
                                  ? 1.5 + idx * 0.18
                                  : 2.6 + idx * 0.22,
                              ease: 'easeInOut',
                            }}
                          />
                        );
                      })}
                    </svg>

                    {/* Top-Left Specular Glass Crescent Highlight */}
                    <div
                      aria-hidden="true"
                      className="absolute top-2.5 left-4 right-8 h-14 rounded-full pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.08) 70%, transparent 100%)',
                        transform: 'rotate(-14deg)',
                      }}
                    />

                    {/* Bottom Inner Fresnel Rim Light */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full pointer-events-none border border-white/40"
                    />
                  </motion.button>

                  {/* Status Indicator */}
                  <div className="mt-7 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        state === 'speaking'
                          ? 'bg-sky-400 animate-ping'
                          : state === 'thinking'
                          ? 'bg-indigo-400 animate-pulse'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <p className="text-xs sm:text-sm font-medium tracking-wide text-slate-100 text-center">
                      {statusMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Live Subtitles & Transcripts Floating Banner */}
              <div className="w-full max-w-xl mx-auto mt-4 px-2 sm:px-4 text-center z-20 min-h-[50px] flex flex-col items-center justify-center">
                {userTranscript && (
                  <p className="text-sm text-cyan-300/90 font-medium mb-1">
                    “{userTranscript}”
                  </p>
                )}
                {aiResponse && (
                  <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-normal bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-xl border border-white/15 max-h-24 overflow-y-auto">
                    {aiResponse}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Floating Liquid Glass Dock Controls */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-white/15 bg-white/[0.04] backdrop-blur-2xl z-20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Left: Audio Visualizer Waveform Bar */}
              <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 border border-white/15">
                <span className="text-[11px] font-mono text-slate-300 mr-1.5">MIC</span>
                {frequencyData.map((val, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(4, Math.min(24, val))}px`,
                      backgroundColor: i % 2 === 0 ? '#c084fc' : '#38bdf8',
                    }}
                  />
                ))}
              </div>

              {/* Center Floating Glass Action Bar */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap">
                {/* Mic Toggle */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const nextMuted = !isMicMuted;
                    setIsMicMuted(nextMuted);
                    if (nextMuted && recognitionRef.current) {
                      recognitionRef.current.stop();
                      setState('idle');
                      setStatusMessage('Microphone muted');
                    } else if (!nextMuted && recognitionRef.current) {
                      try {
                        recognitionRef.current.start();
                        setState('listening');
                        setStatusMessage('Listening to your voice...');
                      } catch {}
                    }
                  }}
                  className={`p-3 sm:p-3.5 rounded-full border backdrop-blur-xl transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.28)] cursor-pointer ${
                    isMicMuted
                      ? 'bg-rose-500/25 border-rose-400/50 text-rose-300 hover:bg-rose-500/35'
                      : 'bg-white/12 border-white/25 text-white hover:bg-white/20'
                  }`}
                  title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </motion.button>

                {/* Camera Toggle */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (isCameraActive) {
                      stopCamera();
                    } else {
                      startCamera(facingMode);
                    }
                  }}
                  className={`p-3 sm:p-3.5 rounded-full border backdrop-blur-xl transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.28)] cursor-pointer ${
                    isCameraActive
                      ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/35'
                      : 'bg-white/12 border-white/25 text-slate-200 hover:bg-white/20'
                  }`}
                  title={isCameraActive ? 'Turn Off Camera' : 'Turn On Gemini Vision Camera'}
                >
                  {isCameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </motion.button>

                {/* Audio Speaker Mute Toggle */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const next = !isAudioMuted;
                    setIsAudioMuted(next);
                    if (next) stopSpeech();
                  }}
                  className={`p-3 sm:p-3.5 rounded-full border backdrop-blur-xl transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.28)] cursor-pointer ${
                    isAudioMuted
                      ? 'bg-amber-500/25 border-amber-400/50 text-amber-200 hover:bg-amber-500/35'
                      : 'bg-white/12 border-white/25 text-slate-200 hover:bg-white/20'
                  }`}
                  title={isAudioMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
                >
                  {isAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </motion.button>

                {/* End Conversation Button */}
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={handleClose}
                  className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-300/30 font-medium text-xs tracking-wide transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>End Live</span>
                </motion.button>
              </div>

              {/* Right: Hint */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Two-way real-time voice & vision</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
