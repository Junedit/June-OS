import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Package, Video, Image as ImageIcon, FileText, Music, Filter, Link as LinkIcon, Download, Trash, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const MOCK_ASSETS = [
  { id: '1', title: 'Brand Guidelines 2024.pdf', type: 'doc', icon: FileText, size: '2.4 MB', date: 'Oct 12' },
  { id: '2', title: 'Standard Intro Anim_v2.mp4', type: 'video', icon: Video, size: '45 MB', date: 'Oct 10' },
  { id: '3', title: 'Outro Overlay Pack.psd', type: 'image', icon: ImageIcon, size: '12 MB', date: 'Oct 08' },
  { id: '4', title: 'Background Audio Loop.wav', type: 'audio', icon: Music, size: '8.1 MB', date: 'Sep 25' },
  { id: '5', title: 'Lower Thirds Project.prproj', type: 'video', icon: Video, size: '112 MB', date: 'Sep 20' },
  { id: '6', title: 'Thumbnails Asset Pack.zip', type: 'image', icon: ImageIcon, size: '430 MB', date: 'Sep 18' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function AssetsHub() {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');

  return (
    <div className="flex-1 bg-transparent w-full relative">
      <header className="bg-[#000000]/60 backdrop-blur-[80px] saturate-[2.0] border-b border-white/[0.02] top-0 sticky z-40 flex justify-between items-center w-full px-8 py-5">
        <div className="flex items-center gap-4">
          <span className="md:hidden font-black text-2xl text-zinc-100 font-body tracking-tight tracking-[0.02em] drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)]">WA</span>
          <h2 className="text-2xl font-body tracking-tight font-black text-zinc-100 tracking-[0.02em] uppercase drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)] hidden lg:block">
            Weapon Arsenal
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-white/5 border border-white/[0.04] rounded-2xl px-3 py-2 flex items-center gap-2 focus-within:border-white/30 transition-colors">
             <Filter size={14} className="text-white/60" />
             <select 
               className="bg-transparent text-white text-xs outline-none w-full appearance-none cursor-pointer"
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
             >
               <option value="all">All Types</option>
               <option value="video">Video</option>
               <option value="image">Images</option>
               <option value="audio">Audio</option>
               <option value="doc">Documents</option>
             </select>
          </div>
          <button onClick={() => toast.info('Storage integration required for uploads')} className="linear-button px-5 py-2 text-[10px] bg-white/10 text-zinc-100 border-white/[0.02]0 hover:bg-white/20 shadow-[0_4px_24px_rgba(255,255,255,0.15)]">
            <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" /> DEPLOY ASSET
          </button>
        </div>
      </header>

      <div className="p-10 md:p-10 space-y-8 max-w-[1600px] mx-auto w-full mb-32">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"
        >
        <AnimatePresence>
          {MOCK_ASSETS.filter(a => filter === 'all' || a.type === filter).map((asset) => {
            const Icon = asset.icon;
            return (
              <motion.div 
                layout
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.9 }}
                key={asset.id} 
                className="glass-panel p-5 rounded-2xl hover:bg-white/[0.02] hover:border-white/20 transition-all group cursor-pointer relative overflow-hidden"
              >
                 <div className="flex justify-between items-start mb-8">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/[0.04] flex items-center justify-center text-white/80 shadow-inner group-hover:scale-110 transition-transform duration-500">
                     <Icon size={24} strokeWidth={1.5} />
                   </div>
                   <button className="text-white/20 hover:text-[#FF453A] p-2 opacity-0 group-hover:opacity-100 transition-all rounded-2xl hover:bg-[#FF6961]/10 z-20 absolute top-4 right-4" onClick={(e) => { e.stopPropagation(); toast.success('Deleted asset')}}>
                     <Trash size={16} />
                   </button>
                 </div>
                 
                 <h3 className="text-sm font-semibold text-white mb-2 truncate pr-6" title={asset.title}>{asset.title}</h3>
                 <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono uppercase tracking-[0.2em]">
                   <span>{asset.size}</span>
                   <span>&bull;</span>
                   <span>{asset.date}</span>
                 </div>
                 
                 <div className="absolute inset-0 bg-[#000000]/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 z-10">
                    <button className="bg-[var(--brand-primary)] text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_4px_24px_rgba(255, 59, 48,0.3)]">
                      <Download size={14} /> Download
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toast.success("Link copied!"); }} className="text-white/60 hover:text-white px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75 hover:bg-white/10">
                      <LinkIcon size={12} /> Copy Link
                    </button>
                 </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
