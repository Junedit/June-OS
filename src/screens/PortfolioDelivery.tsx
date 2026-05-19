import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Video, Lock, Loader2, Play, ArrowRight, Eye, TrendingUp, Sparkles, Clock, MousePointerClick } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function PortfolioDelivery() {
  const searchParams = new URLSearchParams(window.location.search);
  const prospectId = searchParams.get('id');
  const viewToken = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [prospect, setProspect] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Dummy gallery items
  const gallery = [
    { title: "Tech Channel Scale", metric: "1.2M Views", niche: "Tech", thumbnail: "bg-zinc-800" },
    { title: "Finance Creator Launch", metric: "$4k AdSense", niche: "Finance", thumbnail: "bg-zinc-700" },
    { title: "Brand Commercial", metric: "+15% Conv.", niche: "SaaS", thumbnail: "bg-zinc-900" }
  ];

  useEffect(() => {
    async function init() {
      if (!prospectId) {
         setLoading(false);
         return;
      }
      try {
        const docSnap = await getDoc(doc(db, 'leads', prospectId));
        if (docSnap.exists()) {
          setProspect({ id: docSnap.id, ...docSnap.data() });
        }
        
        // Check magic link
        if (viewToken) {
           const res = await fetch(`/api/verify-magic-link/${viewToken}`);
           if (res.ok) {
              const data = await res.json();
              if (data.clientId === prospectId) {
                 authenticate(true);
              }
           }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [prospectId, viewToken]);

  const authenticate = async (skipPassword = false) => {
    if (!skipPassword) {
      if (password !== 'june2024') { 
         // Dummy password for demo purposes.
         toast.error("Incorrect password.");
         return;
      }
    }
    setIsAuthenticated(true);
    
    // Log tracking
    if (prospectId) {
         try {
            await fetch('/api/gemini/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: `Analyze nothing, this is a trigger.`,
                  systemInstruction: 'Dummy'
                })
            });
            await updateDoc(doc(db, 'leads', prospectId), {
               portfolioViewedAt: new Date().toISOString()
            });
         } catch(e) {}
    }
  };

  if (loading) {
     return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 size={32} className="animate-spin text-white/20" /></div>;
  }

  if (!isAuthenticated) {
     return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/40 p-6 relative overflow-hidden font-body">
           <div className="absolute top-1/4 w-96 h-96 bg-[var(--brand-primary)]/10 blur-[120px] rounded-full pointer-events-none" />
           
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-[#111] p-10 rounded-[32px] border border-white/5 relative z-10 text-center shadow-2xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/50">
                 <Lock size={24} />
              </div>
              <h2 className="text-2xl font-bold font-body text-white mb-2">Private Portfolio</h2>
              <p className="text-xs text-white/50 font-mono mb-8 leading-relaxed">
                 This collection of past work is protected. Please enter the access password provided in your email.
              </p>
              <input 
                type="password" 
                placeholder="Enter Password" 
                className="w-full bg-[#000] border border-white/10 rounded-xl px-4 py-3.5 mb-4 text-center text-white focus:outline-none focus:border-[var(--brand-primary)]/50 transition-colors"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && authenticate()}
              />
              <button 
                 onClick={() => authenticate()}
                 className="w-full bg-white text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-[var(--brand-primary)] transition-colors"
              >
                 Unlock Gallery
              </button>
           </motion.div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-body selection:bg-[var(--brand-primary)] selection:text-black pb-32">
       {/* Background */}
       <div className="fixed inset-0 pointer-events-none opacity-40">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--brand-primary)] blur-[150px] mix-blend-screen opacity-10"></div>
       </div>

       <div className="max-w-6xl mx-auto px-6 py-20 relative z-10 w-full flex flex-col gap-16">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto flex flex-col items-center">
               <span className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Eye size={14}/> Live Session Tracked
               </span>
               <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-6 leading-tight">
                  Exclusive Work <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-600">curated for {prospect?.brandName || "you"}.</span>
               </h1>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {gallery.map((item, i) => (
                  <motion.div 
                     key={i} 
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.2 }}
                     className="group cursor-pointer"
                  >
                     <div className={`w-full aspect-video flex-col gap-2 ${item.thumbnail} rounded-[24px] border border-white/5 mb-4 relative overflow-hidden flex items-center justify-center transform transition-transform duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]`}>
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                        <Video size={32} className="text-white/20" />
                        <div className="w-16 h-16 absolute bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                           <Play size={24} className="text-white ml-2" fill="currentColor" />
                        </div>
                     </div>
                     <div className="px-2">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="text-lg font-bold">{item.title}</h3>
                           <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 px-2 py-1 rounded-full">{item.metric}</span>
                        </div>
                        <p className="text-sm text-white/50">{item.niche}</p>
                     </div>
                  </motion.div>
               ))}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-20 bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/[0.04] p-12 rounded-[32px] text-center max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-[var(--brand-primary)]/5 blur-[100px]" />
               <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-4">Ready to scale your content?</h2>
                  <p className="text-white/60 mb-8 max-w-md mx-auto">Let's build a dedicated high-retention system for your brand.</p>
                  <button onClick={() => window.location.href = `/?mode=intake&uid=${prospect?.ownerId || ''}`} className="bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[var(--brand-primary)] transition-colors flex items-center gap-2 mx-auto shadow-lg">
                     Start Your Partnership <ArrowRight size={16} />
                  </button>
               </div>
            </motion.div>
       </div>
    </div>
  );
}
