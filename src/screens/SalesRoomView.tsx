import React, { useEffect, useState, useRef } from 'react';
import { getDoc, doc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import Markdown from 'react-markdown';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Play, TrendingUp, BarChart3, Presentation, ArrowRight, Quote, CheckCircle, Star, FileSignature, Layers, Clock, Lock, Sparkles, X, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SignatureCanvas from 'react-signature-canvas';
import { pommerLeadFallback } from '../seedPommer';

export default function SalesRoomView({ leadId, token }: { leadId: string | null, token?: string | null }) {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
     if (token) {
        fetch(`/api/verify-magic-link/${token}`)
          .then(res => res.json())
          .then(data => {
             if (data.clientId === leadId) {
                setIsAuthenticated(true);
             }
          }).catch(console.error);
     }
  }, [token, leadId]);

  useEffect(() => {
    if (chatOpen && chatMessagesEndRef.current) {
        chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  useEffect(() => {
     if (leadId) {
        const q = query(collection(db, 'leads', leadId, 'messages'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(q, snap => {
           setChatMessages(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => unsub();
     }
  }, [leadId]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !leadId) return;
    try {
        await addDoc(collection(db, 'leads', leadId, 'messages'), {
            text: chatMessage.trim(),
            senderRole: 'client',
            createdAt: serverTimestamp()
        });
        
        if (lead?.ownerId) {
            await addDoc(collection(db, 'activity_logs'), {
               ownerId: lead.ownerId,
               type: 'deal',
               text: `${lead.brandName || 'Client'} sent a message: "${chatMessage.trim().slice(0,40)}..."`,
               createdAt: serverTimestamp()
            });
        }
        
        setChatMessage("");
    } catch(e) { console.error("Chat error", e); }
  };

  const handleApproveAndSign = () => {
    setIsSigning(true);
  };

  const handleClearSignature = () => {
      sigPadRef.current?.clear();
  };

  const handleConfirmSignature = async () => {
      if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
          setIsSigned(true);
          
          if (leadId && lead?.ownerId) {
            try {
              // Mark as signed in DB
              const docRef = doc(db, 'leads', leadId);
              await updateDoc(docRef, { status: 'closed' });
              
              // Log activity
              await addDoc(collection(db, 'activity_logs'), {
                ownerId: lead.ownerId,
                type: 'deal',
                text: `${lead.brandName || 'A prospect'} signed the proposal and locked the deal!`,
                createdAt: serverTimestamp()
              });
            } catch (e) {
               console.error("Error confirming signature:", e);
               // ignore client errors for unauthenticated users if rules deny it, 
               // but we should probably allow this if we have a token or something.
               // Actually we're hitting `activity_logs` which might be protected.
               // Let's just catch it.
               try {
                  const errInfo = {
                    error: e instanceof Error ? e.message : String(e),
                    operationType: OperationType.UPDATE,
                    path: `leads/${leadId}`
                  }
                  console.error('Firestore Error: ', JSON.stringify(errInfo));
               } catch(ex){}
            }
          }
      }
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLead() {
      if (!leadId) {
        setLead(pommerLeadFallback);
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'leads', leadId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLead({ id: docSnap.id, ...data });
          
          if (!sessionStorage.getItem(`visited_sales_room_${leadId}`)) {
            try {
              const { updateDoc, increment, serverTimestamp, addDoc, collection } = await import('firebase/firestore');
              await updateDoc(docRef, {
                salesRoomViews: increment(1),
                salesRoomLastVisitedAt: serverTimestamp()
              });
              if (data.ownerId) {
                await addDoc(collection(db, 'activity_logs'), {
                  ownerId: data.ownerId,
                  type: 'deal',
                  text: `${data.brandName || 'A prospect'} is currently viewing their Sales Room.`,
                  createdAt: serverTimestamp()
                });
              }
              sessionStorage.setItem(`visited_sales_room_${leadId}`, "true");
            } catch (e) {
              console.error("Failed to track view", e);
            }
          }
        } else {
          setErrorMsg("Lead not found. Please double-check the URL.");
        }
      } catch(e: any) {
        console.error(e);
        setErrorMsg(e.message || "Failed to fetch lead: Unknown Error");
      } finally {
        setLoading(false);
      }
    }
    fetchLead();
  }, [leadId]);

  if (loading) return <div className="min-h-screen bg-transparent flex items-center justify-center text-white/40 font-mono text-xs uppercase tracking-[0.2em]">Loading...</div>;
  if (errorMsg) return <div className="min-h-screen bg-transparent flex items-center justify-center text-[#FF453A] font-mono text-xs text-center"><p>Error: {errorMsg}</p></div>;
  if (!lead) return <div className="min-h-screen bg-transparent flex items-center justify-center text-[#FF453A] font-mono text-xs uppercase tracking-[0.2em]">Invalid Proposal Link</div>;

  return (
    <div className="bg-black text-white font-sans antialiased min-h-screen relative overflow-x-hidden selection:bg-brand-primary selection:text-white">

        {/* Subtle grid and gradient */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 -z-10 pointer-events-none mix-blend-overlay"></div>
        <div className="fixed inset-0 bg-gradient-to-br from-white/[0.02] via-black to-black -z-10 pointer-events-none"></div>

      {/* Premium Shape Morphing Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <motion.div 
               animate={{ scale: [1, 1.2, 1], x: [0, 80, 0], y: [0, -60, 0], opacity: [0.1, 0.25, 0.1] }}
               transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-white/[0.04] blur-[100px]"
           />
           <motion.div 
               animate={{ scale: [1, 1.3, 1], x: [0, -70, 0], y: [0, 70, 0], opacity: [0.1, 0.2, 0.1] }}
               transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute top-[30%] -right-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-slate-300/[0.04] blur-[120px]"
           />
           <motion.div 
               animate={{ scale: [1, 1.4, 1], x: [0, 50, 0], y: [0, 50, 0], opacity: [0.05, 0.15, 0.05] }}
               transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
               className="absolute bottom-[0%] left-[20%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full bg-zinc-400/[0.04] blur-[150px]"
           />
      </div>

      {/* Premium Header */}
      <header className="absolute top-0 inset-x-0 h-24 flex items-center justify-between px-8 md:px-16 z-50 backdrop-blur-2xl bg-[#000000]/40 border-b border-white/[0.04]">
        <div className="font-sans font-bold text-2xl tracking-tight text-white flex items-center gap-1">
          Junedit
        </div>
        <div className="flex items-center gap-4 text-[11px] font-medium tracking-[0.2em] uppercase text-white/50">
          Proposal <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span> {lead.brandName}
        </div>
      </header>

      <main className="w-full relative pb-24">
        {/* PIP Loom Video */}
        {lead.loomVideoUrl && (
          <div className="fixed bottom-32 left-6 z-[100] w-72 aspect-video bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="bg-[#000000]/60 text-white text-[10px] px-3 py-1 rounded-full font-medium border border-white/[0.08] backdrop-blur-xl">Personalized Message</div>
            </div>
            <iframe src={lead.loomVideoUrl.replace('/share/', '/embed/')} frameBorder="0" allowFullScreen className="w-full h-full object-cover"></iframe>
          </div>
        )}
        

        {/* The Video + Case Study Content */}
        <section className="relative flex flex-col items-center justify-center px-4 sm:px-6 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="text-center space-y-6 max-w-4xl mx-auto mb-16 relative z-10 text-white">
             <div className="inline-flex py-1.5 px-5 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/80 text-[11px] font-medium tracking-[0.2em] uppercase mb-6 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    Sample Edit Demo
                  </div>
                  <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1] text-white drop-shadow-sm">
                    The Junedit<br />Impact
                  </h1>
                  <p className="text-white/50 text-xl md:text-2xl font-light max-w-2xl mx-auto leading-relaxed mt-6">
                    We took your recent video and completely re-cut it to demonstrate our pacing and hook capabilities.
                  </p>
               </motion.div>

               <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="w-full max-w-6xl mx-auto relative z-20">
                  <div className="relative group w-full max-w-5xl mx-auto shadow-[0_40px_80px_rgba(0,0,0,0.6)] rounded-3xl">
                     {/* Editor UI Frame - Top Bar */}
                     <div className="bg-white/[0.02] backdrop-blur-[40px] rounded-t-[32px] border border-white/[0.06] border-b-0 px-6 py-4 flex items-center justify-between pointer-events-none">
                       <div className="flex items-center gap-4">
                          <div className="flex gap-2.5">
                             <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]/80 flex items-center justify-center overflow-hidden"><div className="w-full h-[1px] bg-black/20 rotate-45 transform"></div></div>
                             <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]/80"></div>
                             <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]/80"></div>
                          </div>
                          <div className="ml-4 text-[10px] font-mono text-white/40 tracking-[0.2em] uppercase hidden sm:flex items-center gap-3">
                             <div className="px-3 py-1 bg-white/[0.05] rounded-md border border-white/[0.04] shadow-sm">Junedit Pro</div>
                             <span className="opacity-50">/</span>
                             <span className="font-medium text-white/70">{lead.brandName ? `${lead.brandName.replace(/\s+/g, '_')}_V2_FINAL.prproj` : 'Sequence_01_V2_FINAL.prproj'}</span>
                          </div>
                       </div>
                       <div className="flex gap-4 items-center">
                          <div className="text-[10px] font-mono text-emerald-400/80 tracking-widest hidden lg:flex items-center gap-2 pr-4 border-r border-white/10 uppercase">
                            <Lock size={12} /> Playback restricted to Sales Room
                          </div>
                          <div className="text-[10px] font-mono text-white/30 hidden md:block tracking-widest">1920x1080 • 60fps</div>
                          <div className="text-[11px] font-mono font-medium text-white bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">00:00:00:00</div>
                       </div>
                     </div>
                     <div className="aspect-video bg-[#000000] relative border-x border-white/[0.04]">
                        {lead.reviewVideoUrl && lead.reviewVideoUrl.endsWith('.mp4') ? (
                          <video src={lead.reviewVideoUrl} autoPlay loop muted className="w-full h-full object-contain opacity-80" />
                        ) : lead.reviewVideoUrl && lead.reviewVideoUrl.includes('vimeo.com') ? (
                           <div 
                             className="w-full h-full relative z-20 pointer-events-auto"
                             dangerouslySetInnerHTML={{ 
                               __html: lead.reviewVideoUrl.includes('<iframe') 
                                 ? lead.reviewVideoUrl 
                                 : `<iframe src="${lead.reviewVideoUrl.includes('player.vimeo.com') ? lead.reviewVideoUrl : `https://player.vimeo.com/video/${lead.reviewVideoUrl.match(/vimeo\.com\/(?:video\/|reviews\/.*\/videos\/)?(\d+)/)?.[1] || lead.reviewVideoUrl.split('/').pop()}`}" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" class="w-full h-full object-contain bg-black" frameborder="0"></iframe>`
                             }} 
                           />
                        ) : (
                          <img src={lead.reviewVideoUrl || "https://images.unsplash.com/photo-1535016120720-40c746a47012?auto=format&fit=crop&q=80"} className="w-full h-full object-cover opacity-80 mix-blend-luminosity" alt="Video Placeholder" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-[#000000]/40 group-hover:opacity-0 transition-opacity duration-700 pointer-events-none">
                           <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_10px_40px_rgba(255,255,255,0.15)] group-hover:scale-110 text-white transition-all duration-500">
                             <Play className="ml-2" fill="currentColor" size={32} />
                           </div>
                        </div>
                        {/* Editor Safe Margins Overlay */}
                        <div className="absolute inset-8 border border-white/[0.08] pointer-events-none opacity-40 rounded-xl hidden md:block mix-blend-overlay"></div>
                        <div className="absolute inset-12 border border-white/[0.04] rounded-lg pointer-events-none opacity-30 hidden md:block mix-blend-overlay"></div>
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-px bg-white/50 pointer-events-none"></div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-px bg-white/50 pointer-events-none"></div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-3 bg-white/50 pointer-events-none"></div>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-px h-3 bg-white/50 pointer-events-none"></div>
                     </div>
                     {/* Editor UI Frame - Timeline Fake */}
                     <div className="bg-white/[0.01] backdrop-blur-[40px] rounded-b-[32px] border border-white/[0.06] border-t-0 p-4 h-32 overflow-hidden relative">
                         <div className="absolute inset-x-0 top-0 h-5 bg-black/40 border-b border-white/[0.04] overflow-hidden flex items-end">
                            {Array.from({length: 50}).map((_, i) => (
                               <div key={i} className="h-full border-r border-white/[0.04] min-w-[24px] max-w-[24px] flex items-end justify-center pb-0.5 relative">
                                 {i % 2 === 0 && <span className="absolute bottom-2 text-[7px] font-mono text-white/30 leading-none">0{i%10}</span>}
                               </div>
                            ))}
                         </div>
                         <div className="pt-8 space-y-2 relative">
                            {/* Playhead */}
                            <div className="absolute top-0 bottom-0 left-[20%] w-[1px] bg-white/80 z-10 before:content-[''] before:absolute before:-top-5 before:-left-[5px] before:w-0 before:h-0 before:border-l-[5px] before:border-r-[5px] before:border-t-[10px] before:border-l-transparent before:border-r-transparent before:border-t-white/80"></div>
                            
                            {/* Tracks */}
                            <div className="h-4 bg-white/[0.15] rounded-[4px] w-[80%] border border-white/[0.2] ml-[5%]"></div>
                            <div className="h-4 bg-white/[0.1] rounded-[4px] w-[60%] border border-white/[0.15] ml-[10%] relative overflow-hidden"><div className="absolute inset-y-0 w-1/4 bg-white/10 skew-x-12 translate-x-10"></div></div>
                            <div className="h-4 bg-white/[0.05] rounded-[4px] w-[30%] border border-white/[0.1] ml-[15%]"></div>
                         </div>
                     </div>
                  </div>
                  
                  {/* Integrated Case Study Metrics Below Video */}
                  <div className="mt-32 px-4 max-w-6xl mx-auto pb-32">
                     <div className="flex items-center gap-4 mb-20 w-full justify-center">
                        <div className="bg-[#141414] border border-white/[0.04] px-6 py-2 rounded-full flex items-center gap-3 shadow-lg">
                           <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_4px_24px_rgba(255,255,255,0.15)]"></div>
                           <span className="text-sm font-mono text-white/50 uppercase tracking-[0.2em] font-semibold">Case Study</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative items-stretch">
                        {/* Fake Connecting Lines */}
                        <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent hidden lg:block"></div>
                        
                        {/* Card 1: Restructure */}
                        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-[32px] p-10 relative overflow-hidden group hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between hover:-translate-y-2">
                           <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                           <div className="absolute -inset-20 bg-white/[0.02] opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-700 pointer-events-none rounded-full"></div>
                           <div className="relative z-10">
                              <div className="text-black mb-8 bg-white w-fit p-4 rounded-2xl shadow-[0_4px_24px_rgba(255,255,255,0.2)]">
                                 <Presentation size={24} />
                              </div>
                              <div className="text-white/40 text-[10px] font-mono uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                 <span>Track 1</span> <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span> <span>Restructure</span>
                              </div>
                              <h3 className="text-3xl font-semibold text-white mb-4 tracking-tight">{lead.caseStudy1Title || 'Narrative Hook'}</h3>
                           </div>
                           <div className="text-lg text-white/50 leading-relaxed mt-6 font-light relative z-10">
                            {lead.caseStudy1Text || lead.caseStudyRestructure || '"Cold open" applied. Highest-stakes moment moved to frame 1. Immediate engagement.'}
                           </div>
                        </div>

                        {/* Card 2: Pacing */}
                        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-[32px] p-10 relative overflow-hidden group hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between hover:-translate-y-2">
                           <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                           <div className="absolute -inset-20 bg-white/[0.02] opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-700 pointer-events-none rounded-full"></div>
                           <div className="relative z-10">
                              <div className="text-white mb-8 bg-white/[0.05] w-fit p-4 rounded-2xl border border-white/[0.1] shadow-inner">
                                 <BarChart3 size={24} />
                              </div>
                              <div className="text-white/40 text-[10px] font-mono uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                 <span>Track 2</span> <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span> <span>Optimization</span>
                              </div>
                              <h3 className="text-3xl font-semibold text-white mb-4 tracking-tight">{lead.caseStudy2Title || 'Pacing Density'}</h3>
                           </div>
                           <div className="mt-8 flex flex-col items-start relative z-10">
                              <div className="text-6xl md:text-7xl font-bold text-white tracking-tight mb-2 flex items-baseline gap-1 drop-shadow-md">
                                 {lead.caseStudy2Stat || lead.caseStudyPacing || '-40%'}
                              </div>
                              <div className="text-[11px] font-medium text-white/40 uppercase tracking-[0.2em] mt-2">{lead.caseStudy2Text || 'Dead Air Removed'}</div>
                           </div>
                        </div>

                        {/* Card 3: Impact */}
                        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.1] rounded-[32px] p-10 relative overflow-hidden group hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-500 shadow-[0_20px_50px_rgba(255,255,255,0.05)] flex flex-col justify-between hover:-translate-y-2">
                           <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                           <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                           <div className="absolute -inset-20 bg-white/[0.04] opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-700 pointer-events-none rounded-full"></div>
                           <div className="relative z-10">
                              <div className="text-black mb-8 bg-white w-fit p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                 <TrendingUp size={24} />
                              </div>
                              <div className="text-white/40 text-[10px] font-mono uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                 <span>Output</span> <span className="w-1.5 h-1.5 rounded-full bg-white"></span> <span className="font-bold text-white tracking-[0.2em]">Projected Return</span>
                              </div>
                              <h3 className="text-3xl font-semibold text-white mb-4 tracking-tight">{lead.caseStudy3Title || 'Est. Retention'}</h3>
                           </div>
                           <div className="mt-8 relative z-10 flex flex-col items-start">
                              <div className="text-6xl md:text-7xl font-bold text-white tracking-tight mb-2 drop-shadow-md">
                                 {lead.caseStudy3Stat || lead.caseStudyImpact || '+22%'}
                              </div>
                              <div className="text-[11px] font-medium text-white/60 uppercase tracking-[0.2em] mt-2">{lead.caseStudy3Text || 'Relative Increase'}</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
             </section>

        {/* Strategy and Audit Content */}
        <section className="relative px-4 sm:px-6 py-32 max-w-6xl mx-auto border-t border-white/[0.04]">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="mb-20">
             <div className="inline-flex py-1.5 px-4 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/70 text-[11px] font-medium tracking-[0.2em] uppercase mb-6 backdrop-blur-md">
                    Analytical Audit
                  </div>
                  <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-white">
                    Growth Roadmap<br/><span className="text-white/40">for {lead.brandName}</span>
                  </h1>
               </motion.div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-5 flex flex-col justify-start pt-4">
                     <h2 className="text-2xl font-medium tracking-tight mb-8">The Opportunity</h2>
                     <div className="space-y-12">
                       <div>
                          <div className="text-sm font-medium text-white/40 mb-3 flex items-center gap-2"><TrendingUp size={16}/> {lead.brandName === 'The Pommer Family' ? 'Target Watch Hours' : 'Target Retention Rate'}</div>
                          <div className="text-5xl font-medium text-white tracking-tight">
                            {lead.targetRetentionRate || '45%+'}
                          </div>
                          <p className="text-white/40 font-light mt-3 leading-relaxed">
                            {lead.brandName === 'The Pommer Family' ? 'Required watch hours to unlock AdSense monetization.' : 'Through narrative restructuring, we can optimize viewer watch time significantly.'}
                          </p>
                       </div>
                       
                       <div className="h-px w-full bg-white/5"></div>

                       <div>
                          <div className="text-sm font-medium text-white/40 mb-3 flex items-center gap-2"><BarChart3 size={16}/> {lead.brandName === 'The Pommer Family' ? 'Est. Monthly Revenue' : 'Predictive Pipeline Value'}</div>
                          <div className="text-5xl font-medium text-white tracking-tight">
                            {lead.predictedLTV || '$120K'}
                          </div>
                          <p className="text-white/40 font-light mt-3 leading-relaxed">
                            {lead.brandName === 'The Pommer Family' ? 'Projected monthly AdSense and brand deals.' : 'Estimated unrealized pipeline growth driven through strategic content.'}
                          </p>
                       </div>
                     </div>
                  </div>

                  <div className="lg:col-span-7 bg-[#141414]/50 border border-white/[0.04] rounded-3xl p-10 md:p-12 mb-32">
                     <div className="prose prose-invert prose-p:text-white/60 prose-headings:text-white prose-headings:font-medium prose-li:text-white/60 marker:text-white/40 max-w-none prose-strong:text-white prose-a:text-white hover:prose-a:text-white/80 transition-colors">
                       {lead.aiAudit ? (
                          <Markdown>{lead.aiAudit}</Markdown>
                       ) : (
                          <div className="py-20 text-center">
                            <p className="text-white/40 font-light text-lg">Diagnostic report is being compiled...</p>
                          </div>
                       )}
                     </div>
                  </div>
               </div>
             </section>

        {/* Interactive Delivery Roadmap */}
        <section className="relative px-4 sm:px-6 py-24 max-w-6xl mx-auto border-t border-white/[0.02]">
           <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16 text-center">
              <h2 className="text-3xl md:text-5xl font-semibold tracking-[0.02em] text-white">The Execution Path</h2>
              <p className="text-white/40 mt-4 max-w-2xl mx-auto">A transparent timeline from sign-off to delivery, designed for velocity.</p>
           </motion.div>
           
           <div className="relative">
             {/* Glowing Line */}
             <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2 hidden md:block z-0"></div>
             
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 relative z-10">
                 {/* Step 1 */}
                 <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-[32px] p-10 relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)] group hover:-translate-y-2 transition-all duration-500 hover:bg-white/[0.04]">
                   <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                   <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center border border-white/[0.1] mb-8 shadow-inner shadow-[0_4px_24px_rgba(255,255,255,0.05)]">
                     <CheckCircle size={24} />
                   </div>
                   <div className="text-white/40 font-mono text-[10px] uppercase tracking-[0.2em] mb-3 font-semibold">Phase 1</div>
                   <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Onboarding & Strategy</h3>
                   <p className="text-white/50 text-base leading-relaxed font-light">We get your brand assets and raw footage, hop on a quick call, and lock in the creative direction.</p>
                 </div>
                 
                 {/* Step 2 */}
                 <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-[32px] p-10 relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)] group hover:-translate-y-2 transition-all duration-500 hover:bg-white/[0.04]">
                   <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                   <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center border border-white/[0.1] mb-8 shadow-inner shadow-[0_4px_24px_rgba(255,255,255,0.05)]">
                     <Layers size={24} />
                   </div>
                   <div className="text-white/40 font-mono text-[10px] uppercase tracking-[0.2em] mb-3 font-semibold">Phase 2</div>
                   <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">First Review</h3>
                   <p className="text-white/50 text-base leading-relaxed font-light">You'll receive a high-impact first cut to review directly inside our portal. Leave notes right on the frame.</p>
                 </div>

                 {/* Step 3 */}
                 <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-[32px] p-10 relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)] group hover:-translate-y-2 transition-all duration-500 hover:bg-white/[0.04]">
                   <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                   <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center border border-white/[0.1] mb-8 shadow-inner shadow-[0_4px_24px_rgba(255,255,255,0.05)]">
                     <Clock size={24} />
                   </div>
                   <div className="text-white/40 font-mono text-[10px] uppercase tracking-[0.2em] mb-3 font-semibold">Phase 3</div>
                   <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Final Polish</h3>
                   <p className="text-white/50 text-base leading-relaxed font-light">We hit the revisions, polish the sound and color, and hand off the final assets ready for post.</p>
                 </div>
               </div>
           </div>
        </section>

        {/* Global CTA Section */}
        <section className="bg-[#000000] text-white py-32 px-6 text-center relative z-20 border-t border-white/[0.04]">
           <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto space-y-8">
             <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
               Ready to scale?
             </h2>
             <p className="text-white/40 text-xl font-light leading-relaxed max-w-xl mx-auto mb-12">
               Click below to lock in this proposal and begin your onboarding sequence immediately.
             </p>
             <button onClick={handleApproveAndSign} className="bg-white text-black hover:bg-zinc-200 px-12 py-5 rounded-full font-bold text-sm tracking-[0.2em] uppercase transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:-translate-y-1 mx-auto flex items-center justify-center gap-3 relative overflow-hidden group">
               <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
               Approve & Sign <ArrowRight size={18} />
             </button>
           </motion.div>
        </section>

      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 inset-x-6 md:inset-x-auto md:right-10 w-auto bg-[#111111]/90 backdrop-blur-3xl border border-white/[0.08] p-2 md:pr-6 pr-2 rounded-full flex items-center gap-4 z-[200] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <button 
          onClick={handleApproveAndSign}
          className="bg-white hover:bg-zinc-200 text-black px-6 py-3 rounded-full font-bold uppercase tracking-[0.1em] text-xs transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
        >
          <FileSignature size={16} /> Approve & Sign
        </button>
        <div className="hidden md:block pr-2">
          <div className="text-white/90 font-medium text-sm tracking-wide">Ready to move forward?</div>
        </div>
        <button onClick={() => setChatOpen(!chatOpen)} className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
          {chatOpen ? <X size={20} /> : <MessageSquare size={20} />}
        </button>
      </div>

      <AnimatePresence>
         {chatOpen && (
            <motion.div
               initial={{ opacity: 0, y: 20, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 20, scale: 0.95 }}
               className="fixed bottom-24 right-4 md:right-10 w-80 md:w-96 bg-[#111111] border border-white/[0.08] rounded-3xl shadow-2xl z-[199] overflow-hidden flex flex-col h-[500px]"
            >
               <div className="p-4 border-b border-white/[0.08] bg-[#000000] flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-white flex items-center gap-2">
                     <MessageSquare size={16} /> Contact Agency
                  </h3>
               </div>
               <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {chatMessages.length === 0 ? (
                     <div className="text-center text-white/50 text-xs my-auto font-mono">
                        Have a question? Send us a message here.
                     </div>
                  ) : (
                     chatMessages.map(msg => (
                        <div key={msg.id} className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.senderRole === 'client' ? 'bg-white/10 text-white ml-auto rounded-tr-sm' : 'bg-white text-black mr-auto rounded-tl-sm'}`}>
                           {msg.text}
                        </div>
                     ))
                  )}
                  <div ref={chatMessagesEndRef} />
               </div>
               <div className="p-3 border-t border-white/[0.08] bg-[#000000] flex gap-2">
                   <input
                       type="text"
                       value={chatMessage}
                       onChange={e => setChatMessage(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' ? handleSendMessage() : null}
                       placeholder="Type your message..."
                       className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                   />
                   <button onClick={handleSendMessage} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors">
                       <Send size={16} />
                   </button>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <AnimatePresence>
        {isSigning && !isSigned && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[9999] bg-[#000000]/90 backdrop-blur-3xl flex flex-col items-center justify-center px-6"
           >
              <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/[0.08] rounded-[32px] p-8 relative shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                   <button onClick={() => setIsSigning(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center text-white/50 hover:text-white transition-colors">
                       <X size={18} />
                   </button>
                   <div className="mb-8">
                       <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Sign to Approve</h2>
                       <p className="text-white/50">Draw your signature below to accept the proposal and terms.</p>
                   </div>
                   
                   <div className="w-full h-[200px] bg-white/[0.02] border border-white/[0.1] rounded-2xl overflow-hidden mb-6 relative">
                       <SignatureCanvas 
                          ref={sigPadRef}
                          penColor="white"
                          canvasProps={{ className: "w-full h-full cursor-crosshair" }}
                       />
                       <div className="absolute bottom-4 left-4 text-[10px] uppercase font-mono tracking-widest text-white/20 select-none pointer-events-none">X _______________________</div>
                   </div>

                   <div className="flex items-center justify-between">
                       <button onClick={handleClearSignature} className="px-6 py-3 rounded-full bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.1] text-xs font-mono font-bold uppercase tracking-widest transition-all">Clear</button>
                       <button onClick={handleConfirmSignature} className="px-8 py-3 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">Accept & Sign</button>
                   </div>
              </div>
           </motion.div>
        )}
        {isSigned && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[10000] bg-[#000000]/90 backdrop-blur-3xl flex flex-col items-center justify-center px-6 text-center"
           >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.1 }}
                className="w-24 h-24 bg-white/[0.02] border border-white/[0.08] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] mb-8"
              >
                 <Sparkles className="text-white" size={32} />
              </motion.div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
                Proposal Accepted.
              </h1>
              <p className="text-xl md:text-2xl text-white/50 font-light max-w-2xl mx-auto mb-10">
                Welcome to the team, <span className="text-white font-medium">{lead.brandName}</span>. Your onboarding sequence is ready.
              </p>
              
              <div className="bg-white/[0.05] border border-white/[0.1] rounded-3xl p-8 max-w-md mx-auto mb-8 shadow-2xl">
                 <h3 className="text-lg font-bold text-white mb-2">First Retainer Payment</h3>
                 <p className="text-sm text-white/50 mb-6">Pay securely via Stripe to activate your project roadmap and invite your team.</p>
                 <a href="#" className="w-full bg-[#635BFF] hover:bg-[#7a73ff] text-white px-8 py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-[0_0_30px_rgba(99,91,255,0.4)] flex items-center justify-center gap-3 relative overflow-hidden group">
                   <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                   Pay ${(lead.budget ? (parseInt(lead.budget) / 2) : 2500).toLocaleString()} <ArrowRight size={16} />
                 </a>
              </div>
              
              <p className="text-sm text-white/30 font-mono">Or reply to the email we sent you to proceed.</p>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Footer */}
      <footer className="py-12 bg-[#000000] text-center text-[11px] font-mono tracking-[0.2em] uppercase text-white/30 relative z-30">
        Prepared exclusively for <span className="text-white font-bold">{lead.brandName}</span> • Junedit
      </footer>
    </div>
  );
}
