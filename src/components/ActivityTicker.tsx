import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Sparkles, DollarSign, Edit2, Play, FileText, Zap, X } from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { formatDistanceToNow } from 'date-fns';

const ICONS = {
  ai: { icon: Sparkles, color: 'text-purple-400', glow: 'shadow-[0_4px_24px_rgba(168,85,247,0.15)]', border: 'border-purple-500/40', bg: 'bg-purple-500/10' },
  deal: { icon: Zap, color: 'text-[#34C759]', glow: 'shadow-[0_4px_24px_rgba(52, 199, 89,0.15)]', border: 'border-[#34C759]/40', bg: 'bg-[#34C759]/10' },
  payment: { icon: DollarSign, color: 'text-[#34C759]', glow: 'shadow-[0_4px_24px_rgba(52, 199, 89,0.15)]', border: 'border-[#34C759]/20', bg: 'bg-[#34C759]/10' },
  system: { icon: Play, color: 'text-blue-400', glow: 'shadow-[0_4px_24px_rgba(59,130,246,0.15)]', border: 'border-blue-500/40', bg: 'bg-blue-500/10' },
  task_completed: { icon: FileText, color: 'text-amber-400', glow: 'shadow-[0_4px_24px_rgba(245,158,11,0.15)]', border: 'border-[#FF9500]/20', bg: 'bg-[#FF9500]/10' }
};

export default function ActivityTicker() {
  const [visibleEvents, setVisibleEvents] = useState<any[]>([]);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    let unsubs = () => {};
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        const q = query(
          collection(db, 'activity_logs'),
          where('ownerId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        let firstLoad = true;
        unsubs = onSnapshot(q, (snap) => {
          if (firstLoad) {
            snap.docs.forEach(doc => seenIds.current.add(doc.id));
            firstLoad = false;
            return;
          }

          snap.docChanges().forEach(change => {
            if (change.type === 'added') {
              const id = change.doc.id;
              if (!seenIds.current.has(id)) {
                seenIds.current.add(id);
                const evtInfo = { id, ...change.doc.data() };
                
                setVisibleEvents(prev => [evtInfo, ...prev].slice(0, 5));
                
                setTimeout(() => {
                  setVisibleEvents(prev => prev.filter(e => e.id !== id));
                }, 4500);
              }
            }
          });
        });
      } else {
        setVisibleEvents([]);
        unsubs();
      }
    });

    return () => {
      unsubscribeAuth();
      unsubs();
    };
  }, []);

  if (visibleEvents.length === 0) return null;

  return (
    <div className="fixed top-24 right-6 z-50 pointer-events-none w-80 [perspective:1000px]">
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {visibleEvents.map((evt) => {
            const IconData = ICONS[evt.type as keyof typeof ICONS] || ICONS.system;
            const Icon = IconData.icon;
            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: 100, rotateY: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, rotateY: 20, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={`group bg-[#000000]/60 backdrop-blur-[20px] saturate-[1.8] border border-l-[3px] rounded-r-md ${IconData.border} p-3 flex items-start gap-3 pointer-events-auto cursor-default transition-all duration-500 relative overflow-hidden ${IconData.glow}`}
              >
                <div className={`mt-0.5 p-1.5 rounded-sm ${IconData.bg} ${IconData.color}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 pr-4">
                  <div className="flex justify-between items-start mb-1">
                     <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${IconData.color}`}>[ {evt.type.toUpperCase()} ]</span>
                     <span className="text-[9px] text-white/60 font-mono block uppercase tracking-[0.2em] text-right">
                       {evt.createdAt ? formatDistanceToNow(evt.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                     </span>
                  </div>
                  <p className="text-xs font-mono text-white/80 tracking-wide leading-tight">{evt.text}</p>
                </div>
                
                <button 
                  onClick={() => setVisibleEvents(prev => prev.filter(e => e.id !== evt.id))}
                  className="absolute top-2 right-2 p-1 bg-white/5 border border-white/[0.04] hover:bg-white/10 text-white/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                >
                  <X size={10} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
