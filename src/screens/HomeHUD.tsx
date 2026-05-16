import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  DollarSign, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Users, 
  Target, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  BarChart as BarChartIcon, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Play, 
  Sparkles,
  Command,
  Clock,
  Briefcase,
  BrainCircuit
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';

const MOCK_CONVERSION_DATA = [
  { name: 'Jan', rate: 12 },
  { name: 'Feb', rate: 15 },
  { name: 'Mar', rate: 14 },
  { name: 'Apr', rate: 22 },
  { name: 'May', rate: 28 },
  { name: 'Jun', rate: 25 },
];

const MOCK_NICHE_DATA = [
  { name: 'Gaming', value: 45000 },
  { name: 'Tech', value: 38000 },
  { name: 'Finance', value: 25000 },
  { name: 'Vlogs', value: 15000 },
];

export default function HomeHUD({ navigateTo }: { navigateTo: (tab: string) => void }) {
  const { user } = useAuth();
  
  const [conversionData, setConversionData] = useState(MOCK_CONVERSION_DATA);
  const [nicheData, setNicheData] = useState(MOCK_NICHE_DATA);

  const [metrics, setMetrics] = useState({
    mrr: 0,
    cashCollected: 0,
    pendingInvoices: 0,
    totalActiveProjects: 0
  });

  const [urgentItems, setUrgentItems] = useState<any[]>([]);
  const [omniScoutLeads, setOmniScoutLeads] = useState<any[]>([]);
  
  useEffect(() => {
    if (!user) return;

    // Fetch Leads
    const leadsQ = query(collection(db, 'leads'), where('ownerId', '==', user.uid));
    const unsubLeads = onSnapshot(leadsQ, (snap) => {
      const allLeads: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // OmniScout
      const aiLeads = allLeads.filter(l => l.source === 'OmniScout AI' && l.status === 'new').sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)).slice(0, 3);
      setOmniScoutLeads(aiLeads);
      
      // Urgent follow ups
      const today = new Date();
      today.setHours(0,0,0,0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dueLeads = allLeads.filter(l => {
         if (!l.followUpDate) return false;
         const d = l.followUpDate.toDate ? l.followUpDate.toDate() : new Date(l.followUpDate);
         return d >= today && d < tomorrow && l.status !== 'closed' && l.status !== 'lost';
      }).map(l => ({ 
         id: l.id, 
         title: `Follow up with ${l.brandName || l.contactName}`, 
         aiMessage: `${l.brandName || l.contactName} has been in '${l.status}' and needs follow-up.`,
         actionLabel: '1-Click Generate Follow-Up Email',
         actionType: 'followup',
         type: 'lead', 
         date: l.followUpDate 
      }));
      
      const newlyWon = allLeads.filter(l => {
         if (l.status !== 'closed') return false;
         const updatedStr = l.updatedAt?.toMillis ? l.updatedAt.toMillis() : Date.now();
         return (Date.now() - updatedStr) < 48 * 60 * 60 * 1000; // Won in last 48 hours
      }).map(l => ({
         id: l.id,
         title: `Onboard ${l.brandName || l.contactName}`,
         aiMessage: `You won the deal with ${l.brandName || l.contactName} recently. Time to draft onboarding docs.`,
         actionLabel: '1-Click Draft Onboarding Documents',
         actionType: 'onboard',
         type: 'project',
         date: l.updatedAt || l.createdAt
      }));

      setUrgentItems(prev => [...prev.filter(p => p.type !== 'lead' && p.actionType !== 'onboard'), ...dueLeads, ...newlyWon].sort((a,b) => (a.date?.toMillis ? a.date.toMillis() : new Date(a.date).getTime()) - (b.date?.toMillis ? b.date.toMillis() : new Date(b.date).getTime())));
      
      // Calculate Conversion & Niche Data
      const sortedByMonth = allLeads.reduce((acc, lead) => {
        const d = lead.createdAt?.toDate ? lead.createdAt.toDate() : new Date(lead.createdAt || Date.now());
        const m = d.getMonth();
        if(!acc[m]) acc[m] = { total: 0, won: 0 };
        acc[m].total++;
        if(lead.status === 'closed') acc[m].won++;
        return acc;
      }, {} as Record<number, {total:number, won:number}>);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentM = new Date().getMonth();
      const conData = [];
      for(let i=0; i<6; i++) {
        let mi = currentM - 5 + i;
        if(mi < 0) mi += 12;
        const entry = sortedByMonth[mi] || {total:0, won:0};
        const rate = entry.total > 0 ? Math.round((entry.won / entry.total)*100) : 0;
        conData.push({ name: monthNames[mi], rate });
      }
      setConversionData(conData.some(d => d.rate > 0) ? conData : MOCK_CONVERSION_DATA);

      const valByNiche = allLeads.filter(l => l.status === 'closed' && l.budget).reduce((acc, lead) => {
         const niche = lead.industry || 'Other';
         acc[niche] = (acc[niche] || 0) + Number(lead.budget);
         return acc;
      }, {} as Record<string, number>);
      
      let nData: Array<{name: string, value: number}> = Object.entries(valByNiche).map(([name, value]) => ({name, value: value as number})).sort((a,b)=>b.value-a.value).slice(0, 4);
      if(nData.length === 0) nData = MOCK_NICHE_DATA;
      setNicheData(nData);

    }, e => handleFirestoreError(e, OperationType.LIST, 'leads'));

    // Fetch Invoices
    const invoicesQ = query(collection(db, 'invoices'), where('ownerId', '==', user.uid));
    const unsubInvoices = onSnapshot(invoicesQ, (snap) => {
      const allInvoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      let collected = 0;
      let pending = 0;
      let mrr = 0;
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      allInvoices.forEach((inv: any) => {
         if (inv.status === 'paid') {
            const pd = inv.paidAt?.toDate ? inv.paidAt.toDate() : new Date(inv.paidAt || inv.createdAt?.toDate?.() || Date.now());
            if (pd.getMonth() === currentMonth && pd.getFullYear() === currentYear) {
               collected += Number(inv.amount || 0);
            }
         }
         if (inv.status === 'sent' || inv.status === 'pending') {
            pending += Number(inv.amount || 0);
         }
         if (inv.isRecurring && inv.recurringSchedule && inv.recurringSchedule !== "none") {
            const amt = Number(inv.amount || 0);
            if (inv.recurringSchedule === "weekly") mrr += amt * 4.33;
            else if (inv.recurringSchedule === "monthly") mrr += amt;
            else if (inv.recurringSchedule === "quarterly") mrr += amt / 3;
            else if (inv.recurringSchedule === "yearly") mrr += amt / 12;
         } else if (inv.isRecurring) {
            mrr += Number(inv.amount || 0);
         }
      });
      
      setMetrics(m => ({ ...m, cashCollected: collected, pendingInvoices: pending, mrr }));
    }, e => handleFirestoreError(e, OperationType.LIST, 'invoices'));
    
    // Fetch Projects
    // We compute active projects by reading closed leads (which are projects)
    const unsubProjects = onSnapshot(leadsQ, (snap) => {
      const allProjects = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((p:any) => p.status === 'closed');
      
      const active = allProjects.filter((p: any) => p.deliveryStage !== 'done');
      setMetrics(m => ({ ...m, totalActiveProjects: active.length }));
      
      const atRisk = active.filter((p: any) => p.deliveryStage === 'revisions' || p.distressSignal).map((p: any) => ({
         id: p.id,
         title: `Project Revisions/Risk: ${p.brandName || p.contactName}`,
         type: 'project',
         date: p.updatedAt || p.createdAt
      }));
      
      // We already add urgentItems from leads, so we just append these on top.
      setUrgentItems(prev => {
         const nonProj = prev.filter(p => p.type !== 'project');
         return [...nonProj, ...atRisk];
      });
      
    }, e => handleFirestoreError(e, OperationType.LIST, 'leads'));

    return () => {
      unsubLeads();
      unsubInvoices();
      unsubProjects();
    };
  }, [user]);

  return (
    <div className="p-6 md:p-10 w-full max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-body font-bold tracking-tight text-white flex items-center gap-2">
            <Command size={28} className="text-[#FF3B30]" />
            Command Center
          </h1>
          <p className="text-white/40 mt-1 font-mono uppercase tracking-[0.2em] text-[10px]">System HUD &bull; Status: Nominal</p>
        </div>
        <div className="hidden sm:flex text-right flex-col items-end">
           <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#FF3B30] mb-1 font-bold">Secure Connection</div>
           <div className="flex gap-1.5 items-center">
             <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-pulse"></div>
             <span className="text-white/60 text-xs font-mono">{new Date().toISOString().split('T')[0]}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="glass-card cyber-border p-6 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)]/10 blur-[40px] rounded-full group-hover:bg-[var(--brand-primary)]/20 transition-all duration-700"></div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-3 flex items-center gap-2">
             <TrendingUp size={14} className="text-[var(--brand-primary)]" />
             Estimated MRR
          </p>
          <p className="text-4xl font-body font-bold text-white tracking-tight text-glow">${Math.round(metrics.mrr).toLocaleString()}</p>
        </motion.div>

        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.05}} className="glass-card cyber-border p-6 relative group overflow-hidden">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-3 flex items-center gap-2">
             <DollarSign size={14} className="text-green-500" />
             Month's Cash
          </p>
          <p className="text-4xl font-body font-bold text-white tracking-tight text-glow">${metrics.cashCollected.toLocaleString()}</p>
        </motion.div>
        
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="glass-card cyber-border p-6 relative overflow-hidden group">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-3 flex items-center gap-2">
             <Clock size={14} className="text-yellow-500" />
             Pending Invoices
          </p>
          <p className="text-4xl font-body font-bold text-white tracking-tight text-glow">${metrics.pendingInvoices.toLocaleString()}</p>
        </motion.div>

        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.15}} className="glass-card cyber-border p-6 relative overflow-hidden group">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-3 flex items-center gap-2">
             <Briefcase size={14} className="text-blue-500" />
             Active Projects
          </p>
          <p className="text-4xl font-body font-bold text-white tracking-tight text-glow">{metrics.totalActiveProjects}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Best Action AI Engine */}
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.15}} className="glass-card overflow-hidden flex flex-col relative group">
           <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--brand-primary)]/40 to-transparent"></div>
           <div className="p-6 border-b border-white/[0.05] flex justify-between items-center bg-[#0a0a0a]/50">
             <h2 className="text-xs font-mono uppercase tracking-[0.1em] text-white font-bold flex items-center gap-2">
               <BrainCircuit size={16} className="text-[var(--brand-primary)] animate-pulse" /> Next Best Action AI
             </h2>
             <span className="text-[10px] font-mono tracking-[0.1em] text-[var(--brand-primary)] px-2 py-1 rounded-md bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 uppercase font-bold">Auto-Pilot</span>
           </div>
           <div className="p-3 flex-1 flex flex-col gap-1 min-h-[250px] overflow-y-auto custom-scrollbar">
             {urgentItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/40">
                  <CheckCircle2 size={32} className="mb-3 opacity-20" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em]">All clear. No urgent actions.</p>
                </div>
             ) : (
                urgentItems.map((item, i) => (
                  <div key={i} className="flex flex-col gap-3 p-4 hover:bg-white/[0.02] rounded-xl group/item border border-transparent hover:border-white/[0.05] transition-all bg-[#0a0a0a]/50 mb-1">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full ${item.type === 'project' ? 'bg-[#FF3B30]' : 'bg-[var(--brand-primary)] animate-pulse'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium group-hover/item:text-white transition-colors">{item.aiMessage || item.title}</p>
                      </div>
                    </div>
                    <div className="flex justify-start pl-5 pt-1">
                       <button onClick={() => {
                          if (item.actionType === 'followup' || item.actionType === 'onboard') {
                             navigateTo('leads'); // Ideally we'd select the specific lead, but navigating to leads is standard
                          } else {
                             navigateTo(item.type === 'project' ? 'projects' : 'leads');
                          }
                       }} className="bg-[var(--brand-primary)] text-white hover:bg-zinc-200 hover:text-black font-bold uppercase tracking-[0.15em] text-[9px] px-3 py-1.5 rounded transition-all flex items-center gap-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.5)]">
                         <Sparkles size={10} /> {item.actionLabel || 'REVIEW LEAD'}
                       </button>
                    </div>
                  </div>
                ))
             )}
           </div>
        </motion.div>

        {/* OmniScout Mini-Feed */}
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="glass-card rounded-3xl border border-[#FF3B30]/10 overflow-hidden flex flex-col relative shadow-[0_0_40px_rgba(255,59,48,0.05)]">
           <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF3B30]/40 to-transparent"></div>
           <div className="p-5 border-b border-white/[0.05] flex justify-between items-center bg-[#111111]/80">
             <h2 className="text-sm font-mono uppercase tracking-[0.1em] text-white font-bold flex items-center gap-2">
               <Sparkles size={16} className="text-[#FF3B30]" /> OmniScout Findings
             </h2>
             <button onClick={() => navigateTo('prospector')} className="text-[10px] uppercase font-mono tracking-[0.1em] text-[#FF3B30] hover:text-white transition-colors flex items-center gap-1">
               Open Radar <ChevronRight size={12} />
             </button>
           </div>
           <div className="p-3 flex-1 flex flex-col gap-2 min-h-[250px]">
             {omniScoutLeads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/40">
                  <Target size={32} className="mb-3 opacity-20" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em]">No AI leads yet. Run Scout.</p>
                </div>
             ) : (
                omniScoutLeads.map((lead: any) => (
                  <div key={lead.id} className="bg-[#141414] border border-white/[0.04] p-4 rounded-2xl flex flex-col gap-2">
                     <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-bold tracking-tight">{lead.brandName || lead.contactName}</h3>
                          <p className="text-xs text-white/60">{lead.niche} &bull; {lead.subscribers || 'Unknown Data'}</p>
                        </div>
                        <div className="px-2 py-0.5 rounded bg-[#FF3B30]/10 text-[#FF3B30] text-[10px] font-mono font-bold tracking-widest border border-[#FF3B30]/20">
                          {lead.leadScore?.split('-')[0] || 'NEW'}
                        </div>
                     </div>
                     <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{lead.aiSummary || 'High-value match detected by OmniScout.'}</p>
                     <div className="flex justify-end mt-1">
                        <button onClick={() => navigateTo('leads')} className="text-[10px] uppercase font-mono tracking-[0.1em] text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded flex items-center gap-1">
                          View Target
                        </button>
                     </div>
                  </div>
                ))
             )}
           </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Conversion Rate Area Chart */}
         <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.25}} className="lg:col-span-2 glass-card p-6 flex flex-col h-[350px]">
            <h2 className="text-sm font-mono uppercase tracking-[0.1em] text-white/60 font-bold flex items-center gap-2 mb-6">
              <BarChartIcon size={16} /> Lead-to-Close Conversion Rate
            </h2>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={conversionData}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FF3B30" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                    labelStyle={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}
                    formatter={(value: any) => [`${value}%`, 'Rate']}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#FF3B30" fillOpacity={1} fill="url(#colorRate)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-white/40 font-mono pointer-events-none px-2">
                 <span>Jan</span>
                 <span>Jun</span>
              </div>
            </div>
         </motion.div>
         
         {/* Niches Bar Chart */}
         <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.3}} className="glass-card p-6 flex flex-col h-[350px]">
            <h2 className="text-sm font-mono uppercase tracking-[0.1em] text-white/60 font-bold mb-6">
              Most Profitable Niches
            </h2>
            <div className="flex-1 w-full container">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={nicheData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} width={50} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                      contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)' }}
                      formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {nicheData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#34C759' : index === 1 ? '#FF3B30' : index === 2 ? '#AF52DE' : '#007AFF'} />
                      ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
            </div>
         </motion.div>
      </div>

    </div>
  );
}
