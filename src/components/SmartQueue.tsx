import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, collection, getDocs, orderBy, query, addDoc, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Clock, MessageSquare, Target, CheckCircle, Zap, Loader2, ArrowRight, Layers } from 'lucide-react';
import { generateContextualFollowUp, generateDripSequence } from '../services/ai';

interface SmartQueueProps {
  leads: any[];
  onSelectLead: (lead: any) => void;
}

const getNow = () => Date.now();

export default function SmartQueue({ leads, onSelectLead }: SmartQueueProps) {
  const { user } = useAuth();
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Stablize now
  const now = useMemo(() => getNow(), []);

  // Filter leads that are NOT closed or lost, and sort by urgency (e.g. oldest updatedAt first)
  // Or leads that have followUpDate <= today.
  // For now, we queue leads that are 'contacted' or 'negotiating' and we haven't touched them recently,
  // or they just need a bump. Let's just pick all leads not in 'closed' or 'lost' or 'new'.
  // Actually, 'new' leads could also be queued for initial outreach. Let's include 'new', 'contacted', 'negotiating'
  // sorted by oldest updatedAt.
  const activeLeads = leads
    .filter(l => ['new', 'contacted', 'negotiating'].includes(l.status))
    .sort((a, b) => {
      const aTime = a.updatedAt ? (a.updatedAt.toDate ? a.updatedAt.toDate().getTime() : new Date(a.updatedAt).getTime()) : 0;
      const bTime = b.updatedAt ? (b.updatedAt.toDate ? b.updatedAt.toDate().getTime() : new Date(b.updatedAt).getTime()) : 0;
      return aTime - bTime; // Oldest first
    });

  const handleSequence = async (lead: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setProcessingId(lead.id + "_seq");
    
    try {
      const notesRef = collection(db, 'leads', lead.id, 'notes');
      const q = query(notesRef, where('ownerId', '==', user?.uid), orderBy('createdAt', 'desc'));
      const notesSnap = await getDocs(q);
      const notes = notesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const sequence = await generateDripSequence(lead, notes);

      await addDoc(collection(db, 'leads', lead.id, 'notes'), {
        text: `🤖 AI Drip Sequence Generated:\n\n${sequence}`,
        type: 'note',
        ownerId: user.uid,
        leadId: lead.id,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'leads', lead.id), {
        updatedAt: serverTimestamp()
      });

      await navigator.clipboard.writeText(sequence);
      toast.success(`Drip Sequence copied to clipboard! Added to notes.`);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate drip sequence.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBump = async (lead: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setProcessingId(lead.id);
    
    try {
      // 1. Fetch Calendar URL
      const settingsSnap = await getDoc(doc(db, 'settings', user.uid));
      const calendarUrl = settingsSnap.exists() ? settingsSnap.data().calendarUrl : undefined;

      // 2. Fetch Notes for context
      const notesRef = collection(db, 'leads', lead.id, 'notes');
      const q = query(notesRef, where('ownerId', '==', user?.uid), orderBy('createdAt', 'desc'));
      const notesSnap = await getDocs(q);
      const notes = notesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3. Generate Follow-Up
      const communicationChannel = lead.contactEmail && lead.contactEmail.includes('@') ? 'Email' : 'DM';
      const message = await generateContextualFollowUp(lead, notes, communicationChannel, calendarUrl);

      // 4. Save note
      await addDoc(collection(db, 'leads', lead.id, 'notes'), {
        text: `📨 Smart Bump Drafted (${communicationChannel}):\n\n${message}`,
        type: 'note',
        ownerId: user.uid,
        leadId: lead.id,
        createdAt: serverTimestamp()
      });

      // 5. Update lead updatedAt so it moves down the queue
      await updateDoc(doc(db, 'leads', lead.id), {
        updatedAt: serverTimestamp()
      });

      // 6. Action
      if (communicationChannel === 'Email') {
        const subject = encodeURIComponent(`Following up: ${lead.brandName}`);
        const body = encodeURIComponent(message);
        window.open(`mailto:${lead.contactEmail}?subject=${subject}&body=${body}`);
        toast.success("Bump drafted in email client!");
      } else {
        await navigator.clipboard.writeText(message);
        toast.success(`Bump copied to clipboard for ${communicationChannel}!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate contextual bump.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-transparent min-h-[500px] border border-white/[0.02] rounded-3xl p-10 relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#fff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.015] pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/[0.02] pb-6">
        <div>
          <h3 className="font-body tracking-tight text-2xl font-bold text-white flex items-center gap-3">
             <Zap className="text-white/80" size={24} /> Smart Follow-Up Queue
          </h3>
          <p className="text-sm font-mono tracking-[0.2em] uppercase text-white/60 mt-2">AI-Prioritized bump queue based on staleness</p>
        </div>
        <div className="bg-[#141414] border border-white/[0.02] px-4 py-2 rounded-2xl text-[10px] font-mono tracking-[0.2em] uppercase text-white/60">
           {activeLeads.length} Vectors Queued
        </div>
      </div>

      <div className="relative z-10 grid gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence>
          {activeLeads.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
               className="py-20 flex flex-col items-center justify-center text-center opacity-50 grayscale"
            >
               <CheckCircle size={48} className="text-white/80 mb-4" />
               <div className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">NO PENDING OUTREACH</div>
               <div className="text-[10px] text-zinc-600 font-mono mt-2">ALL SYSTEMS SYNCED</div>
            </motion.div>
          ) : (
            activeLeads.map((lead, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className="bg-[#0f0f0f] border border-white/[0.02] p-5 rounded-2xl cursor-pointer hover:bg-[#000000] hover:border-white/20 transition-all duration-300 group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-white/[0.02] flex items-center justify-center text-white/80 shrink-0 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                     <Target size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold tracking-tight text-lg group-hover:text-white/80 transition-colors">{lead.brandName}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] bg-white/5 text-white/60 font-mono tracking-[0.2em] uppercase px-2 py-0.5 rounded border border-white/[0.02]">
                        {lead.status}
                      </span>
                      {lead.updatedAt && (
                        <span className="text-[9px] text-zinc-600 font-mono tracking-[0.2em] uppercase flex items-center gap-1">
                           <Clock size={10} /> 
                           Stale for {Math.max(0, Math.floor((now - (lead.updatedAt?.toDate ? lead.updatedAt.toDate().getTime() : new Date(lead.updatedAt).getTime())) / (1000 * 60 * 60 * 24)))} days
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-white/60 font-mono tracking-[0.2em] uppercase mb-1">Potential</div>
                    <div className="text-white/80 font-bold font-mono tracking-widest">${(lead.budget || 0).toLocaleString()}</div>
                  </div>
                  
                  <div className="flex bg-white/10 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_4px_24px_rgba(255,255,255,0.15)]/20 transition-all border border-white/20">
                    <button
                      disabled={processingId !== null}
                      onClick={(e) => handleSequence(lead, e)}
                      className="h-10 px-3 text-white/80 hover:bg-[var(--brand-primary)] text-white hover:text-black font-bold text-[10px] font-mono tracking-[0.2em] uppercase transition-all flex items-center gap-2 border-r border-white/20"
                      title="Generate 3-part Drip Sequence"
                    >
                      {processingId === lead.id + "_seq" ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                    </button>
                    <button
                      disabled={processingId !== null}
                      onClick={(e) => handleBump(lead, e)}
                      className="h-10 px-4 text-white/80 hover:bg-[var(--brand-primary)] text-white hover:text-black font-bold text-[10px] font-mono tracking-[0.2em] uppercase transition-all flex items-center gap-2 group/btn"
                    >
                      {processingId === lead.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <MessageSquare size={14} />
                          1-Click Bump
                          <ArrowRight size={14} className="opacity-0 -ml-4 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
