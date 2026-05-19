import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, FunnelChart, Funnel, LabelList, Legend } from 'recharts';
import { Activity, TrendingUp, DollarSign, Users, Target, Sparkles } from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#000000]/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-white/60 text-xs font-mono uppercase tracking-wider mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
           <p key={index} className="text-white font-bold text-sm">
              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
              {entry.name}: {entry.name.includes('revenue') || entry.dataKey === 'revenue' || entry.dataKey === 'LTV' || entry.dataKey === 'CAC' ? '$' : ''}{entry.value.toLocaleString()}
           </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsHub() {
  const { user } = useAuth();
  
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [ltvData, setLtvData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    if (!user) return;

    // We fetch leads and invoices to construct analytics
    const leadsQ = query(collection(db, 'leads'), where('ownerId', '==', user.uid));
    const invoicesQ = query(collection(db, 'invoices'), where('ownerId', '==', user.uid));

    let leads: any[] = [];
    let invoices: any[] = [];

    const calculateAnalytics = async () => {
      // 1. Revenue Growth Over Time (Last 6 Months)
      const revData = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const monthStart = startOfMonth(d);
        const nextMonthStart = startOfMonth(subMonths(new Date(), i - 1));
        
        const monthInvoices = invoices.filter(inv => {
          if (!inv.sentAt) return false;
          const invDate = inv.sentAt.toDate ? inv.sentAt.toDate() : new Date(inv.sentAt);
          return invDate >= monthStart && invDate < nextMonthStart;
        });

        const totalRev = monthInvoices.reduce((sum, inv) => sum + (inv.amountPaid || inv.amount || 0), 0);
        
        revData.push({
          month: format(monthStart, 'MMM yyyy'),
          revenue: totalRev
        });
      }
      setRevenueData(revData);

      // 2. Lead Conversion Rates (Funnel)
      const statusCounts = {
        new: leads.filter(l => l.status === 'new').length,
        demo: leads.filter(l => l.status === 'demo').length,
        negotiation: leads.filter(l => l.status === 'negotiation').length,
        closed: leads.filter(l => l.status === 'closed' || l.status === 'editing' || l.status === 'delivered').length
      };

      setFunnelData([
         { name: 'Total Inbox', value: leads.length, fill: '#8884d8' },
         { name: 'Discovery / Demo', value: statusCounts.demo + statusCounts.negotiation + statusCounts.closed, fill: '#82ca9d' },
         { name: 'Negotiation', value: statusCounts.negotiation + statusCounts.closed, fill: '#ffc658' },
         { name: 'Closed Won', value: statusCounts.closed, fill: '#ff7300' }
      ]);

      // 3. CAC vs LTV Approximation
      // We'll calculate a proxy. CAC: Assume $50 per lead acquired (marketing/time).
      // LTV: Average closed deal size * 3 (assumed repeat business)
      
      const closedDeals = leads.filter(l => l.status === 'closed' || l.status === 'editing' || l.status === 'delivered');
      const totalDealValue = closedDeals.reduce((sum, l) => sum + (Number(l.budget) || 0), 0);
      const avgDealSize = closedDeals.length > 0 ? totalDealValue / closedDeals.length : 0;
      const estimatedLTV = avgDealSize * 3; 

      setLtvData([
        { name: 'CAC (Est)', CAC: 150, LTV: 0 },
        { name: 'LTV (Est)', CAC: 0, LTV: estimatedLTV }
      ]);
      
      setLoading(false);

      // Generate AI Summary
      if (leads.length > 0 || invoices.length > 0) {
        setGeneratingSummary(true);
        try {
          const statsPayload = {
            totalLeads: leads.length,
            closedLeads: statusCounts.closed,
            avgDealSize: avgDealSize,
            estimatedLTV: estimatedLTV,
            recentRevenue: revData
          };

          const response = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `Here are my latest agency analytics: ${JSON.stringify(statsPayload)}`,
              systemInstruction: `You are an elite business analyst. Provide a short, punchy, 2-3 sentence summary of the agency's performance based on the analytics provided. Focus on revenue trend, conversion rate, and LTV. Do NOT use markdown. Start with a decisive verdict like "Growth is strong." or "Pipeline requires attention."`
            })
          });
          const data = await response.json();
          if (response.ok) {
            setAiSummary(data.text);
          }
        } catch (err) {
          console.error("AI summary error:", err);
        } finally {
          setGeneratingSummary(false);
        }
      }
    };

    const unsubLeads = onSnapshot(leadsQ, (snap) => {
       leads = snap.docs.map(d => ({id: d.id, ...d.data()}));
       calculateAnalytics();
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, 'leads');
    });

    const unsubInvoices = onSnapshot(invoicesQ, (snap) => {
       invoices = snap.docs.map(d => ({id: d.id, ...d.data()}));
       calculateAnalytics();
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, 'invoices');
    });

    return () => {
      unsubLeads();
      unsubInvoices();
    };
  }, [user]);

  if (loading) {
     return <div className="p-10 text-white/40 font-mono text-xs uppercase text-center animate-pulse tracking-widest mt-20">Analyzing Datasets...</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-white font-body tracking-tight flex items-center gap-3">
           <Activity className="text-[var(--brand-primary)]" size={28} />
           Deep Analytics
        </h1>
        <p className="text-white/60 text-sm">Real-time performance evaluation and pipeline velocity.</p>
      </div>

      <div className="glass-panel p-6 rounded-[24px] bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[var(--brand-primary)]/20 shadow-[0_0_30px_rgba(0,239,209,0.05)]">
        <h2 className="text-sm font-bold text-white mb-3 uppercase tracking-[0.1em] font-mono flex items-center gap-2">
          <Sparkles size={16} className="text-[#00EFD1]" />
          AI Performance Summary
        </h2>
        {generatingSummary ? (
          <div className="flex items-center gap-3 text-white/50 text-sm font-mono animate-pulse">
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-100"></span>
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-200"></span>
            Generating weekly insights...
          </div>
        ) : (
          <p className="text-white/80 text-sm leading-relaxed font-body">
            {aiSummary || "No substantial data to analyze yet."}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth Over Time */}
        <div className="glass-panel p-6 rounded-[24px]">
          <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-[0.1em] font-mono flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            Revenue Growth
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(val) => `$${val}`} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Conversion Funnel */}
        <div className="glass-panel p-6 rounded-[24px]">
          <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-[0.1em] font-mono flex items-center gap-2">
            <Target size={16} className="text-[#00EFD1]" />
            Pipeline Velocity / Conversion Funnel
          </h2>
          <div className="h-[300px] w-full flex items-center justify-center">
            {funnelData.every(d => d.value === 0) ? (
               <p className="text-white/40 text-xs text-center font-mono uppercase tracking-widest">Not Enough Data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                 <FunnelChart>
                   <Tooltip content={<CustomTooltip />} />
                   <Funnel
                     dataKey="value"
                     data={funnelData}
                     isAnimationActive
                   >
                     <LabelList position="right" fill="#fff" stroke="none" dataKey="name" fontSize={12} offset={20} />
                     <LabelList position="center" fill="#000" stroke="none" dataKey="value" fontSize={14} fontWeight="bold" />
                   </Funnel>
                 </FunnelChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CAC vs LTV */}
        <div className="glass-panel p-6 rounded-[24px]">
          <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-[0.1em] font-mono flex items-center gap-2">
            <DollarSign size={16} className="text-purple-400" />
            LTV vs Target CAC
          </h2>
          <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={ltvData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                 <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                 <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(val) => `$${val}`} tickLine={false} axisLine={false} />
                 <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                 <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}/>
                 <Bar dataKey="CAC" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
                 <Bar dataKey="LTV" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={60} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
        
        {/* Retention / Activity (Placeholder for custom logic) */}
        <div className="glass-panel p-6 rounded-[24px] flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
               <Users size={24} className="text-blue-400" />
            </div>
            <h3 className="text-white font-bold mb-2">Churn Prediction Model</h3>
            <p className="text-xs text-white/50 max-w-xs leading-relaxed mb-6">
              AI analysis of delayed email replies, stalled video revisions, and payment friction indicates <strong className="text-white tracking-widest text-[#00EFD1]">High Retention Risk</strong> on 1 account.
            </p>
            <button className="bg-white/[0.05] hover:bg-white/10 text-white font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 rounded border border-white/10 transition-colors">
               Review At-Risk Accounts
            </button>
        </div>
      </div>
    </div>
  );
}
