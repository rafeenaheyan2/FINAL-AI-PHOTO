
import React, { useState, useRef, useEffect } from 'react';
import { ImageState } from './types';
import { CLOTHING_OPTIONS, FILTER_OPTIONS, APP_TITLE } from './constants';
import { GlossyButton } from './components/GlossyButton';
import { editImageWithGemini } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

// Props Interfaces
interface HelpModalProps {
  show: boolean;
  onClose: () => void;
  chatMessages: {role: 'user' | 'ai', text: string}[];
  chatInput: string;
  setChatInput: (val: string) => void;
  isChatting: boolean;
  onSubmit: (e?: React.FormEvent) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

interface SelectionPanelProps {
  title: string;
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

interface ConfirmModalProps {
  confirmModal: { show: boolean; title: string; message: string; onConfirm: () => void; } | null;
  onClose: () => void;
}

// Sub-components
const SelectionPanel: React.FC<SelectionPanelProps> = ({ title, show, onClose, children }) => {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-3xl animate-[fadeIn_0.3s_ease-out] flex flex-col p-6 overflow-y-auto scrollbar-hide rounded-[60px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-white uppercase tracking-widest">{title}</h3>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
          <i className="fa-solid fa-times text-slate-400"></i>
        </button>
      </div>
      {children}
    </div>
  );
};

const HelpModal: React.FC<HelpModalProps> = ({ 
  show, onClose, chatMessages, chatInput, setChatInput, isChatting, onSubmit, chatEndRef 
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="glass-panel max-w-md w-full rounded-[35px] overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 glossy-primary rounded-xl flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-headset text-white"></i>
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Support Hub</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-times text-lg"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 min-h-[150px] flex flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[200px] scrollbar-hide">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2 rounded-xl text-[10px] ${msg.role === 'user' ? 'bg-blue-600/20 text-slate-300' : 'bg-white/10 text-white'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef}></div>
            </div>
            <form onSubmit={onSubmit} className="mt-4 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type here..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] focus:border-blue-500 outline-none text-white"
              />
              <button type="submit" disabled={isChatting} className="w-10 h-10 glossy-primary rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-paper-plane text-[10px] text-white"></i>
              </button>
            </form>
          </div>
          <a href="https://wa.me/message/XVJOHMZ3Z6CUB1" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <i className="fa-brands fa-whatsapp text-xl"></i> WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  );
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({ confirmModal, onClose }) => {
  if (!confirmModal) return null;
  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6">
      <div className="glass-panel max-w-sm w-full p-8 rounded-[35px] text-center border-blue-500/20">
        <h2 className="text-lg font-black text-white uppercase mb-2">{confirmModal.title}</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-8">{confirmModal.message}</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-900 border border-white/5 text-slate-500 text-[10px] uppercase font-black">Cancel</button>
          <button onClick={confirmModal.onConfirm} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-[10px] uppercase font-black">Confirm</button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [state, setState] = useState<ImageState>({
    original: null,
    edited: null,
    isProcessing: false,
    error: null,
  });
  
