
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ImageState, ClothingOption } from './types';
import { CLOTHING_OPTIONS, FILTER_OPTIONS, APP_TITLE } from './constants';
import { GlossyButton } from './components/GlossyButton';
import { editImageWithGemini } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

// Separate HelpModal component to prevent remount issues
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

const HelpModal: React.FC<HelpModalProps> = ({ 
  show, onClose, chatMessages, chatInput, setChatInput, isChatting, onSubmit, chatEndRef 
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 sm:p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="glass-panel max-w-md w-full rounded-[35px] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 glossy-primary rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40">
              <i className="fa-solid fa-headset text-white text-lg"></i>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Support Core</h3>
              <p className="text-[8px] text-blue-400 font-black uppercase tracking-[0.2em]">Always Online</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all">
            <i className="fa-solid fa-times text-slate-500"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <a href="https://shorturl.at/pQnkD" target="_blank" rel="noopener noreferrer" className="block p-5 rounded-3xl bg-blue-600/10 border border-blue-500/20 hover:border-blue-500 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-play text-blue-400 text-xs"></i>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-white uppercase">Watch Guide</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest">Documentation Video</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-[10px] text-slate-600 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </a>

          <div className="space-y-3">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">Ask Anything</p>
            <div className="bg-black/60 border border-white/5 rounded-3xl p-5 min-h-[220px] flex flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[160px] scrollbar-hide">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[9.5px] ${msg.role === 'user' ? 'chat-bubble-user text-slate-300' : 'chat-bubble-ai text-white shadow-xl'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="chat-bubble-ai px-4 py-2 rounded-2xl flex gap-1 items-center">
                      <span className="w-1 h-1 bg-white rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef}></div>
              </div>
              <form onSubmit={onSubmit} className="mt-4 flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="কি জানতে চান?..." 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] focus:border-blue-500 outline-none"
                />
                <button type="submit" className="w-10 h-10 glossy-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-paper-plane text-[10px]"></i>
                </button>
              </form>
            </div>
          </div>

          <a href="https://wa.me/message/XVJOHMZ3Z6CUB1" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-emerald-400 group">
            <i className="fa-brands fa-whatsapp text-2xl group-hover:scale-110 transition-transform"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Connect on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

// Separate ConfirmModal component
interface ConfirmModalProps {
  confirmModal: {
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null;
  onClose: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ confirmModal, onClose }) => {
  if (!confirmModal) return null;
  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="glass-panel max-w-sm w-full p-10 rounded-[40px] border-blue-500/30 text-center shadow-[0_0_120px_rgba(37,99,235,0.2)]">
        <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20 shadow-inner">
          <i className="fa-solid fa-shield-halved text-3xl text-blue-500 animate-pulse"></i>
        </div>
        <h2 className="text-xl font-black text-white tracking-widest uppercase mb-4">{confirmModal.title}</h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] leading-relaxed mb-10">{confirmModal.message}</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase bg-slate-900 border border-white/5 text-slate-500 hover:text-white transition-all">Abort</button>
          <button onClick={confirmModal.onConfirm} className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase bg-blue-600 text-white shadow-2xl shadow-blue-600/40 active:scale-95">Confirm</button>
        </div>
      </div>
    </div>
  );
};

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
  
  // Help & Chatbot State
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    {role: 'ai', text: 'স্বাগতম! আমি রাফী এআই অ্যাসিস্ট্যান্ট। আমি আপনাকে এই ওয়েবসাইটটি ব্যবহার করতে সাহায্য করতে পারি।'}
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setState({
          original: result,
          edited: result,
          isProcessing: false,
          error: null
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReselect = () => {
    setState({ original: null, edited: null, isProcessing: false, error: null });
    setShowDresses(false);
    setShowFilters(false);
  };

  const startProModeTransition = () => {
    setConfirmModal(null);
    setIsGalaxyTransitioning(true);
    setTimeout(() => {
      setIsProModeActive(true);
      setIsGalaxyTransitioning(false);
    }, 3200);
  };

  const handleAction = async (prompt: string) => {
    if (!state.original) return;
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
        config: {
          systemInstruction: 'You are Rafee AI Support Bot. Help users with Rafee Photo AI, which does background removal and formal clothing changes. Keep answers very short and friendly.'
        }
      });
      const aiText = response.text || "দুঃখিত, আমি এই মুহূর্তে বুঝতে পারছি না।";
      setChatMessages(prev => [...prev, {role: 'ai', text: aiText}]);
    } catch (error) {
      setChatMessages(prev => [...prev, {role: 'ai', text: "সার্ভার কিছুটা ব্যস্ত।"}]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleExport = () => {
    if (!state.edited) return;
    const link = document.createElement('a');
    link.href = state.edited;
    link.download = `rafee-studio-${Date.now()}.png`;
    link.click();
  };

  if (isGalaxyTransitioning) {
    return (
      <div className="galaxy-container">
        <div className="starfield-dense"></div>
        <div className="planet planet-1"></div>
        <div className="planet planet-2"></div>
        {Array.from({length: 15}).map((_, i) => (
          <div key={i} className="warp-line" style={{top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 1}s`}}></div>
        ))}
        <div className="relative z-[1100] flex flex-col items-center justify-center space-y-12 animate-[zoomIn_1.5s_ease-out]">
           <div className="w-28 h-28 glossy-primary rounded-[40px] flex items-center justify-center shadow-[0_0_150px_rgba(37,99,235,0.8)] border border-white/20 rotate-45">
             <i className="fa-solid fa-shuttle-space text-5xl text-white -rotate-45 animate-bounce"></i>
           </div>
           <div className="text-center">
             <h2 className="text-5xl font-black text-white tracking-tighter mb-4 uppercase">SYNCING CORES</h2>
             <p className="text-blue-400 font-black uppercase tracking-[1em] text-[11px] opacity-70">Industrial Pro Studio Mode</p>
           </div>
           <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-blue-600 w-full animate-[shimmer_2s_infinite]"></div>
           </div>
        </div>
      </div>
    );
  }

  if (isProModeActive) {
    return (
      <div className="min-h-screen bg-[#010101] text-white p-3 md:p-8 flex flex-col animate-[fadeIn_0.5s_ease-out]">
         <ConfirmModal confirmModal={confirmModal} onClose={() => setConfirmModal(null)} />
         <nav className="flex justify-between items-center mb-8 glass-panel p-5 rounded-[30px] border-blue-500/10">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => setConfirmModal({show:true, title:"TERMINATE?", message:"Close Session?", onConfirm:()=>setIsProModeActive(false)})}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500 transition-all active:scale-90 group"
              >
                <i className="fa-solid fa-power-off text-sm text-slate-500 group-hover:text-red-500"></i>
              </button>
              <div className="text-left">
                <h2 className="text-xl font-black tracking-tighter flex items-center gap-3">
                  <span className="text-blue-500">PRO</span> STUDIO <span className="bg-blue-600/20 text-blue-500 text-[10px] px-2 py-0.5 rounded tracking-widest border border-blue-500/20">v3.2</span>
                </h2>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Neural Link</p>
              </div>
            </div>
            {state.original && (
              <GlossyButton onClick={handleExport} className="px-10 py-3 bg-blue-600 text-[10px] md:text-[11px] shadow-2xl shadow-blue-500/30">
                <i className="fa-solid fa-cloud-arrow-down mr-3"></i> Final Export
              </GlossyButton>
            )}
         </nav>

         <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-3 space-y-6">
               <div className="glass-panel p-8 rounded-[40px] space-y-10 border-white/5">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                      <i className="fa-solid fa-atom text-blue-500"></i> Accelerators
                    </p>
                    <button disabled={!state.original} onClick={() => handleAction("Enhance quality, sharpness and realism")} className="w-full p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center gap-3 disabled:opacity-10 group">
                      <i className="fa-solid fa-wand-magic-sparkles text-2xl text-blue-400 group-hover:scale-110 transition-transform"></i>
                      <span className="text-[10px] font-black uppercase tracking-widest">Neural Enhance</span>
                    </button>
                    <button disabled={!state.original} onClick={() => handleAction("Transform into professional passport photo with white background and formal suit")} className="w-full p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10 hover:bg-blue-600/20 transition-all flex flex-col items-center gap-3 disabled:opacity-10 group">
                      <i className="fa-solid fa-id-card text-2xl text-white/80 group-hover:scale-110 transition-transform"></i>
                      <span className="text-[10px] font-black uppercase tracking-widest">AI Passport</span>
                    </button>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                      <i className="fa-solid fa-terminal text-indigo-500"></i> Synthesis Logic
                    </p>
                    <textarea 
                      disabled={!state.original}
                      placeholder="Input neural prompt instructions..." 
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-[11px] text-white focus:border-blue-500 outline-none min-h-[160px] resize-none font-mono disabled:opacity-10 shadow-inner"
                      value={proEditPrompt}
                      onChange={(e) => setProEditPrompt(e.target.value)}
                    />
                    <GlossyButton disabled={!state.original} onClick={() => handleAction(proEditPrompt)} className="w-full py-5 text-[10px]">Execute Synthesis</GlossyButton>
                  </div>
               </div>
            </aside>

            <main className="lg:col-span-9 flex flex-col space-y-6">
               <div className="flex-1 glass-panel rounded-[60px] p-2 studio-viewer relative overflow-hidden flex flex-col">
                  {!state.original ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                       <input type="file" id="pro-upload" className="hidden" onChange={handleFileUpload} accept="image/*" />
                       <label htmlFor="pro-upload" className="group cursor-pointer">
                          <div className="w-32 h-32 rounded-[45px] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-10 group-hover:scale-110 transition-all shadow-[0_0_60px_rgba(37,99,235,0.25)]">
                             <i className="fa-solid fa-plus text-4xl text-blue-500"></i>
                          </div>
                          <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">New Studio project</h3>
                          <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.5em]">Ready for frame capture</p>
                       </label>
                    </div>
                  ) : state.isProcessing ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                       <div className="relative w-52 h-52 mb-12 flex items-center justify-center">
                          <div className="absolute inset-0 processing-ring rounded-full shadow-[0_0_50px_rgba(59,130,246,0.4)]"></div>
                          <div className="relative z-10 rf-glow">
                             <span className="text-6xl font-black text-white tracking-[0.1em]">RF</span>
                          </div>
                       </div>
                       <h3 className="text-4xl font-black text-white tracking-[0.2em] uppercase mb-3">SYNTHESIZING</h3>
                       <p className="text-[12px] text-slate-500 font-black uppercase tracking-[1em] animate-pulse">Rendering Pixel Buffers</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                       <img src={state.edited || ''} className="max-w-full max-h-[70vh] rounded-[45px] shadow-[0_0_120px_rgba(0,0,0,0.95)] image-glow border border-white/5 animate-[zoomIn_0.5s_ease-out]" />
                    </div>
                  )}
                  
                  {state.original && !state.isProcessing && (
                    <div className="p-10 flex justify-between items-center bg-black/60 backdrop-blur-3xl border-t border-white/5">
                       <div className="flex gap-4">
                          <button onClick={() => { setShowDresses(!showDresses); setShowFilters(false); }} className={`px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${showDresses ? 'bg-blue-600 text-white shadow-xl' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'}`}>Wardrobe</button>
                          <button onClick={() => { setShowFilters(!showFilters); setShowDresses(false); }} className={`px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${showFilters ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'}`}>Grades</button>
                       </div>
                       <div className="flex gap-4">
                          <button onClick={() => setState(prev => ({ ...prev, edited: prev.original }))} className="px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-slate-900 border border-white/5 text-slate-500 hover:text-white">Restore</button>
                          <button onClick={handleReselect} className="px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500/50 hover:text-red-500">Drop</button>
                       </div>
                    </div>
                  )}
               </div>
            </main>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-12 flex flex-col items-center max-w-7xl mx-auto pb-32">
      <ConfirmModal confirmModal={confirmModal} onClose={() => setConfirmModal(null)} />
      <HelpModal 
        show={showHelpModal} 
        onClose={() => setShowHelpModal(false)}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        isChatting={isChatting}
        onSubmit={handleChatSubmit}
        chatEndRef={chatEndRef}
      />
      
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-16 gap-8 glass-panel p-10 rounded-[45px] border-white/10 animate-[slideUp_0.8s_ease-out]">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 glossy-primary rounded-[24px] flex items-center justify-center shadow-2xl">
            <i className="fa-solid fa-bolt-lightning text-2xl text-white"></i>
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">
              RAFEE <span className="text-blue-500">PHOTO</span> AI
            </h1>
            <p className="text-slate-600 text-[10px] font-black tracking-[0.5em] uppercase">Advanced Reconstruction Core</p>
          </div>
        </div>
        
        <button 
          onClick={() => setConfirmModal({
            show:true, 
            title:"LAUNCH PRO?", 
            message:"Initialize Advanced Synthesis Core?", 
            onConfirm: () => startProModeTransition()
          })}
          className="flex items-center gap-5 px-14 py-5 rounded-3xl font-black text-[13px] tracking-[0.2em] uppercase transition-all duration-700 bg-slate-900 border border-white/10 hover:border-blue-500 hover:bg-blue-600/10 group shadow-2xl active:scale-95"
        >
          <i className="fa-solid fa-shuttle-space group-hover:animate-bounce"></i> Studio Mode
        </button>
      </header>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8 animate-[slideUp_1s_ease-out]">
          {!state.original ? (
            <div className="relative group overflow-hidden glass-panel p-12 rounded-[50px] border-dashed border-2 border-white/10 flex flex-col items-center justify-center hover:border-blue-500 transition-all duration-700 min-h-[500px] shadow-2xl">
              <input type="file" id="photo-upload" className="hidden" onChange={handleFileUpload} accept="image/*" />
              <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center text-center">
                <div className="w-28 h-28 bg-white/5 rounded-[40px] flex items-center justify-center mb-12 border border-white/5 group-hover:scale-110 group-hover:bg-blue-600/15 transition-all shadow-xl">
                  <i className="fa-solid fa-cloud-arrow-up text-slate-400 text-4xl group-hover:text-blue-400"></i>
                </div>
                <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Import Raw</h2>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">Capture Neural Frame</p>
              </label>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-[40px] space-y-6">
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Base Functions</p>
                <GlossyButton onClick={() => handleAction("Remove background perfectly and replace with clean professional solid white")} isLoading={state.isProcessing} className="w-full py-5 text-[11px]" variant="secondary">
                  Clear BG
                </GlossyButton>
                <GlossyButton onClick={() => {setShowDresses(!showDresses); setShowFilters(false);}} className={`w-full py-5 text-[11px] ${showDresses ? 'border-blue-500 text-blue-400 bg-blue-500/10' : ''}`} variant="secondary">
                  Wardrobe Hub
                </GlossyButton>
                <div className="flex gap-4 pt-4 border-t border-white/5">
                   <button onClick={() => setState(prev => ({ ...prev, edited: prev.original }))} className="flex-1 bg-slate-900 py-4 rounded-2xl text-[11px] font-black border border-white/5 text-slate-600 hover:text-white transition-all">Reset</button>
                   <button onClick={handleReselect} className="flex-1 bg-blue-600/10 py-4 rounded-2xl text-[11px] font-black border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 transition-all">Clear</button>
                </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          {state.original && (
            <div className="glass-panel rounded-[65px] p-1 overflow-hidden min-h-[600px] flex flex-col shadow-2xl border-white/5 animate-[zoomIn_0.6s_ease-out]">
              {state.isProcessing ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                   <div className="w-20 h-20 border-t-2 border-blue-500 rounded-full animate-spin mb-8 shadow-[0_0_40px_rgba(59,130,246,0.35)]"></div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-[0.5em]">Synthesizing</h3>
                   <p className="text-[11px] text-slate-600 mt-2 uppercase tracking-widest font-black animate-pulse">Analyzing Neural Pixels</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-12">
                  <div className="flex justify-between items-center mb-10">
                     <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-full border border-white/10 shadow-inner">
                       <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Preview</span>
                     </div>
                     <GlossyButton onClick={handleExport} className="px-14 py-4 text-[12px] shadow-2xl shadow-blue-500/30">Download Result</GlossyButton>
                  </div>
                  <div className="flex-1 flex justify-center items-center">
                    <img src={state.edited || ''} className="max-w-full max-h-[58vh] rounded-[45px] shadow-2xl image-glow border border-white/10" alt="Result" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[3000]">
        <button 
          onClick={() => setShowHelpModal(true)}
          className="px-12 py-4.5 rounded-full glossy-secondary border-white/20 text-blue-400 text-[12px] font-black uppercase tracking-[0.3em] hover:bg-blue-600/10 hover:border-blue-500 transition-all flex items-center gap-5 shadow-[0_30px_80px_rgba(0,0,0,0.9)] active:scale-95"
        >
          <i className="fa-solid fa-circle-question animate-pulse text-xl"></i> Support Hub
        </button>
      </div>
      
      <footer className="mt-20 text-center opacity-30 animate-[fadeIn_2s_ease-out]">
        <p className="text-[10px] font-bold text-slate-700 tracking-[1em] uppercase">
          &copy; {new Date().getFullYear()} {APP_TITLE} • NEURAL RECONSTRUCTION CORE
        </p>
      </footer>
    </div>
  );
};

export default App;
