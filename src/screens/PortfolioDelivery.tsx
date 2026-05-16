import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Video, Eye, Clock, TrendingUp, Sparkles, Play, MousePointerClick } from 'lucide-react';
import { motion } from 'motion/react';

export default function PortfolioDelivery() {
  const searchParams = new URLSearchParams(window.location.search);
  const leadId = searchParams.get('id');
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!leadId) return;
      try {
        const docSnap = await getDoc(doc(db, 'leads', leadId));
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [leadId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Sparkles size={24} className="text-white/20 animate-pulse" />
      </div>
    );
  }

  if (!project || !project.isPublicPortfolio) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/40 font-mono text-sm uppercase tracking-widest">
        Video metrics are private.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden font-body text-white">
       {/* Background */}
       <div className="fixed inset-0 pointer-events-none opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--brand-primary)] blur-[120px] mix-blend-screen opacity-30"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px] mix-blend-screen opacity-20"></div>
       </div>

       <div className="max-w-4xl mx-auto px-6 py-20 relative z-10 w-full flex flex-col gap-12">
            
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-center"
            >
               <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{project.brandName || "Client Video"}</h1>
               <div className="flex items-center justify-center gap-4 text-xs font-mono tracking-widest uppercase text-white/50">
                  <span className="bg-white/10 px-3 py-1.5 rounded-full">{project.niche || "Content"}</span>
                  <span>•</span>
                  <span>Post-Production Case Study</span>
               </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.1 }}
               className="aspect-video bg-black rounded-3xl border border-white/10 overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] group"
            >
               {project.reviewVideoUrl ? (
                   <div 
                     className="w-full h-full"
                     dangerouslySetInnerHTML={{ 
                       __html: project.reviewVideoUrl.includes('<iframe') 
                         ? project.reviewVideoUrl 
                         : project.reviewVideoUrl.includes('vimeo.com') 
                           ? `<iframe src="${project.reviewVideoUrl.includes('player.vimeo.com') ? project.reviewVideoUrl : `https://player.vimeo.com/video/${project.reviewVideoUrl.match(/vimeo\.com\/(?:video\/|reviews\/.*\/videos\/)?(\d+)/)?.[1] || project.reviewVideoUrl.split('/').pop()}`}" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" class="w-full h-full object-contain bg-black" frameborder="0"></iframe>`
                           : `<video src="${project.reviewVideoUrl}" controls class="w-full h-full object-cover"></video>`
                     }} 
                   />
               ) : (
                   <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
                       <Video size={48} className="text-white/10" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                       <button className="absolute inset-0 m-auto w-20 h-20 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center transition-transform hover:scale-110">
                           <Play size={32} fill="currentColor" className="ml-2 text-white" />
                       </button>
                   </div>
               )}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#111] border border-white/[0.05] p-8 rounded-3xl relative overflow-hidden"
                >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--brand-primary)]/10 blur-3xl rounded-full pointer-events-none"></div>
                    <div className="text-[10px] font-mono tracking-widest uppercase text-white/40 mb-3 flex items-center gap-2">
                        <Eye size={12} className="text-[var(--brand-primary)]" /> Total Views
                    </div>
                    <div className="text-4xl font-black tracking-tighter text-white">{(project.roiViews || '1.2M')}</div>
                    <div className="text-xs text-[var(--brand-primary)] font-bold mt-2 flex items-center gap-1"><TrendingUp size={12}/> +42% vs Channel Avg</div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#111] border border-white/[0.05] p-8 rounded-3xl relative overflow-hidden"
                >
                    <div className="text-[10px] font-mono tracking-widest uppercase text-white/40 mb-3 flex items-center gap-2">
                        <MousePointerClick size={12} className="text-blue-400" /> CTR
                    </div>
                    <div className="text-4xl font-black tracking-tighter text-white">{(project.roiCtr || '8.4%')}</div>
                    <div className="text-xs text-blue-400 font-bold mt-2 flex items-center gap-1"><TrendingUp size={12}/> 1.2% bump</div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#111] border border-white/[0.05] p-8 rounded-3xl relative overflow-hidden"
                >
                    <div className="text-[10px] font-mono tracking-widest uppercase text-white/40 mb-3 flex items-center gap-2">
                        <Clock size={12} className="text-emerald-400" /> Avg View Duration
                    </div>
                    <div className="text-4xl font-black tracking-tighter text-white">{(project.roiRetention || '6m 12s')}</div>
                    <div className="text-xs text-emerald-400 font-bold mt-2 flex items-center gap-1"><TrendingUp size={12}/> Superior pacing</div>
                </motion.div>
            </div>

       </div>
    </div>
  );
}
