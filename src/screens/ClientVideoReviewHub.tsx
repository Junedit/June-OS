import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getDoc, doc, collection, addDoc, updateDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
const Player = ReactPlayer as any;
import { Play, Pause, MessageSquare, Clock, Send, Hash, ChevronDown, Maximize2, MousePointer2, PenTool, Check, Undo2, Video, CreditCard, Lock, ArrowRight, XCircle, Download, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../contexts/AuthContext';
import { getAI } from '../services/ai';
import { toast } from 'sonner';

type Reply = {
  id: string;
  text: string;
  author: string;
  createdAt: any;
};

type Comment = {
  id: string;
  time: number;
  text: string;
  author: string;
  createdAt: any;
  replies: Reply[];
  version: 'V1' | 'V2';
  resolved?: boolean;
  drawingData?: string;
};

export default function ClientVideoReviewHub({ leadId, token }: { leadId?: string | null; token?: string | null }) {
  const { user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lead, setLead] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'changes_requested'>('pending');
  const [showNotification, setShowNotification] = useState<{type: 'approved' | 'changes', visible: boolean}>({ type: 'approved', visible: false });
  const [version, setVersion] = useState<'V1' | 'V2'>('V2');
  const [todoMode, setTodoMode] = useState(false);
  const [activeTool, setActiveTool] = useState<'pointer' | 'pen'>('pointer');
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [synthesizing, setSynthesizing] = useState(false);
  const [checklistModal, setChecklistModal] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  useEffect(() => {
     if (token && leadId) {
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
     if (leadId) {
        const unsubLead = onSnapshot(doc(db, 'leads', leadId), d => {
           if (d.exists()) setLead({ id: d.id, ...d.data() });
        });
        
        const q = query(collection(db, 'leads', leadId, 'video_comments'), orderBy('time', 'asc'));
        const unsub = onSnapshot(q, snap => {
           setComments(snap.docs.map(d => ({id: d.id, ...d.data()} as Comment)));
        });
        return () => { unsubLead(); unsub(); };
     }
  }, [leadId]);

  const toTimecode = (seconds: number, fps = 24) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * fps);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  const handleExportNLE = () => {
    const header = "Marker Name,Description,In,Out,Duration,Marker Type\n";
    const rows = comments.map((c, i) => {
      const tc = toTimecode(c.time);
      const row = [
        `"Comment ${i + 1}"`,
        `"${c.text.replace(/"/g, '""')}"`,
        `${tc}`,
        `${tc}`,
        `00:00:00:00`,
        `Comment`
      ];
      return row.join(',');
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Markers_NLE.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (playerRef.current && progressRef.current) {
        const rect = progressRef.current.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        playerRef.current.seekTo(Math.max(0, Math.min(pos * duration, duration)));
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !playerRef.current) return;

    const time = parseFloat(playerRef.current.getCurrentTime().toFixed(2));
    const drawingData = !sigCanvasRef.current?.isEmpty() ? sigCanvasRef.current?.toDataURL() : undefined;

    const newDoc = {
       time,
       text: newComment,
       author: 'Client',
       createdAt: serverTimestamp(),
       replies: [],
       version,
       drawingData: drawingData || null
    };

    if (leadId) {
        await addDoc(collection(db, 'leads', leadId, 'video_comments'), newDoc);
        if (lead?.ownerId) {
            await addDoc(collection(db, 'activity_logs'), {
              ownerId: lead.ownerId,
              type: 'system',
              text: `Client left a video comment at ${toTimecode(time)}.`,
              createdAt: serverTimestamp()
            });
        }
    }

    setNewComment('');
    setActiveTool('pointer');
    sigCanvasRef.current?.clear();
    setTodoMode(false); // Switch out of todo mode to see new comment clearly
  };

  const handleResolveComment = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const target = comments.find(c => c.id === id);
      if (target && leadId) {
          await updateDoc(doc(db, 'leads', leadId, 'video_comments', id), {
              resolved: !target.resolved
          });
      }
  };

  const handleAddReply = async (commentId: string) => {
      if (!replyText.trim() || !leadId) return;
      const target = comments.find(c => c.id === commentId);
      if (target) {
          const newReplies = [
              ...target.replies,
              {
                  id: Math.random().toString(),
                  text: replyText,
                  author: 'Client',
                  createdAt: new Date().toISOString()
              }
          ];
          await updateDoc(doc(db, 'leads', leadId, 'video_comments', commentId), {
              replies: newReplies
          });
          if (lead?.ownerId) {
             await addDoc(collection(db, 'activity_logs'), {
               ownerId: lead.ownerId,
               type: 'system',
               text: `Client replied to a video comment.`,
               createdAt: serverTimestamp()
             });
          }
      }
      
      setReplyText('');
      setReplyingTo(null);
  }

  const handleApprove = async () => {
      setApprovalStatus('approved');
      setShowNotification({ type: 'approved', visible: true });
      setTimeout(() => setShowNotification(prev => ({ ...prev, visible: false })), 4000);
      
      if (leadId && lead?.ownerId) {
          try {
              // Update delivery stage
              await updateDoc(doc(db, 'leads', leadId), {
                  deliveryStage: 'done'
              });
              // Send notification to radar / dashboard
              await addDoc(collection(db, 'activity_logs'), {
                  ownerId: lead.ownerId,
                  type: 'system',
                  text: `Client explicitly Approved ${version} of the video!`,
                  createdAt: serverTimestamp()
              });
          } catch(e) {}
      }
  };

  const handleRequestChanges = async () => {
      setApprovalStatus('changes_requested');
      setShowNotification({ type: 'changes', visible: true });
      setTimeout(() => setShowNotification(prev => ({ ...prev, visible: false })), 4000);
      
      if (leadId && lead?.ownerId) {
          try {
              await updateDoc(doc(db, 'leads', leadId), {
                  deliveryStage: 'feedback'
              });
              await addDoc(collection(db, 'activity_logs'), {
                  ownerId: lead.ownerId,
                  type: 'system',
                  text: `Client requested changes on ${version} of the video.`,
                  createdAt: serverTimestamp()
              });
          } catch(e) {}
      }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSynthesizeFeedback = async () => {
    const ai = getAI();
    if (!ai) return toast.error("AI not initialized");
    setSynthesizing(true);
    try {
       const relevantComments = comments.filter(c => c.version === version && !c.resolved);
       const textDump = relevantComments.map(c => `[${formatTime(c.time)}] ${c.author}: ${c.text}`).join('\n');
       
       const prompt = `You are an expert video editor manager. Synthesize the following raw client feedback into a strict, formatted "Editor's Checklist" and also provide a brief sentiment analysis.
Format:
**[Sentiment Analysis]**: (1 sentence on client mood)
**[Editor's Checklist]**:
- [0:00] task...

Raw Feedback:
${textDump}`;
       const response = await ai.models.generateContent({ model: "gemini-3.1-pro-preview", contents: prompt });
       setChecklistModal(response.text || "Failed to generate checklist.");
       toast.success("AI Synthesis Complete");
    } catch (e: any) {
       console.error(e);
       toast.error("Failed to synthesize feedback");
    } finally {
       setSynthesizing(false);
    }
  };

  if (!isAuthenticated && !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black p-10 font-body">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-[#0a0a0a] p-10 rounded-2xl border border-white/[0.04] shadow-2xl text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--brand-primary)]" />
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto bg-white/[0.04]">
            <Lock size={32} className="text-white/40" />
          </div>
          <h2 className="text-white font-bold text-2xl mb-2 font-body tracking-tight tracking-tight">Secure Access Required</h2>
          <p className="text-white/60 text-sm leading-relaxed font-mono">This link is protected. If you are the client, please use the magic link provided via your email or message.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-brand-primary flex flex-col md:flex-row relative overflow-hidden">

        {/* Subtle grid and gradient */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 -z-10 pointer-events-none mix-blend-overlay"></div>
        <div className="fixed inset-0 bg-gradient-to-br from-white/[0.02] via-black to-black -z-10 pointer-events-none"></div>

        
        <AnimatePresence>
            {showNotification.visible && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full flex items-center gap-3 bg-[#161616] border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${showNotification.type === 'approved' ? 'bg-white text-black' : 'bg-[#222] border border-white/10 text-white'}`}>
                        {showNotification.type === 'approved' ? <Check size={12} strokeWidth={3} /> : <XCircle size={14} />}
                    </div>
                    <span className="text-[13px] font-medium text-white/90 pr-2 tracking-wide">
                        {showNotification.type === 'approved' ? 'Project Approved' : 'Revisions Requested'}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {showPaymentModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => paymentState === 'idle' ? setShowPaymentModal(false) : null}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white text-black w-full max-w-md rounded-[24px] shadow-2xl relative z-10 overflow-hidden flex flex-col font-sans"
                    >
                        {paymentState === 'success' ? (
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-green-500/20">
                                    <Check size={40} strokeWidth={3} />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Payment Successful</h2>
                                <p className="text-gray-500 font-medium">Thank you! Your receipt has been sent.</p>
                                <button 
                                    onClick={() => setShowPaymentModal(false)}
                                    className="mt-8 bg-black text-white px-8 py-3 rounded-full font-bold w-full"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="p-8 pb-6 border-b border-gray-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-black rounded-xl"></div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Junedit</div>
                                            <div className="text-xl font-bold leading-none">Remaining Balance</div>
                                        </div>
                                        <div className="ml-auto text-3xl font-black tracking-tighter">$1,250.00</div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => {
                                            setPaymentState('processing');
                                            setTimeout(() => setPaymentState('success'), 2000);
                                        }}
                                        disabled={paymentState === 'processing'}
                                        className="w-full bg-black text-white rounded-xl py-4 flex items-center justify-center gap-2 text-lg font-semibold tracking-tight transition-transform active:scale-95 disabled:opacity-80"
                                    >
                                        {paymentState === 'processing' ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>Pay with <span className="flex items-center gap-0.5"><span className="text-xl font-black translate-y-[-1px]"></span>Pay</span></>
                                        )}
                                    </button>
                                </div>
                                <div className="p-8 pt-6 bg-gray-50">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-[1px] flex-1 bg-gray-200"></div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or pay with card</div>
                                        <div className="h-[1px] flex-1 bg-gray-200"></div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Email</label>
                                            <input type="email" placeholder="client@example.com" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-colors" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Card Information</label>
                                            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden focus-within:border-black transition-colors">
                                                <input type="text" placeholder="Card number" className="w-full px-4 py-3 focus:outline-none border-b border-gray-100" />
                                                <div className="flex">
                                                    <input type="text" placeholder="MM / YY" className="w-1/2 px-4 py-3 focus:outline-none border-r border-gray-100 border-none" />
                                                    <input type="text" placeholder="CVC" className="w-1/2 px-4 py-3 focus:outline-none border-none" />
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setPaymentState('processing');
                                                setTimeout(() => setPaymentState('success'), 2000);
                                            }}
                                            disabled={paymentState === 'processing'}
                                            className="w-full bg-blue-600 text-white rounded-xl py-4 flex items-center justify-between px-6 text-lg font-semibold tracking-tight transition-transform active:scale-95 disabled:opacity-80 mt-2 hover:bg-blue-700"
                                        >
                                            {paymentState === 'processing' ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                                            ) : (
                                                <>
                                                    <span>Pay $1,250.00</span>
                                                    <ArrowRight size={20} />
                                                </>
                                            )}
                                        </button>
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-medium mt-4">
                                            <Lock size={12} /> Powered by <span className="font-bold text-gray-500">stripe</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Minimal Subdued Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[400px] bg-white/[0.02] blur-[120px] pointer-events-none rounded-full" />

        {/* Left: Video Player */}
        <div className="flex-1 flex flex-col max-h-[100dvh] relative z-10 border-r border-white/[0.05]">
            {/* Top Bar */}
            <div className="px-8 py-5 border-b border-white/[0.05] flex items-center justify-between bg-[#000000]/40 backdrop-blur-2xl z-50 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-pointer hover:bg-white/[0.1] transition-all">
                    <Hash className="text-white/80" size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 relative">
                        <h1 className="font-semibold text-xl tracking-tight text-white/90">Project {version}</h1>
                        <div 
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.08] cursor-pointer hover:bg-white/[0.1] transition-colors relative"
                          onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                        >
                            <span className="text-[10px] font-mono tracking-widest uppercase text-white/70">{version === 'V2' ? 'V1' : 'V2'}</span>
                            <ChevronDown size={12} className="text-white/40" />
                        </div>

                        <AnimatePresence>
                            {showVersionDropdown && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-[100px] mt-2 bg-[#111] border border-white/[0.1] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden z-[100]"
                                >
                                    <button 
                                        className="w-full text-left px-5 py-3 hover:bg-white/[0.05] transition-colors flex items-center justify-between gap-6"
                                        onClick={() => { setVersion('V2'); setShowVersionDropdown(false); /*playerRef.current.seekTo(0);*/ }}
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-white">Version 2</div>
                                            <div className="text-[10px] text-white/40 font-mono tracking-widest uppercase mt-0.5">Current</div>
                                        </div>
                                        {version === 'V2' && <Check size={14} className="text-white/50" />}
                                    </button>
                                    <button 
                                        className="w-full text-left px-5 py-3 hover:bg-white/[0.05] transition-colors flex items-center justify-between gap-6 border-t border-white/[0.05]"
                                        onClick={() => { setVersion('V1'); setShowVersionDropdown(false); /*playerRef.current.seekTo(5);*/ }}
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-white/70">Version 1</div>
                                            <div className="text-[10px] text-white/40 font-mono tracking-widest uppercase mt-0.5">Legacy</div>
                                        </div>
                                        {version === 'V1' && <Check size={14} className="text-white/50" />}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="text-[10px] text-white/50 font-mono tracking-[0.2em] uppercase mt-1.5 flex items-center gap-2">
                        {approvalStatus === 'pending' && <><div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse"></div> Syncing Review Session</>}
                        {approvalStatus === 'approved' && <><div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div> File Approved</>}
                        {approvalStatus === 'changes_requested' && <><div className="w-1.5 h-1.5 rounded-full bg-white/80"></div> Revisions Active</>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                         onClick={handleExportNLE}
                         className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111] hover:bg-[#222] text-white/90 transition-colors text-[11px] font-mono tracking-widest uppercase border border-white/10 shadow-sm"
                    >
                         <Download size={14} /> NLE Export
                    </button>
                    <button 
                        onClick={() => setShowPaymentModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white hover:bg-blue-600 transition-colors text-[11px] font-mono tracking-widest uppercase border border-white/10 mr-2 shadow-sm"
                    >
                        <CreditCard size={14} /> Pay Invoice
                    </button>
                    {approvalStatus === 'approved' ? (
                       <div onClick={() => setApprovalStatus('pending')} className="cursor-pointer hover:bg-white px-6 py-2.5 rounded-full bg-white text-black text-[11px] font-mono font-bold tracking-widest uppercase flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                           <Check size={14} strokeWidth={3} /> Approved
                       </div>
                    ) : approvalStatus === 'changes_requested' ? (
                       <div onClick={() => setApprovalStatus('pending')} className="cursor-pointer hover:bg-[#222] px-6 py-2.5 rounded-full bg-[#111] border border-white/[0.1] text-white text-[11px] font-mono font-bold tracking-widest uppercase flex items-center gap-2 transition-all">
                           <XCircle size={14} /> Changes Requested
                       </div>
                    ) : (
                        <>
                            <button onClick={handleRequestChanges} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-transparent text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors text-[11px] font-mono tracking-widest uppercase">
                                Request Changes
                            </button>
                            <button onClick={handleApprove} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#34C759] text-white hover:bg-[#32D74B] transition-all duration-300 text-[11px] font-mono font-bold tracking-widest uppercase shadow-[0_4px_20px_rgba(52,199,89,0.3)] hover:shadow-[0_4px_25px_rgba(52,199,89,0.5)] hover:-translate-y-0.5 active:translate-y-0 border border-[#34C759]/50">
                                <Check size={14} strokeWidth={3} /> Approve {version}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden bg-transparent">
                <div className={`w-full max-w-5xl aspect-video bg-black/40 backdrop-blur-3xl rounded-[32px] overflow-hidden border ${version === 'V1' ? 'border-white/[0.2] shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)]' : 'border-white/[0.08] shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]'} relative group isolate transition-all duration-500`}>
                    <div className="w-full h-full pointer-events-auto">
                      <Player 
                          ref={playerRef}
                          className="w-full h-full object-contain bg-black"
                          url={(lead?.uploadedAssets && lead.uploadedAssets.length > 0) ? lead.uploadedAssets[lead.uploadedAssets.length - 1].url : (lead?.reviewVideoUrl || "https://player.vimeo.com/video/1192000101")}
                          width="100%"
                          height="100%"
                          playing={isPlaying}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
                          onDuration={d => setDuration(d)}
                          style={{ objectFit: 'contain' }}
                      />
                    </div>

                    {/* Canvas Overlay for Drawing */}
                    <div className={`absolute inset-0 z-20 ${activeTool === 'pen' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}>
                        <SignatureCanvas 
                            ref={sigCanvasRef}
                            penColor="white"
                            canvasProps={{ className: "w-full h-full" }}
                        />
                    </div>
                    
                    {/* Previous Drawings Overlay */}
                    {comments.filter(c => c.version === version && c.drawingData && (activeCommentId === c.id || (Math.abs(c.time - currentTime) < 0.2 && !isPlaying))).map(c => (
                         <div key={`draw-${c.id}`} className="absolute inset-0 z-10 pointer-events-none opacity-100 transition-opacity duration-300">
                             <img src={c.drawingData} alt="Drawing" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                         </div>
                    ))}
                    
                    {/* Frame overlay */}
                    <div className="absolute inset-0 pointer-events-none border-[0.5px] border-white/[0.05] rounded-3xl z-30"></div>

                    {/* Tools Sidebar */}
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 bg-white/[0.02] backdrop-blur-[40px] border border-white/[0.08] p-2 rounded-2xl z-40 shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]">
                        <button 
                            onClick={() => setActiveTool('pointer')}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTool === 'pointer' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-white/50 hover:bg-white/[0.05] hover:text-white'}`}
                        >
                            <MousePointer2 size={18} />
                        </button>
                        <button 
                            onClick={() => setActiveTool('pen')}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTool === 'pen' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-white/50 hover:bg-white/[0.05] hover:text-white'}`}
                        >
                            <PenTool size={18} />
                        </button>
                        {activeTool === 'pen' && (
                            <button 
                                onClick={() => sigCanvasRef.current?.clear()}
                                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all text-white/50 hover:bg-white/[0.05] hover:text-white"
                            >
                                <Undo2 size={16} />
                            </button>
                        )}
                    </div>

                    {/* Floating Controls Dock */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[640px] opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out z-40">
                        <div className="bg-[#000000]/60 backdrop-blur-2xl border border-white/[0.08] p-2.5 rounded-full flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <button onClick={handlePlayPause} className="w-10 h-10 shrink-0 bg-white hover:bg-zinc-200 rounded-full flex items-center justify-center text-black transition-all duration-300 active:scale-95 shadow-[0_4px_15px_rgba(255,255,255,0.2)]">
                                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                            </button>
                            
                            <div className="flex-1 flex flex-col gap-2 relative group/scrub py-2">
                                <div 
                                    ref={progressRef}
                                    className="h-1.5 bg-white/10 rounded-full overflow-hidden w-full cursor-pointer relative group-hover/scrub:h-2 transition-all"
                                    onClick={handleSeek}
                                >
                                    <div className="absolute top-0 left-0 bottom-0 bg-white/30" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                                    <div className="absolute top-0 left-0 bottom-0 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                                    
                                    {/* Markers for comments */}
                                    {comments.map(c => (
                                        <div key={c.id} className="absolute top-0 bottom-0 w-1 bg-white group-hover/scrub:w-1.5 transition-all shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ left: `${(c.time / duration) * 100}%`}}></div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-[11px] font-mono text-white/70 tracking-widest w-[100px] text-center bg-white/[0.05] py-1.5 rounded-lg border border-white/[0.05]">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>

                            <button className="w-10 h-10 shrink-0 bg-white/[0.05] hover:bg-white/[0.1] rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/[0.05]">
                                <Maximize2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right: Comments Sidebar */}
        <div className="w-full md:w-[420px] shrink-0 border-l border-white/[0.05] bg-[#000000]/40 backdrop-blur-2xl flex flex-col max-h-[100dvh] border-t md:border-t-0 relative z-10 shadow-[-30px_0_60px_rgba(0,0,0,0.6)]">
            <div className="px-8 py-7 border-b border-white/[0.05]">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90 flex items-center gap-3">
                        <MessageSquare size={16} className="text-white/40" />
                        Curated Feedback
                    </h2>
                    <div className="flex gap-2">
                      {user && (
                        <button 
                            onClick={handleSynthesizeFeedback}
                            disabled={synthesizing}
                            className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1.5 rounded-md border transition-colors bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/40 disabled:opacity-50`}
                        >
                            {synthesizing ? '...' : 'Synthesize AI'}
                        </button>
                      )}
                      <button 
                          onClick={() => setTodoMode(!todoMode)}
                          className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1.5 rounded-md border transition-colors ${todoMode ? 'bg-white text-black border-white' : 'bg-white/[0.05] text-white/50 border-white/[0.1] hover:text-white hover:bg-white/[0.1]'}`}
                      >
                          Todo Mode
                      </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-4 text-[10px] uppercase font-mono tracking-widest text-white/40 bg-white/[0.03] w-fit px-3 py-1.5 rounded border border-white/[0.05]">
                    {comments.filter(c => c.version === version && !c.resolved).length} Open Notes
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Director's Commentary Card */}
                <div className="p-6 md:p-8 pb-4 border-b border-white/[0.05]">
                    <div className="bg-[#111] border border-[var(--brand-primary)]/30 rounded-2xl p-5 shadow-[0_10px_30px_rgba(255,0,0,0.1)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)]/10 blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="flex flex-col gap-4 relative z-10">
                            <div>
                                <h3 className="text-white font-bold font-body text-sm flex items-center gap-2">
                                    <Video size={14} className="text-[var(--brand-primary)]" /> Director's Commentary
                                </h3>
                                <p className="text-[10px] text-white/50 font-mono tracking-widest uppercase mt-1">Defend Your Edits</p>
                            </div>
                            
                            <div className="w-full aspect-[16/9] bg-black rounded-xl overflow-hidden border border-white/10 relative shadow-inner">
                                <video 
                                    className="w-full h-full object-cover opacity-80"
                                    src="https://www.w3schools.com/html/mov_bbb.mp4" 
                                    controls
                                    poster="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                />
                                <div className="absolute top-3 left-3 bg-red-500/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold tracking-widest text-white uppercase flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                    Editor Note
                                </div>
                            </div>

                            <p className="text-xs text-white/70 leading-relaxed italic bg-white/5 p-3 rounded-xl border border-white/5">
                                "I aggressively cut the intro to sub-3 seconds to spike retention, and used a riser sound effect at 1:12 to reset attention before the hook."
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 pt-4">
                {comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/10 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none rounded-3xl mix-blend-overlay"></div>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full border border-white/[0.05] flex items-center justify-center mb-6 bg-white/[0.02] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                                <MessageSquare size={32} className="opacity-40 stroke-[1.5]" />
                            </div>
                            <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/60">The floor is yours</div>
                            <div className="text-xs text-white/30 text-center mt-3 max-w-[200px]">Click anywhere on the timeline or type below to add a note.</div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <AnimatePresence>
                            {comments.filter(c => c.version === version).map((comment, index) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: comment.resolved && todoMode ? 0.3 : 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    key={comment.id} 
                                    className={`bg-white/[0.03] border ${comment.resolved && todoMode ? 'border-white/[0.02]' : (activeCommentId === comment.id ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10' : 'border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.15]')} p-5 md:p-6 rounded-[24px] group transition-all duration-300 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.2)]`}
                                    onClick={() => {
                                        if (playerRef.current) {
                                            playerRef.current.seekTo(comment.time);
                                            setIsPlaying(false);
                                            setActiveCommentId(comment.id);
                                        }
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            {todoMode ? (
                                                <button 
                                                    onClick={(e) => handleResolveComment(comment.id, e)}
                                                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${comment.resolved ? 'bg-white border-white text-black' : 'border-white/30 text-transparent hover:border-white/60'}`}
                                                >
                                                    <Check size={14} strokeWidth={3} />
                                                </button>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] relative shrink-0">
                                                    {comment.author.charAt(0)}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-semibold tracking-tight ${comment.resolved && todoMode ? 'text-white/30 line-through' : 'text-white/90'}`}>{comment.author}</span>
                                                <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase mt-0.5">Just now</span>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-mono tracking-widest font-semibold text-white bg-white/10 px-3 py-1.5 rounded-md border border-white/[0.15] flex items-center gap-1.5 shadow-sm ${comment.resolved && todoMode ? 'opacity-30' : ''}`}>
                                            <Clock size={12} className="opacity-70" /> {formatTime(comment.time)}
                                        </span>
                                    </div>
                                    <p className={`text-[15px] leading-relaxed font-light pl-[56px] mb-4 ${comment.resolved && todoMode ? 'text-white/30 line-through' : 'text-white/70'}`}>
                                       {comment.text}
                                    </p>
                                    
                                    {!todoMode && comment.replies && comment.replies.length > 0 && (
                                    <div className="pl-[56px] mb-4 space-y-4">
                                        {comment.replies.map(reply => (
                                            <div key={reply.id} className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl relative">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-6 h-6 rounded-full bg-[#111] border border-white/[0.1] text-white flex items-center justify-center text-[9px] font-bold">
                                                        {reply.author.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-semibold text-white/80">{reply.author}</span>
                                                    <span className="text-[9px] text-white/30 font-mono tracking-widest uppercase ml-auto">Earlier</span>
                                                </div>
                                                <p className="text-[14px] text-white/60 leading-relaxed pl-9">
                                                    {reply.text}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                    {!todoMode && (
                                        <div className="pl-[56px]">
                                            {replyingTo === comment.id ? (
                                                <div className="flex items-center gap-3 mt-2" onClick={(e) => { e.stopPropagation() }}>
                                                    <input 
                                                        autoFocus
                                                        type="text" 
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleAddReply(comment.id);
                                                        }}
                                                        placeholder="Reply..."
                                                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/30 transition-all font-light placeholder:text-white/30"
                                                    />
                                                    <button 
                                                        className="px-4 py-2.5 bg-white text-black rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                                        onClick={() => handleAddReply(comment.id)}
                                                        disabled={!replyText.trim()}
                                                    >
                                                        Send
                                                    </button>
                                                    <button 
                                                        className="px-3 py-2.5 text-white/40 hover:text-white transition-all"
                                                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setReplyingTo(comment.id); setReplyText(''); }}
                                                    className="text-[11px] font-mono tracking-widest uppercase text-white/40 hover:text-white transition-colors"
                                                >
                                                    + Reply
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                        ))}
                        </AnimatePresence>
                    </div>
                )}
                </div>
            </div>

            <div className="p-6 md:p-8 border-t border-white/[0.05] bg-[#000000]/40 backdrop-blur-2xl shrink-0">
                <form onSubmit={handleAddComment} className="flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <div className="text-[11px] font-medium text-white/50 tracking-[0.1em] uppercase flex items-center gap-3">
                            <Hash size={12} className="text-white/30" /> Frame Note
                        </div>
                        <span className="font-mono font-medium text-white/70 text-[10px] tracking-widest px-2.5 py-1 bg-white/[0.05] border border-white/[0.05] rounded-md shadow-inner">
                            {formatTime(currentTime)}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Type your feedback..."
                            className="flex-1 bg-white/[0.02] border border-white/[0.08] rounded-2xl px-5 py-4 text-[15px] text-white focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all duration-300 placeholder:text-white/30 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]"
                        />
                        <button type="submit" disabled={!newComment.trim()} className="w-14 h-[54px] shrink-0 bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white rounded-2xl flex items-center justify-center text-black transition-all duration-300 shadow-[0_5px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_5px_25px_rgba(255,255,255,0.3)] hover:-translate-y-0.5">
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <AnimatePresence>
          {checklistModal && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
               <motion.div 
                   initial={{ opacity: 0, y: 30, scale: 0.95 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
               >
                  <div className="flex items-center justify-between mb-6">
                     <h2 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="text-[var(--brand-primary)]" size={20} />
                        AI Editor's Checklist
                     </h2>
                     <button onClick={() => setChecklistModal(null)} className="text-white/40 hover:text-white transition-colors">
                        <XCircle size={24} />
                     </button>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                     <div dangerouslySetInnerHTML={{ __html: checklistModal.replace(/\n/g, '<br/>') }} />
                  </div>
                  <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
                     <button onClick={() => setChecklistModal(null)} className="px-6 py-2 bg-[var(--brand-primary)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
                        Got it
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

    </div>
  );
}

