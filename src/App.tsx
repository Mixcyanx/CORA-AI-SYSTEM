import React, { useState, useRef, useEffect } from 'react';
import { Send, Pill, Info, AlertTriangle, ShieldAlert, User, Bot, Volume2, VolumeX, Loader2, Mic, MicOff, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Character2D } from './components/Character2D';
import { getMedicationExplanation, generateSpeech, MedicationInfo } from './services/gemini';
import { cn } from './lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  medicationInfo?: MedicationInfo;
}

// Extend Window for SpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentMedInfo, setCurrentMedInfo] = useState<MedicationInfo | null>(null);
  const [expression, setExpression] = useState<'happy' | 'neutral' | 'thinking'>('happy');
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Handle Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial Greeting
  useEffect(() => {
    const triggerGreeting = async () => {
      if (hasGreeted) return;
      setHasGreeted(true);
      
      const greetingText = "Hi，我是 Cora！我是你的 AI 藥師助手。我可以幫你解說藥物成分、適應症與副作用，讓用藥更安心。請問今天有什麼我可以幫你的嗎？";
      
      const assistantMessage: Message = {
        id: "greeting",
        role: 'assistant',
        content: greetingText,
      };
      setMessages([assistantMessage]);
      setExpression('happy');
    };

    triggerGreeting();
  }, [hasGreeted]);

  const startGreetingAudio = async () => {
    if (isTalking) return;
    const greetingText = "Hi，我是 Cora！我是你的 AI 藥師助手。我可以幫你解說藥物成分、適應症與副作用，讓用藥更安心。請問今天有什麼我可以幫你的嗎？";
    try {
      const base64Pcm = await generateSpeech(greetingText);
      await playPcmAudio(base64Pcm);
    } catch (e) {
      console.error("Greeting audio failed", e);
    }
  };

  // Trigger audio on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        startGreetingAudio();
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
      }
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [hasInteracted]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'zh-TW';

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Speech recognition error:", e);
      }
    }
  };

  const playPcmAudio = async (base64Data: string) => {
    try {
      // Stop previous audio if playing to prevent stacking
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (e) {
          // Ignore errors if already stopped
        }
        audioSourceRef.current = null;
      }

      let ctx = audioContext;
      if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(ctx);
      }

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Int16Array(len / 2);
      for (let i = 0; i < len; i += 2) {
        bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
      }

      const float32Data = new Float32Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        float32Data[i] = bytes[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      audioSourceRef.current = source;
      setIsTalking(true);
      source.onended = () => {
        if (audioSourceRef.current === source) {
          setIsTalking(false);
          setExpression('happy');
          audioSourceRef.current = null;
        }
      };
      source.start();
    } catch (e) {
      console.error("PCM Playback error:", e);
      setIsTalking(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userQuery,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setExpression('thinking');

    try {
      const result = await getMedicationExplanation(userQuery);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer,
        medicationInfo: result,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentMedInfo(result);
      setExpression('happy');

      if (isAudioEnabled) {
        try {
          const base64Pcm = await generateSpeech(result.answer);
          await playPcmAudio(base64Pcm);
        } catch (audioError) {
          console.error("Audio generation failed", audioError);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "抱歉，我暫時無法取得該藥物的資訊。請稍後再試，或諮詢專業醫療人員。",
      }]);
      setExpression('happy');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-300",
      theme === 'dark' && "dark"
    )}>
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-rose-500 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-sm">
            <Pill className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">CORA AI 藥物解說系統</h1>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">專業衛教助手 · 非醫療診斷</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={theme === 'light' ? '切換深色模式' : '切換淺色模式'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button 
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={cn(
              "p-2 rounded-full transition-colors",
              isAudioEnabled ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            )}
          >
            {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        
        {/* Left Column: Character - Responsive size */}
        <div className="lg:col-span-4 flex flex-col gap-3 md:gap-4 h-[280px] md:h-[400px] lg:h-auto">
          <Character2D isTalking={isTalking} expression={expression} />
          <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hidden md:block">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
              「Hi，我是 Cora！你可以詢問我任何關於藥物的問題，我會盡力為你解答。」
            </p>
          </div>
        </div>

        {/* Right Column: Chat & Info */}
        <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6 h-full">
          
          {/* Chat Area */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden min-h-[350px] md:min-h-[400px]">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-2 md:gap-3 max-w-[90%] md:max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                    msg.role === 'user' ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={cn(
                    "p-3 md:p-4 rounded-xl md:rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-rose-600 text-white rounded-tr-none" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3 mr-auto">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-pulse">
                    <Bot size={16} className="text-slate-400 dark:text-slate-600" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                    <Loader2 size={16} className="animate-spin text-rose-600 dark:text-rose-400" />
                    <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Cora 正在查閱資料...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative flex items-center gap-2">
                <button
                  onClick={toggleRecording}
                  className={cn(
                    "p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all shadow-sm",
                    isRecording 
                      ? "bg-red-500 text-white animate-pulse" 
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                  )}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isRecording ? "正在聆聽中..." : "請輸入藥物名稱..."}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl py-2.5 md:py-3 pl-4 pr-10 md:pr-12 text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-rose-600 text-white rounded-lg md:rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card Area */}
          <AnimatePresence>
            {currentMedInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
              >
                <div className="bg-rose-600 px-4 md:px-6 py-3 flex items-center gap-2">
                  <Info className="text-white w-4 h-4 md:w-5 md:h-5" />
                  <h2 className="text-white font-semibold text-sm md:text-base">藥物詳細資訊卡</h2>
                </div>
                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Ingredients */}
                  <div className="space-y-2 bg-rose-50/30 dark:bg-rose-900/10 p-3 rounded-xl border border-rose-100/50 dark:border-rose-900/30">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs md:text-sm">
                      <Pill size={16} />
                      <h3>主要成分</h3>
                    </div>
                    <ul className="list-disc list-inside text-[11px] md:text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      {currentMedInfo.ingredients.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  {/* Indications */}
                  <div className="space-y-2 bg-emerald-50/30 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs md:text-sm">
                      <ShieldAlert size={16} />
                      <h3>適應症</h3>
                    </div>
                    <ul className="list-disc list-inside text-[11px] md:text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      {currentMedInfo.indications.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  {/* Side Effects */}
                  <div className="space-y-2 bg-amber-50/30 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100/50 dark:border-amber-900/30">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs md:text-sm">
                      <AlertTriangle size={16} />
                      <h3>常見副作用</h3>
                    </div>
                    <ul className="list-disc list-inside text-[11px] md:text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      {currentMedInfo.side_effects.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  {/* Warnings */}
                  <div className="space-y-2 bg-red-50/30 dark:bg-red-900/10 p-3 rounded-xl border border-red-100/50 dark:border-red-900/30">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs md:text-sm">
                      <ShieldAlert size={16} />
                      <h3>禁忌與注意事項</h3>
                    </div>
                    <ul className="list-disc list-inside text-[11px] md:text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      {currentMedInfo.warnings.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/80 px-4 md:px-6 py-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center font-medium">
                    本系統僅供衛教參考，請務必諮詢專業醫師或藥師。
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-slate-400 dark:text-slate-600 text-[10px]">
        &copy; 2026 CORA AI 藥物解說系統 · Powered by Gemini AI
      </footer>
    </div>
  );
}
