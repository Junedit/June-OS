import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { analyzeWinLoss } from '../services/ai';
import { Loader2, Zap, BrainCircuit } from 'lucide-react';
import Markdown from 'react-markdown';

export default function WinLossAnalytics({ leads }: { leads: any[] }) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
     setLoading(true);
     try {
       const lostLeads = leads.filter(l => l.status === 'lost');
       const notesMap: Record<string, any[]> = {};
       for (const l of lostLeads) {
         if (!l.ownerId) continue;
         const { query, where } = await import('firebase/firestore');
         const notesSnap = await getDocs(query(collection(db, 'leads', l.id, 'notes'), where('ownerId', '==', l.ownerId)));
         notesMap[l.id] = notesSnap.docs.map(d => d.data());
       }
       const result = await analyzeWinLoss(leads, notesMap);
       setReport(result);
     } catch (err) {
       console.error("Failed to generate win/loss analytics", err);
     } finally {
       setLoading(false);
     }
  };

  return (
    <div className="bg-transparent border border-white/[0.02] rounded-[24px] p-10 relative flex flex-col shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)] group mt-8">
        <div className="flex items-start justify-between mb-8">
            <div>
                <h3 className="text-sm text-white font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                   <BrainCircuit size={16} className="text-zinc-100" /> 
                   AI WIN/LOSS CAPITULATION
                </h3>
                <p className="text-[10px] text-white/60 font-mono tracking-[0.2em] mt-2 mb-0 uppercase">Analyze lost deal context to uncover critical friction points</p>
            </div>
            <div className="text-right bg-[#141414] border border-white/[0.02] px-4 py-2.5 rounded-2xl">
                <div className="text-[8px] text-white/60 font-mono uppercase tracking-[0.2em] mb-1">Lost Deals</div>
                <div className="text-xs text-zinc-100 font-mono font-bold uppercase tracking-[0.2em]">
                    {leads.filter(l => l.status === 'lost').length} Evaluated
                </div>
            </div>
        </div>

        {report ? (
            <div className="bg-[#000000]/50 border border-white/[0.02] rounded-2xl p-10 relative">
              <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/[0.04] text-sm max-w-none text-white/80 font-mono">
                <Markdown>{report}</Markdown>
              </div>
              <div className="mt-6 text-right">
                <button onClick={generateReport} disabled={loading} className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 hover:text-white transition-colors flex items-center justify-end gap-2 ml-auto">
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                    Recalculate Insight
                </button>
              </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/[0.04] rounded-2xl bg-[#000000]/20">
               <BrainCircuit size={48} className="text-zinc-600 mb-4 opacity-50" />
               <p className="text-sm text-white/60 font-mono uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed mb-6">
                 Scan historical notes across broken deals. Identify exact reasons why prospects ghosted or rejected the pitch.
               </p>
               <button 
                 onClick={generateReport} 
                 disabled={loading || leads.filter(l => l.status === 'lost').length === 0} 
                 className="bg-white/10 text-zinc-100 hover:bg-[var(--brand-primary)] hover:text-white border border-white/20 px-6 py-3 rounded-2xl uppercase font-mono text-[10px] font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50"
               >
                 {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                 {loading ? "Synthesizing Data..." : "Run Autopsy"}
               </button>
               {leads.filter(l => l.status === 'lost').length === 0 && (
                   <p className="text-[10px] text-white/60 font-mono tracking-[0.2em] mt-4">Requires at least 1 "Lost" lead.</p>
               )}
            </div>
        )}
    </div>
  );
}
