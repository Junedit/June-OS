import { motion } from 'motion/react';
import { ArrowRight, Play, Star, ChevronRight, Video } from 'lucide-react';
import { useState } from 'react';

export default function MarketingLanding({ onLogin }: { onLogin: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans overflow-x-hidden selection:bg-[var(--brand-primary)] selection:text-black">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tighter">June<span className="text-[var(--brand-primary)]">.</span></div>
          <div className="flex items-center gap-6">
            <button onClick={() => window.location.href = '/?mode=intake'} className="text-sm font-medium hover:text-white text-zinc-400 transition-colors">Start Project</button>
            <button onClick={onLogin} className="text-sm font-medium hover:text-white text-zinc-400 transition-colors">Client Login</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 min-h-[90vh] flex flex-col justify-center items-center text-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--brand-primary)]/20 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-widest uppercase mb-8 text-zinc-300">
            <Star size={12} className="text-[var(--brand-primary)]" />
            Top 1% Editing Agency
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8 font-body">
            Scale your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">content empire.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            We don't just chop up footage. We engineer high-retention video assets that turn viewers into obsessed fans and drive measurable ROI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <button 
                onClick={() => window.location.href = '/?mode=intake'}
                className="bg-white text-black px-8 py-4 rounded-full font-bold tracking-wide hover:scale-105 transition-transform flex items-center gap-2"
              >
                Apply for Partnership <ArrowRight size={18} />
             </button>
             <button 
                className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full font-bold tracking-wide hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                View Reel <Play size={18} />
             </button>
          </div>
        </motion.div>

        {/* 3D-ish Floating Reel Preview */}
        <motion.div 
           initial={{ opacity: 0, y: 40 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, delay: 0.3 }}
           className="mt-20 relative w-full max-w-5xl mx-auto perspective-[2000px]"
        >
           <div className={`w-full aspect-video rounded-[32px] overflow-hidden border border-white/10 bg-[#111] transition-all duration-700 ${hovered ? 'rotate-x-0 rotate-y-0 scale-100 shadow-[0_0_80px_rgba(0,239,209,0.2)]' : 'rotate-x-[15deg] rotate-y-[-10deg] scale-95 shadow-2xl'}`}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
           >
              {/* Dummy video placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                 <Video size={64} className="text-white/20" />
              </div>
           </div>
        </motion.div>
      </section>

      {/* Services Bento Grid */}
      <section className="py-32 px-6 bg-black relative">
         <div className="max-w-7xl mx-auto">
            <div className="mb-16">
               <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">The June Framework</h2>
               <p className="text-zinc-400 font-light">Why top creators choose to partner with us.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2 bg-[#0a0a0a] border border-white/[0.04] p-10 rounded-[32px] group hover:border-[var(--brand-primary)]/30 transition-colors">
                  <h3 className="text-2xl font-bold mb-3">Retention-First Editing</h3>
                  <p className="text-zinc-500 mb-8 max-w-md">Every cut, transition, and sound effect is engineered to keep viewers glued to the screen.</p>
                  <div className="h-40 bg-zinc-900 rounded-2xl border border-white/5 relative overflow-hidden">
                     {/* Decorative graph */}
                     <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[var(--brand-primary)]/20 to-transparent"></div>
                  </div>
               </div>
               <div className="bg-[#0a0a0a] border border-white/[0.04] p-10 rounded-[32px] group hover:border-[var(--brand-primary)]/30 transition-colors">
                  <h3 className="text-2xl font-bold mb-3">Custom Portals</h3>
                  <p className="text-zinc-500">Track progress, review drafts, and access assets all in one bespoke dashboard built just for you.</p>
               </div>
            </div>
         </div>
      </section>
      
    </div>
  );
}
