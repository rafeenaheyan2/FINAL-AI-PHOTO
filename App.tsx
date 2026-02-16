
import React, { useState, useRef, useEffect } from 'react';
import { ImageState } from './types';
import { CLOTHING_OPTIONS, APP_TITLE } from './constants';
import { GlossyButton } from './components/GlossyButton';
import { editImageWithGemini } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

// UI Components
const SelectionPanel: React.FC<{
  title: string;
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, show, onClose, children }) => {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-50 bg-[#020202]/fb backdrop-blur-3xl animate-[fadeIn_0.3s_ease-out] flex flex-col p-6 rounded-[50px] overflow-hidden">
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <h3 className="text-lg font-black text-white uppercase tracking-tighter">{title}</h3>
        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-all">
          <i className="fa-solid fa-times text-slate-500"></i>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {children}
      </div>
    </div>
  );
};

const HelpModal: React.FC<{
  show: boolean;
  onClose: () => void;
}> = ({ show, onClose }) => {
  if (!show) return null;
  const [messages, setMessages] = useState([{ role: 'ai', text: 'স্বাগতম! আমি রাফী এআই, আপনাকে কিভাবে সাহায্য করতে পারি?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const askAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const apiKey = process.env.API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userText,
        config: { systemInstruction: "You are Rafee AI assistant. Help users with photo editing tasks." }
      });
      setMessages(prev => [...prev, { role: 'ai', text: response.text || "দুঃখিত, আমি এটি বুঝতে পারছি না।" }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "সার্ভার এখন কিছুটা ব্যস্ত।" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4">
      <div className="glass-panel max-w-md w-full rounded-[40px] flex flex-col max-h-[80vh] overflow-hidden border-blue-500/20">
        <div className="p-6 bg-white/5 flex justify-between items-center border-b border-white/5">
          <span className="font-black text-xs uppercase tracking-widest text-blue-500">Live Support</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-all"><i className="fa-solid fa-times"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[11px] ${m.role === 'user' ? 'bg-blue-600/20 text-slate-300' : 'bg-white/10 text-white shadow-xl'}`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={scrollRef}></div>
        </div>
        <form onSubmit={askAi} className="p-5 bg-white/5 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="কি জানতে চান?..." className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[11px] text-white outline-none focus:border-blue-500" />
          <button className="w-12 h-12 glossy-primary rounded-xl flex items-center justify-center text-white"><i className="fa-solid fa-paper-plane"></i></button>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<ImageState>({ original: null, edited: null, isProcessing: false, error: null });
  const [showDresses, setShowDresses] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isGalaxy, setIsGalaxy] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setState({ original: ev.target?.result as string, edited: ev.target?.result as string, isProcessing: false, error: null });
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (instruction: string) => {
    if (!state.original) return;
    setShowDresses(false);
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await editImageWithGemini(state.original, instruction);
      setState(prev => ({ ...prev, edited: result, isProcessing: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: err.message }));
    }
  };

  const startPro = () => {
    setIsGalaxy(true);
    setTimeout(() => { setIsPro(true); setIsGalaxy(false); }, 3000);
  };

  const download = () => {
    if (!state.edited) return;
    const a = document.createElement('a');
    a.href = state.edited;
    a.download = `rafee_ai_${Date.now()}.png`;
    a.click();
  };

  if (isGalaxy) {
    return (
      <div className="galaxy-container">
        <div className="starfield-dense"></div>
        <div className="relative z-10 flex flex-col items-center gap-10 animate-[zoomIn_1s_ease-out]">
          <div className="w-24 h-24 glossy-primary rounded-[35px] flex items-center justify-center rotate-45 shadow-[0_0_80px_rgba(37,99,235,0.6)]">
            <i className="fa-solid fa-shuttle-space text-4xl text-white -rotate-45 animate-pulse"></i>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase">Initializing Pro Studio</h2>
            <p className="text-[10px] text-blue-500 font-bold tracking-[0.6em] mt-2">LINKING NEURAL NETWORKS</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-10 flex flex-col items-center max-w-6xl mx-auto">
      <HelpModal show={showHelp} onClose={() => setShowHelp(false)} />
      
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-12 gap-6 glass-panel p-8 rounded-[40px] border-blue-500/10 animate-[slideUp_0.8s_ease-out]">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 glossy-primary rounded-2xl flex items-center justify-center shadow-xl">
            <i className="fa-solid fa-bolt-lightning text-xl text-white"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">{APP_TITLE}</h1>
            <p className="text-slate-600 text-[9px] font-black tracking-widest uppercase">Version 3.2 Industrial</p>
          </div>
        </div>
        <button onClick={startPro} className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase tracking-widest hover:border-blue-500/50 hover:bg-blue-600/10 transition-all group">
          <i className="fa-solid fa-shuttle-space mr-3 group-hover:translate-x-1 transition-transform"></i>
          {isPro ? "Studio Mode Active" : "Go Pro Studio"}
        </button>
      </header>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        <div className="lg:col-span-4 space-y-6">
          {!state.original ? (
            <div className="glass-panel p-10 rounded-[50px] border-dashed border-2 border-white/10 flex flex-col items-center justify-center min-h-[450px] hover:border-blue-500 transition-all group shadow-2xl">
              <input type="file" id="up" className="hidden" onChange={handleFile} accept="image/*" />
              <label htmlFor="up" className="cursor-pointer text-center">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all shadow-inner">
                  <i className="fa-solid fa-plus text-2xl text-slate-500"></i>
                </div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm">Upload Raw Photo</h3>
                <p className="text-slate-600 text-[9px] mt-2 uppercase font-bold tracking-widest">Supports JPG, PNG, WEBP</p>
              </label>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-[40px] space-y-4 shadow-2xl animate-[fadeIn_0.5s_ease-out]">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">AI Tools</p>
              <GlossyButton onClick={() => processImage("Remove background and replace with solid white studio background")} isLoading={state.isProcessing} className="w-full py-4" variant="secondary">
                Remove Background
              </GlossyButton>
              <GlossyButton onClick={() => setShowDresses(true)} className="w-full py-4" variant="secondary">
                Select Formal Clothing
              </GlossyButton>
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button onClick={() => setState(p => ({ ...p, edited: p.original }))} className="flex-1 py-3 rounded-xl bg-slate-900 border border-white/5 text-slate-500 text-[10px] font-black uppercase hover:text-white transition-all">Restore</button>
                <button onClick={() => setState({ original: null, edited: null, isProcessing: false, error: null })} className="flex-1 py-3 rounded-xl bg-red-600/10 text-red-500 text-[10px] font-black uppercase hover:bg-red-600/20 transition-all">Clear</button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          <div className="glass-panel rounded-[60px] p-2 min-h-[550px] relative overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/5">
            <SelectionPanel title="Wardrobe Hub" show={showDresses} onClose={() => setShowDresses(false)}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {CLOTHING_OPTIONS.slice(0, 12).map(opt => (
                  <button key={opt.id} onClick={() => processImage(opt.prompt)} className="group relative rounded-2xl overflow-hidden aspect-square border border-white/5 hover:border-blue-500 transition-all shadow-lg">
                    <img src={opt.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" alt={opt.name} />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black to-transparent">
                      <p className="text-[9px] font-black text-white uppercase text-center tracking-tighter">{opt.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </SelectionPanel>

            {state.isProcessing ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <div className="processing-ring w-20 h-20 rounded-full shadow-[0_0_40px_rgba(59,130,246,0.3)]"></div>
                <div className="text-center">
                   <p className="text-[12px] font-black text-white uppercase tracking-[0.5em] animate-pulse">Synthesizing Pixels</p>
                   <p className="text-[9px] text-slate-600 mt-2 uppercase font-bold">Please wait, AI is rendering...</p>
                </div>
              </div>
            ) : state.original ? (
              <div className="flex-1 flex flex-col p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5 shadow-inner">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High Res Preview</span>
                  </div>
                  <GlossyButton onClick={download} className="px-10 py-3 shadow-2xl">Download Final</GlossyButton>
                </div>
                <div className="flex-1 flex items-center justify-center bg-black/40 rounded-[45px] border border-white/5 overflow-hidden shadow-inner p-4">
                  <img src={state.edited || ''} className="max-w-full max-h-[55vh] rounded-[30px] shadow-2xl image-glow" />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                <i className="fa-solid fa-camera text-9xl text-white mb-6"></i>
                <span className="text-6xl font-black text-white tracking-tighter uppercase">Studio Ready</span>
              </div>
            )}
            
            {state.error && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-600/20 border border-red-500/40 text-red-500 text-[10px] font-black uppercase rounded-full backdrop-blur-xl animate-[slideUp_0.3s_ease-out]">
                <i className="fa-solid fa-circle-exclamation mr-2"></i> {state.error}
              </div>
            )}
          </div>
        </div>
      </div>

      <button onClick={() => setShowHelp(true)} className="fixed bottom-10 right-10 w-16 h-16 glossy-primary rounded-[25px] shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-90 transition-all group">
        <i className="fa-solid fa-headset text-white text-xl group-hover:animate-bounce"></i>
        <span className="absolute -top-12 right-0 bg-blue-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">Help Hub</span>
      </button>

      <footer className="mt-20 text-center opacity-30 pb-10">
        <p className="text-[9px] font-black text-white uppercase tracking-[0.8em]">&copy; 2024 RAFEE AI PHOTO STUDIO &bull; POWERED BY GEMINI 2.5</p>
      </footer>
    </div>
  );
};

export default App;
