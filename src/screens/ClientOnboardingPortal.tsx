import React, { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Check, ChevronRight, UploadCloud, Link as LinkIcon, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ClientOnboardingPortal({ leadId }: { leadId: string | null }) {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const steps = ['Creative Direction', 'Assets', 'Analytics', 'Brand Kit', 'Done'];
  const [youtubeConnected, setYoutubeConnected] = useState(false);

  useEffect(() => {
    async function fetchLead() {
      if (!leadId) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'leads', leadId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLead({ id: docSnap.id, ...docSnap.data() });
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchLead();
  }, [leadId]);

  if (loading) return <div className="min-h-screen bg-transparent flex items-center justify-center text-white/40 font-mono text-xs uppercase tracking-[0.2em]">Loading Workspace...</div>;
  if (!lead) return <div className="min-h-screen bg-transparent flex items-center justify-center text-[#FF453A] font-mono text-xs uppercase tracking-[0.2em]">Invalid Link</div>;

  return (
    <div className="bg-black text-white font-sans antialiased min-h-screen relative flex flex-col selection:bg-brand-primary selection:text-white">

        {/* Subtle grid and gradient */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 -z-10 pointer-events-none mix-blend-overlay"></div>
        <div className="fixed inset-0 bg-gradient-to-br from-white/[0.02] via-black to-black -z-10 pointer-events-none"></div>

      {/* Premium Shape Morphing Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <motion.div 
               animate={{ scale: [1, 1.2, 1], x: [0, 60, 0], y: [0, -60, 0], opacity: [0.15, 0.3, 0.15] }}
               transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-white/[0.04] blur-[100px]"
           />
           <motion.div 
               animate={{ scale: [1, 1.4, 1], x: [0, -60, 0], y: [0, 60, 0], opacity: [0.1, 0.2, 0.1] }}
               transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
               className="absolute bottom-[0%] -right-[10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-slate-400/[0.03] blur-[120px]"
           />
      </div>

      {/* Premium Header */}
      <header className="absolute top-0 inset-x-0 h-24 flex items-center justify-between px-8 md:px-16 z-50 backdrop-blur-2xl bg-[#000000]/40 border-b border-white/[0.04]">
        <div className="font-sans font-bold text-2xl tracking-tight text-white flex items-center gap-1">
          Junedit
        </div>
        <div className="flex items-center gap-4 text-[11px] font-medium tracking-[0.2em] uppercase text-white/50">
          Onboarding <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span> {lead.brandName}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-10 mt-16 md:mt-0 relative z-10 w-full max-w-2xl mx-auto">
        <div className="w-full">
          {/* Progress Indication */}
          <div className="flex flex-col gap-4 mb-16">
             <div className="flex items-center justify-between px-2">
                 {steps.map((s, i) => (
                     <div key={s} className="flex flex-col items-center gap-2">
                         <span className={`text-[10px] font-mono uppercase tracking-[0.2em] transition-colors duration-500 ${step > i ? 'text-white' : step === i + 1 ? 'text-white/80' : 'text-white/30'}`}>
                             {s}
                         </span>
                     </div>
                 ))}
             </div>
             <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="flex-1 h-1 rounded-full bg-white/[0.05] relative overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: step >= s ? '100%' : '0%' }}
                      className={`absolute inset-y-0 left-0 ${step > s ? 'bg-white/40' : 'bg-white'}`}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>
                ))}
             </div>
          </div>

          {/* Form Stages */}
          <div className="relative min-h-[500px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                 <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 drop-shadow-sm">{lead.onboardingTitle || 'Creative Direction.'}</h1>
                  <p className="text-xl md:text-2xl text-white/50 mb-12 leading-relaxed font-light max-w-xl">
                    {lead.onboardingMessage || 'To ensure the final edit aligns with your vision, provide us with a few references and your primary goal.'}
                  </p>

                  <div className="space-y-8 bg-white/[0.02] backdrop-blur-[40px] p-10 md:p-12 rounded-[32px] border border-white/[0.08] shadow-[0_30px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] relative">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-white/60 mb-4 flex items-center gap-3">
                        Primary Goal <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                      </label>
                      <div className="relative group">
                         <select className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-6 py-5 text-white/90 focus:outline-none focus:border-white/40 focus:bg-white/[0.06] transition-all duration-300 text-lg appearance-none cursor-pointer group-hover:border-white/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
                           <option value="avd" className="text-black">Maximize Audience Retention (AVD)</option>
                           <option value="conversions" className="text-black">Drive Conversions / Sign-ups</option>
                           <option value="brand" className="text-black">Brand Awareness & Storytelling</option>
                           <option value="engagement" className="text-black">Audience Engagement & Comments</option>
                         </select>
                         <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 rotate-90 pointer-events-none group-hover:text-white/60 transition-colors" size={20} />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-white/60 mb-4 flex items-center gap-3">
                        Style References <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span> Links
                      </label>
                      <textarea placeholder="Paste YouTube/TikTok links of videos with a similar editing style..." rows={4} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-6 py-5 text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:bg-white/[0.06] transition-all duration-300 text-lg resize-none hover:border-white/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"></textarea>
                    </div>
                  </div>

                  <div className="mt-12 flex justify-end">
                    <button onClick={() => setStep(2)} className="bg-white text-black hover:bg-zinc-200 px-10 py-5 rounded-full font-bold text-xs tracking-[0.2em] uppercase transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_40px_rgba(255,255,255,0.3)] hover:-translate-y-1 flex items-center gap-3 active:scale-95 group">
                       Continue <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 drop-shadow-sm">Raw Footage.</h1>
                  <p className="text-xl md:text-2xl text-white/50 mb-12 leading-relaxed font-light max-w-xl">
                    Provide the link to the cloud directory containing your raw video and audio files.
                  </p>

                  <div className="space-y-8 bg-white/[0.02] backdrop-blur-[40px] p-10 md:p-12 rounded-[32px] border border-white/[0.08] shadow-[0_30px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] relative">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-white/60 mb-4 flex items-center gap-3">
                         <LinkIcon size={14} className="text-white/40" /> Directory Link
                      </label>
                      <input type="url" placeholder="Google Drive, Dropbox, Frame.io..." className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-6 py-5 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/[0.06] transition-all duration-300 text-lg hover:border-white/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]" />
                      <p className="text-[13px] text-white/50 mt-6 leading-relaxed p-5 rounded-2xl flex items-center gap-4 border border-white/[0.06] bg-white/[0.01]">
                        <span className="text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] bg-white/10 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px]">!</span> Please ensure permissions are set to "Anyone with the link can view".
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 flex items-center justify-between">
                    <button onClick={() => setStep(1)} className="text-white/40 hover:text-white font-mono text-xs uppercase tracking-[0.2em] transition-colors px-4 py-4">Back</button>
                    <button onClick={() => setStep(3)} className="bg-white text-black hover:bg-zinc-200 px-10 py-5 rounded-full font-bold text-xs tracking-[0.2em] uppercase transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_40px_rgba(255,255,255,0.3)] hover:-translate-y-1 flex items-center gap-3 active:scale-95 group">
                       Continue <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3_analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 drop-shadow-sm">Automated ROI.</h1>
                  <p className="text-xl md:text-2xl text-white/50 mb-12 leading-relaxed font-light max-w-xl">
                    Connect your YouTube channel to securely share read-only video analytics (Views, CTR, AVD) strictly for the videos we edit.
                  </p>

                  <div className="bg-white/[0.02] backdrop-blur-[40px] p-10 md:p-12 rounded-[32px] border border-white/[0.08] shadow-[0_30px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] relative">
                    <div className="flex flex-col items-center justify-center py-10">
                       <div className="w-20 h-20 bg-white/[0.05] border border-white/[0.1] rounded-full flex items-center justify-center mb-6 overflow-hidden">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8 opacity-60"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                       </div>
                       
                       {youtubeConnected ? (
                           <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-3 rounded-xl font-medium tracking-wide flex items-center gap-3">
                               <Check size={18} /> Channel Connected Successfully
                           </div>
                       ) : (
                           <button 
                               onClick={() => {
                                   setYoutubeConnected(true);
                               }}
                               className="bg-white hover:bg-zinc-200 text-black px-8 py-4 rounded-xl font-bold tracking-wide flex items-center gap-3 transition-transform active:scale-95"
                           >
                               <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                               Connect with Google
                           </button>
                       )}
                       
                       <p className="text-[11px] text-white/40 mt-6 max-w-sm text-center">
                           We never share or modify your channel data. This strictly pulls analytics to track the performance of the videos we deliver to you.
                       </p>
                    </div>
                  </div>

                  <div className="mt-12 flex items-center justify-between">
                    <button onClick={() => setStep(2)} className="text-white/40 hover:text-white font-mono text-xs uppercase tracking-[0.2em] transition-colors px-4 py-4">Back</button>
                    <div className="flex items-center gap-4">
                        {!youtubeConnected && (
                            <button onClick={() => setStep(4)} className="text-white/40 hover:text-white font-mono text-xs uppercase tracking-[0.2em] transition-colors px-4 py-4">Skip</button>
                        )}
                        <button onClick={() => setStep(4)} className="bg-white text-black hover:bg-zinc-200 px-10 py-5 rounded-full font-bold text-xs tracking-[0.2em] uppercase transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_40px_rgba(255,255,255,0.3)] hover:-translate-y-1 flex items-center gap-3 active:scale-95 group">
                           Continue <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 drop-shadow-sm">Brand Kit.</h1>
                  <p className="text-xl md:text-2xl text-white/50 mb-12 leading-relaxed font-light max-w-xl">
                    Upload your logos, typography, and brand guidelines to ensure visual consistency.
                  </p>

                  <div className="bg-white/[0.02] backdrop-blur-[40px] p-8 md:p-10 rounded-[32px] border border-white/[0.08] shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative">
                    <div 
                      className={`relative w-full h-[280px] rounded-[24px] border-2 border-dashed ${isDragging ? 'border-white/60 bg-white/[0.05]' : 'border-white/[0.1] hover:border-white/30'} flex flex-col items-center justify-center transition-all duration-300`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files) {
                              setFiles([...files, ...Array.from(e.dataTransfer.files)]);
                          }
                      }}
                    >
                      <input 
                         type="file" 
                         multiple 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                         onChange={(e) => {
                             if (e.target.files) {
                                 setFiles([...files, ...Array.from(e.target.files)]);
                             }
                         }}
                      />
                      <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-6 text-white/40">
                         <UploadCloud size={28} />
                      </div>
                      <div className="text-[14px] text-white/80 font-medium mb-2">Drag and drop assets here</div>
                      <div className="text-[11px] text-white/30 font-mono tracking-widest uppercase">Select from computer</div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <AnimatePresence>
                            {files.map((file, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.3 }}
                                    key={i}
                                    className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-white/90"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center border border-white/[0.1]">
                                        <Palette size={14} className="text-white/60" />
                                    </div>
                                    <span className="truncate max-w-[120px]">{file.name}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                  </div>

                  <div className="mt-12 flex items-center justify-between">
                    <button onClick={() => setStep(3)} className="text-white/40 hover:text-white font-mono text-xs uppercase tracking-[0.2em] transition-colors px-4 py-4">Back</button>
                    <button onClick={() => setStep(5)} className="bg-white text-black hover:bg-zinc-200 px-10 py-5 rounded-full font-bold text-xs tracking-[0.2em] uppercase transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_40px_rgba(255,255,255,0.3)] hover:-translate-y-1 flex items-center gap-3 active:scale-95">
                       Complete Setup <Check size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="s5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} className="absolute inset-0 flex flex-col items-center justify-center text-center mt-10">
                  <div className="w-32 h-32 rounded-full bg-white/[0.03] border border-white/[0.1] flex items-center justify-center mb-10 relative shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                     <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", damping: 15 }}>
                       <Check size={48} className="text-white" strokeWidth={1.5} />
                     </motion.div>
                     <div className="absolute inset-0 rounded-full border border-white/[0.2] animate-ping" style={{ animationDuration: '3s' }}></div>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">You're all set.</h1>
                  <p className="text-xl text-white/50 mb-10 leading-relaxed font-light max-w-lg mx-auto">
                    We've received your assets. Our editorial team will begin processing immediately. You can safely close this window.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

    </div>
  );
}
