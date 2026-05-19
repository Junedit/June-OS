import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Activity, DollarSign, FileSignature, Bot } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'activity_logs'),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(logs);
      // Rough unread count since open
      if (!isOpen) {
         setUnreadCount(prev => prev + snap.docChanges().filter(c => c.type === 'added').length);
      }
    });
    return () => unsubscribe();
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-white/[0.04] flex justify-between items-center bg-[#111]">
               <h3 className="text-white font-bold font-mono tracking-widest uppercase text-xs">Notifications</h3>
               <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                 <X size={16} />
               </button>
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-white/40 text-[10px] font-mono uppercase tracking-widest">No recent activity</div>
              ) : (
                notifications.map((n, i) => (
                  <div key={n.id} className="p-3 border-b border-white/[0.02] last:border-0 flex gap-3 items-start hover:bg-white/5 rounded-xl transition-colors">
                     <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'deal' ? 'bg-[#FF3B30]/20 text-[#FF3B30]' : n.type === 'payment' ? 'bg-emerald-500/20 text-emerald-400' : n.type === 'ai' ? 'bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]' : 'bg-white/10 text-white/60'}`}>
                        {n.type === 'deal' && <FileSignature size={14} />}
                        {n.type === 'payment' && <DollarSign size={14} />}
                        {n.type === 'ai' && <Bot size={14} />}
                        {n.type === 'system' && <Activity size={14} />}
                     </div>
                     <div>
                        <p className="text-white text-xs font-medium leading-relaxed">{n.text}</p>
                        <span className="text-[9px] text-white/40 font-mono mt-1 block">{n.createdAt?.toDate().toLocaleTimeString()}</span>
                     </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className="w-14 h-14 bg-[#111]/80 backdrop-blur-xl border border-white/10 hover:border-white/30 rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 relative group"
      >
        <Bell size={20} className="group-hover:text-[var(--brand-primary)] transition-colors" />
        {unreadCount > 0 && !isOpen && (
          <div className="absolute top-0 right-0 w-5 h-5 bg-[#FF3B30] rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(255,59,48,0.5)] border-2 border-[#111] animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>
    </div>
  );
}