  const [showDresses, setShowDresses] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isProModeActive, setIsProModeActive] = useState(false);
  const [isGalaxyTransitioning, setIsGalaxyTransitioning] = useState(false);
  const [clothingTab, setClothingTab] = useState<'male' | 'female'>('male');
  const [proEditPrompt, setProEditPrompt] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    {role: 'ai', text: 'কিভাবে সাহায্য করতে পারি?'}
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalProps['confirmModal']>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setState({ original: result, edited: result, isProcessing: false, error: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async (prompt: string) => {
    if (!state.original) return;
    setShowDresses(false);
    setShowFilters(false);
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await editImageWithGemini(state.original, prompt);
      setState(prev => ({ ...prev, edited: result, isProcessing: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: err.message }));
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatting) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setIsChatting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
      });
      setChatMessages(prev => [...prev, {role: 'ai', text: response.text || "বুঝতে পারিনি।"}]);
    } catch {
      setChatMessages(prev => [...prev, {role: 'ai', text: "সার্ভার ব্যস্ত।"}]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleExport = () => {
    if (!state.edited) return;
    const link = document.createElement('a');
    link.href = state.edited;
    link.download = `rafee-ai-${Date.now()}.png`;
    link.click();
  };

  if (isGalaxyTransitioning) {
    return (
      <div className="galaxy-container">
        <div className="starfield-dense"></div>
        <div className="relative z-10 flex flex-col items-center gap-8 animate-[zoomIn_1s_ease-out]">
          <div className="w-24 h-24 glossy-primary rounded-[30px] flex items-center justify-center rotate-45 shadow-[0_0_80px_rgba(37,99,235,0.6)]">
            <i className="fa-solid fa-shuttle-space text-4xl text-white -rotate-45"></i>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-widest">Starting Pro Studio...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-12 flex flex-col items-center max-w-7xl mx-auto">
      <ConfirmModal confirmModal={confirmModal} onClose={() => setConfirmModal(null)} />
      <HelpModal 
        show={showHelpModal} onClose={() => setShowHelpModal(false)}
        chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput}
        isChatting={isChatting} onSubmit={handleChatSubmit} chatEndRef={chatEndRef}
      />
      
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-12 gap-6 glass-panel p-8 rounded-[40px] border-white/5">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 glossy-primary rounded-2xl flex items-center justify-center">
            <i className="fa-solid fa-bolt-lightning text-xl text-white"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">{APP_TITLE}</h1>
            <p className="text-slate-600 text-[9px] font-black tracking-widest uppercase">Neural Core v3.2</p>
          </div>
        </div>
        {!isProModeActive && (
          <button 
            onClick={() => setConfirmModal({show:true, title:"Launch Pro?", message:"Enter Studio Mode?", onConfirm: () => {
              setConfirmModal(null); setIsGalaxyTransitioning(true);
              setTimeout(() => { setIsProModeActive(true); setIsGalaxyTransitioning(false); }, 2500);
            }})}
            className="px-10 py-4 rounded-2xl bg-slate-900 border border-white/10 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-600/10 transition-all"
          >
            <i className="fa-solid fa-shuttle-space mr-3"></i> Pro Studio
          </button>
        )}
      </header>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        <div className="lg:col-span-4 space-y-6">
          {!state.original ? (
            <div className="glass-panel p-10 rounded-[45px] border-dashed border-2 border-white/10 flex flex-col items-center justify-center min-h-[400px]">
              <input type="file" id="upload" className="hidden" onChange={handleFileUpload} accept="image/*" />
              <label htmlFor="upload" className="cursor-pointer text-center group">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all">
                  <i className="fa-solid fa-plus text-2xl text-slate-500"></i>
                </div>
                <h3 className="text-white font-black uppercase tracking-widest">Import Photo</h3>
              </label>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-[40px] space-y-4">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Controls</p>
              <GlossyButton onClick={() => handleAction("Remove background perfectly, solid white background")} isLoading={state.isProcessing} className="w-full" variant="secondary">Remove Background</GlossyButton>
              <GlossyButton onClick={() => setShowDresses(true)} className="w-full" variant="secondary">Change Clothing</GlossyButton>
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button onClick={() => setState(prev => ({ ...prev, edited: prev.original }))} className="flex-1 py-3 rounded-xl bg-slate-900 text-slate-500 text-[10px] font-black uppercase">Reset</button>
                <button onClick={() => setState({original:null, edited:null, isProcessing:false, error:null})} className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase">Clear</button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          <div className="glass-panel rounded-[55px] p-2 min-h-[500px] relative overflow-hidden flex flex-col">
            <SelectionPanel title="Neural Wardrobe" show={showDresses} onClose={() => setShowDresses(false)}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CLOTHING_OPTIONS.slice(0, 8).map(opt => (
                  <button key={opt.id} onClick={() => handleAction(opt.prompt)} className="group relative rounded-xl overflow-hidden aspect-square border border-white/10">
                    <img src={opt.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2">
                      <p className="text-[9px] font-black text-white uppercase text-center">{opt.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </SelectionPanel>

            {state.isProcessing ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="processing-ring w-16 h-16 rounded-full mb-6"></div>
                <p className="text-[11px] font-black text-white uppercase tracking-widest animate-pulse">Processing Pixels...</p>
              </div>
            ) : state.original ? (
              <div className="flex-1 flex flex-col p-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-slate-500 uppercase px-3 py-1 bg-white/5 rounded-full">Preview Mode</span>
                  <GlossyButton onClick={handleExport} className="px-8">Save Output</GlossyButton>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <img src={state.edited || ''} className="max-w-full max-h-[60vh] rounded-[35px] shadow-2xl border border-white/5" />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-800 text-6xl font-black">
                READY
              </div>
            )}
            
            {state.error && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-500 text-[9px] font-black uppercase rounded-full backdrop-blur-md">
                {state.error}
              </div>
            )}
          </div>
        </div>
      </div>

      <button onClick={() => setShowHelpModal(true)} className="fixed bottom-8 right-8 w-16 h-16 glossy-primary rounded-full shadow-2xl flex items-center justify-center z-50">
        <i className="fa-solid fa-headset text-white text-xl"></i>
      </button>

      <footer className="mt-16 text-center opacity-20">
        <p className="text-[9px] font-black text-white uppercase tracking-[0.5em]">&copy; 2024 RAFEE AI PHOTO STUDIO</p>
      </footer>
    </div>
  );
};

export default App;
