import React, { useState } from 'react';
import { 
  Search, Bell, HelpCircle, AlertTriangle, Users, Eye, PlaySquare, MessageSquare, ThumbsUp, Activity, TrendingUp, DollarSign, Calendar, MapPin, Target, Zap, BrainCircuit, UserCheck, ShieldAlert, ListVideo, Flame, Video, FileDown, Scissors, Mail, Sparkles, X
} from 'lucide-react';
import { searchYouTubeChannel, getRecentChannelVideos, YouTubeChannel, YouTubeVideo, isYouTubeKeyAvailable, getTrendingVideosInNiche } from '../services/youtube';
import { generateChannelAudit, generateVideoTeardown } from '../services/ai';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getAI } from '../services/ai';
import { motion, AnimatePresence } from 'motion/react';
export default function Trends() {
  const [viewMode, setViewMode] = useState<'analytics' | 'audit' | 'ideas' | 'teardown'>('analytics');
  
  // Audit State
  const [searchQuery, setSearchQuery] = useState('');
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Ideas State
  const [trendingQuery, setTrendingQuery] = useState('');
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  // Teardown State
  const [teardownUrl, setTeardownUrl] = useState('');
  const [teardownLoading, setTeardownLoading] = useState(false);
  const [teardownReport, setTeardownReport] = useState<string | null>(null);

  // Script Generator
  const [selectedTrendVideo, setSelectedTrendVideo] = useState<any | null>(null);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetLeadId, setTargetLeadId] = useState('');

  // Analytics State
  const [analyticsLeads, setAnalyticsLeads] = useState<any[]>([]);
  const { user } = useAuth();

  React.useEffect(() => {
     if (!user) return;
     const q = query(collection(db, 'leads'), where('ownerId', '==', user.uid));
     const unsub = onSnapshot(q, (snap) => {
        setAnalyticsLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
     });
     return () => unsub();
  }, [user]);

  // Derived Analytics Data
  const { conversionRate, pipelineData, nicheData, statusData, avgDealSize } = React.useMemo(() => {
     let totalClosed = 0;
     let totalLost = 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
     let activeClosed = 0;
     let pipelineVal = 0;
     let totalDealVal = 0;
     const nicheCount: Record<string, number> = {};
     const statusCount: Record<string, number> = { 'new': 0, 'contacted': 0, 'negotiating': 0 };
     
     analyticsLeads.forEach(l => {
        if (l.status === 'closed') {
          totalClosed++;
          activeClosed++;
          totalDealVal += Number(l.budget || 0);
        } else if (l.status === 'lost') {
          totalLost++;
        } else {
           pipelineVal += Number(l.budget || l.estimatedUpsideValue?.replace(/[^0-9]/g, '') || 0);
           if (statusCount[l.status] !== undefined) {
             statusCount[l.status]++;
           } else {
             statusCount['new'] = (statusCount['new'] || 0) + 1;
           }
        }
        if (l.niche) {
           nicheCount[l.niche] = (nicheCount[l.niche] || 0) + (l.status === 'closed' ? Number(l.budget || 0) : 0);
        }
     });

     const resolved = totalClosed + totalLost;
     const convRate = resolved > 0 ? Math.round((totalClosed / resolved) * 100) : 0;
     const avgDeal = totalClosed > 0 ? totalDealVal / totalClosed : 0;

     const sortedNiches = Object.entries(nicheCount).map(([name, val]) => ({ name, value: val })).sort((a,b) => b.value - a.value).slice(0, 5);

     const statuses = [
       { name: 'Lead In', value: statusCount['new'] },
       { name: 'Contacted', value: statusCount['contacted'] },
       { name: 'Negotiating', value: statusCount['negotiating'] },
     ];

     return {
        conversionRate: convRate,
        pipelineData: [{ name: 'Current Pipeline', value: pipelineVal }],
        nicheData: sortedNiches,
        statusData: statuses,
        avgDealSize: avgDeal
     };
  }, [analyticsLeads]);

  const runTeardown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teardownUrl.trim()) return;
    setTeardownLoading(true);
    setTeardownReport(null);
    try {
      const data = await generateVideoTeardown(teardownUrl);
      setTeardownReport(data);
      toast.success("Teardown generated.");
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate teardown');
    } finally {
      setTeardownLoading(false);
    }
  };

  const generateHookAndScript = async (video: any) => {
    setGeneratingScript(true);
    setGeneratedScript(null);
    setSelectedTrendVideo(video);
    try {
      const client = getAI();
      if (!client) throw new Error("AI not configured");
      const prompt = `Act as an expert YouTube strategist and retention hacker. The original trending video is titled: "${video.title}" by "${video.channelTitle}".
We want to ride this trend but make our own highly original, extremely retaining version.

Task:
1. Generate 3 highly clickable, curiosity-gap A/B title options.
2. Formulate a killer Hook (0-5 seconds): write the exact word-for-word script that guarantees a retention spike. Play on loss aversion or curiosity.
3. Write a brief outline/intro script for the first 30 seconds of the video, including B-roll suggestions.
4. Suggest 2 high-CTR thumbnail visual concepts.
5. Identify the "Trend Trigger": why is this video going viral right now?

Format the output beautifully with markdown headings and bullet points. Be concise.`;
      const res = await client.models.generateContent({ model: 'gemini-3.1-pro-preview', contents: prompt });
      setGeneratedScript(res.text || '');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate script');
    } finally {
      setGeneratingScript(false);
    }
  };

  const generateTargetedProspectScript = async () => {
    if (!selectedTrendVideo || !targetLeadId) return;
    const lead = analyticsLeads.find(l => l.id === targetLeadId);
    if (!lead) return;

    setGeneratingScript(true);
    setGeneratedScript(null);
    setShowTargetModal(false);
    
    try {
      const client = getAI();
      if (!client) throw new Error("AI not configured");
      const prompt = `Act as an expert YouTube strategist and cold outreach sniper.
We found this trending video: "${selectedTrendVideo.title}" by "${selectedTrendVideo.channelTitle}".
We want to pitch our prospect: "${lead.brandName}" (Niche: ${lead.niche}).

Task:
1. Write a custom viral script and storyboard tailored to this prospect, inspired by the trending video's core psychological hooks.
2. Write a short, hyper-personalized cold outreach email to this prospect proposing we edit this specific viral concept for them.
Format the output beautifully with markdown headings and bullet points. Be concise.`;
      const res = await client.models.generateContent({ model: 'gemini-3.1-pro-preview', contents: prompt });
      setGeneratedScript(res.text || '');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate targeted script');
    } finally {
      setGeneratingScript(false);
    }
  };

  // Helper to format large numbers
  const formatNumber = (numStr: string | undefined) => {
    if (!numStr) return '0';
    const num = parseInt(numStr, 10);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (!isYouTubeKeyAvailable) {
       toast.error("VITE_YOUTUBE_API_KEY is not configured.");
       return;
    }

    setLoading(true);
    setChannel(null);
    setVideos([]);
    setAudit(null);
    
    try {
      const channelData = await searchYouTubeChannel(searchQuery);
      if (channelData) {
        setChannel(channelData);
        const videoData = await getRecentChannelVideos(channelData.id, channelData.uploadsPlaylistId, 10);
        setVideos(videoData);
        
        // Auto-run audit
        setLoadingAudit(true);
        generateChannelAudit(channelData, videoData).then(data => {
            setAudit(data);
        }).catch(err => {
            console.error("Auto-audit failed:", err);
            toast.error("Failed to generate AI report automatically.");
        }).finally(() => {
            setLoadingAudit(false);
        });

      } else {
        toast.error("No channel found for that query.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch YouTube data.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    if (!channel || videos.length === 0) return;
    setLoadingAudit(true);
    try {
      const data = await generateChannelAudit(channel, videos);
      setAudit(data);
      toast.success("AI Deep Audit complete.");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate AI Audit.");
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleSaveLead = async () => {
    if (!channel || !user) return;
    try {
      const newLead = {
        ownerId: user.uid,
        brandName: channel.title,
        status: 'new',
        niche: audit?.contentArchetype || 'YouTube Channel',
        budget: audit?.pricingStrategy || '$2000',
        contactName: 'Creator',
        notes: channel.description.slice(0, 100),
        estimatedUpsideValue: audit?.estimatedMissedRevenue || 'Unknown',
        distressSignal: !!(audit?.retentionLeaks && audit.retentionLeaks.length > 0),
        hiringIntent: 'Scanned via AI Deep Audit',
        pitchVariants: {
          alpha: audit?.pitchAngle || '',
          beta: audit?.objectionHandling || '',
          gamma: '',
          delta: audit?.actionPlan30Days?.join('\\n') || ''
        },
        createdAt: serverTimestamp()
      };
      
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const docRef = await addDoc(collection(db, 'leads'), newLead);
      toast.success("Lead securely injected into CRM Pipeline.");
    } catch (e: any) {
      toast.error('Failed to save to CRM: ' + e.message);
    }
  };

  const handleTrendingSearch = async (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const q = presetQuery || trendingQuery;
    if (!q.trim()) return;

    if (!isYouTubeKeyAvailable) {
       toast.error("VITE_YOUTUBE_API_KEY is not configured.");
       return;
    }

    if (presetQuery && presetQuery !== trendingQuery) {
       setTrendingQuery(presetQuery);
    }

    setTrendingLoading(true);
    setTrendingVideos([]);
    
    try {
      const data = await getTrendingVideosInNiche(q, 16);
      setTrendingVideos(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch trending videos.");
      console.error(e);
    } finally {
      setTrendingLoading(false);
    }
  };

  // Format data for chart
  const chartData = videos.slice().reverse().map((v, i) => ({
    name: `Vid ${i+1}`,
    views: parseInt(v.viewCount, 10) || 0,
    likes: parseInt(v.likeCount, 10) || 0,
    title: v.title.substring(0, 30) + '...',
  }));

  // Calculate advanced metrics (Algorithm System Update)
  const avgViews = videos.length > 0 ? videos.reduce((acc, v) => acc + (parseInt(v.viewCount, 10) || 0), 0) / videos.length : 0;
  const avgLikes = videos.length > 0 ? videos.reduce((acc, v) => acc + (parseInt(v.likeCount, 10) || 0), 0) / videos.length : 0;
  const avgComments = videos.length > 0 ? videos.reduce((acc, v) => acc + (parseInt(v.commentCount, 10) || 0), 0) / videos.length : 0;
  const engRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0;
  
  // Algorithmic Revenue Modeling
  const estSponsorshipVal = (avgViews / 1000) * 20; // assumed $20 CPM 
  const estMonthlyAdsense = (avgViews * Math.max(1, videos.length || 4) / 1000) * 3.5; // Monthly Adsense proxy
  const algorithmicRevenueRating = (estSponsorshipVal + estMonthlyAdsense) > 10000 ? "HIGH TIER" : "SCALING";

  return (
    <div className="flex-1 bg-transparent w-full relative">
      <header className="bg-[#000000]/60 backdrop-blur-[80px] saturate-[2.0] border-b border-white/[0.02] top-0 sticky z-40 flex justify-between items-center w-full px-8 py-5">
        <div className="flex items-center gap-4">
          <span className="md:hidden font-black text-2xl text-white font-body tracking-tight">TR</span>
          <h2 className="text-xl font-body tracking-tight font-semibold text-white hidden lg:flex items-center gap-2">
            <TrendingUp size={20} className="text-white/60" /> Trends
          </h2>
        </div>
        <div className="flex items-center gap-10">
           <form onSubmit={handleSearch} className="relative group rounded-2xl bg-white/5 border border-white/[0.04] flex items-center px-4 py-2 w-72 transition-all focus-within:border-white/20 focus-within:ring-1 focus-within:ring-[var(--brand-primary)]/50 focus-within:bg-[#000000]/50">
            <Search className="text-white/60 mr-2 group-focus-within:text-zinc-100 transition-colors" size={16} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-sm w-full p-0 text-white placeholder-zinc-500 focus:outline-none focus:ring-0" 
              placeholder="Search YouTube channel..." 
              type="text" 
            />
          </form>
          <div className="flex items-center gap-2 text-white/60">
            <button className="p-2 hover:text-white rounded-2xl hover:bg-white/5 transition-colors">
              <Bell size={18} />
            </button>
            <button className="p-2 hover:text-white rounded-2xl hover:bg-white/5 transition-colors">
              <HelpCircle size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="p-10 max-w-[1400px] mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-body tracking-tight font-semibold text-white">Channel Analytics & Trends</h2>
            <p className="text-white/60 text-sm mt-1">Research channels to view live performance metrics and AI audits.</p>
          </div>
          <div className="flex bg-[#0f0f0f] border border-white/[0.04] p-1 rounded-sm hidden md:flex font-mono">
             <button 
                onClick={() => setViewMode('analytics')}
                className={`px-6 py-2 text-xs font-black uppercase tracking-[0.2em] rounded-sm transition-all flex items-center gap-2 ${viewMode === 'analytics' ? 'bg-[#000000] text-zinc-100 shadow-[0_4px_24px_rgba(255,255,255,0.15)]' : 'text-white/60 hover:text-white/80'}`}
             >
                <Activity size={14} /> Analytics
             </button>
             <button 
                onClick={() => setViewMode('audit')}
                className={`px-6 py-2 text-xs font-black uppercase tracking-[0.2em] rounded-sm transition-all flex items-center gap-2 ${viewMode === 'audit' ? 'bg-[#000000] text-zinc-100 shadow-[0_4px_24px_rgba(255,255,255,0.15)]' : 'text-white/60 hover:text-white/80'}`}
             >
                <Target size={14} /> Kill Report
             </button>
             <button 
                onClick={() => setViewMode('teardown')}
                className={`px-6 py-2 text-xs font-black uppercase tracking-[0.2em] rounded-sm transition-all flex items-center gap-2 ${viewMode === 'teardown' ? 'bg-[#000000] text-zinc-100 shadow-[0_4px_24px_rgba(255,255,255,0.15)]' : 'text-white/60 hover:text-white/80'}`}
             >
                <Video size={14} /> Video Teardown
             </button>
             <button 
                onClick={() => {
                   setViewMode('ideas');
                   if (trendingVideos.length === 0) handleTrendingSearch(undefined, 'Video Editing Tutorial');
                }}
                className={`px-6 py-2 text-xs font-black uppercase tracking-[0.2em] rounded-sm transition-all flex items-center gap-2 ${viewMode === 'ideas' ? 'bg-white/10 text-zinc-100 shadow-[0_4px_24px_rgba(255,255,255,0.15)]' : 'text-white/60 hover:text-white/80'}`}
             >
                <Flame size={14} /> Viral Exudation
             </button>
          </div>
        </div>

        {!isYouTubeKeyAvailable && (
           <div className="mb-8 p-4 bg-white/10 border border-white/20 rounded-2xl flex items-start gap-3 text-amber-200">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <p className="text-sm">
                <strong>YouTube API Key Required.</strong> To use this live dashboard, please add <code className="bg-[#000000]/30 px-1 py-0.5 rounded text-xs font-mono">VITE_YOUTUBE_API_KEY</code> to your environment secrets in AI Studio.
              </p>
           </div>
        )}

        <div className="md:hidden flex bg-[#0f0f0f] border border-white/[0.04] p-1 rounded-sm mb-6">
           <button 
              onClick={() => setViewMode('audit')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm transition-all flex items-center justify-center gap-2 ${viewMode === 'audit' ? 'bg-[#000000] text-white' : 'text-white/60'}`}
           >
              Channel Analytics
           </button>
           <button 
              onClick={() => {
                 setViewMode('ideas');
                 if (trendingVideos.length === 0) handleTrendingSearch(undefined, 'Video Editing Tutorial');
              }}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm transition-all flex items-center justify-center gap-2 ${viewMode === 'ideas' ? 'bg-white/10 text-zinc-100' : 'text-white/60'}`}
           >
              Viral Ideation
           </button>
        </div>

         {viewMode === 'analytics' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
               <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] border border-white/[0.04] rounded-sm p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-zinc-100"><Activity size={120} /></div>
                  <h3 className="text-xl font-bold font-body tracking-tight text-white tracking-tight mb-2 relative z-10 flex items-center gap-2">
                     <Activity size={18} className="text-white/60" /> Agency Pipeline Analytics
                  </h3>
                  <p className="text-sm text-white/60 relative z-10 max-w-2xl">Visual breakdown of your pipeline performance and conversion trends.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Lead-to-Close Rate */}
                  <div className="glass-card p-8 group">
                     <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">Lead-to-Close Rate</p>
                     <p className="text-4xl font-body tracking-tight font-black text-white">{conversionRate}%</p>
                     <div className="mt-4 w-full bg-[#000000] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                        <div className="bg-white h-full" style={{ width: `${conversionRate}%` }}></div>
                     </div>
                  </div>
                  
                  {/* Pipeline Projection */}
                  <div className="glass-card p-8 group">
                     <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">Estimated Pipeline Upside</p>
                     <p className="text-4xl font-body tracking-tight font-black text-white px-2 py-1 bg-white/5 w-max rounded-sm border border-white/[0.05] border border-white/5">${pipelineData[0].value.toLocaleString()}</p>
                     <p className="text-[10px] font-mono tracking-widest mt-4 uppercase font-bold text-yellow-500">From active leads</p>
                  </div>

                  {/* Avg Deal Size */}
                  <div className="glass-card p-8 group">
                     <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">Avg Retainer Value</p>
                     <p className="text-4xl font-body tracking-tight font-black text-[#34C759] px-2 py-1 bg-[#34C759]/10 w-max rounded-sm border border-[#34C759]/20">${Math.round(avgDealSize).toLocaleString()}</p>
                     <p className="text-[10px] font-mono tracking-widest mt-4 uppercase font-bold text-[#34C759]/70">Per closed client</p>
                  </div>

                  {/* Funnel Outline */}
                  <div className="glass-card p-6 flex flex-col justify-between group">
                     <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-3">Active Deal Funnel</p>
                     <div className="space-y-2 flex-1 flex flex-col justify-end">
                       {statusData.map((s, idx) => (
                         <div key={idx} className="flex justify-between items-center bg-[#000000] p-2 border border-white/[0.04] rounded-sm">
                           <span className="text-xs text-white/60 font-mono uppercase tracking-widest">{s.name}</span>
                           <span className="text-sm font-bold text-white">{s.value}</span>
                         </div>
                       ))}
                     </div>
                  </div>
               </div>

               {/* Niche Breakdown */}
               <div className="glass-card p-10 h-[400px] flex flex-col">
                  <h3 className="text-lg font-bold text-white font-body tracking-tight mb-4">Most Profitable Niches</h3>
                  <div className="flex-1 w-full min-h-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={nicheData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                           <XAxis dataKey="name" stroke="#ffffff30" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                           <YAxis stroke="#ffffff30" fontSize={12} tickFormatter={(val) => '$' + formatNumber(val.toString())} axisLine={false} tickLine={false} width={80} />
                           <Tooltip 
                              contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#222', borderRadius: '4px', color: '#fff' }}
                              itemStyle={{ color: 'white', fontWeight: 'bold' }}
                              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                           />
                           <Bar dataKey="value" fill="white" radius={[2, 2, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
         )}
         
        {viewMode === 'audit' && (
          <>
            {loading && (
              <div className="space-y-6 animate-pulse mt-8">
                <div className="bg-[#000] border border-white/[0.04] flex flex-col relative overflow-hidden h-[300px] mb-4">
                   <div className="w-full h-48 bg-white/5 relative overflow-hidden shrink-0"></div>
                   <div className="flex flex-col md:flex-row items-center md:items-start gap-10 px-6">
                     <div className="w-32 h-32 rounded-full border-4 border-[#000] bg-white/10 -mt-20 shrink-0"></div>
                     <div className="flex-1 w-full pt-4 space-y-4">
                        <div className="h-8 bg-white/10 w-1/3 rounded"></div>
                        <div className="h-4 bg-white/5 w-1/4 rounded"></div>
                        <div className="h-10 bg-white/5 w-full max-w-xl rounded"></div>
                     </div>
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-[#0f0f0f] border border-white/[0.04] p-5 h-24 rounded flex flex-col justify-center">
                       <div className="h-4 bg-white/10 w-1/2 mb-2 rounded"></div>
                       <div className="h-6 bg-white/5 w-3/4 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!channel && !loading && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] border border-white/[0.04] rounded-sm p-10 mb-8 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-white"><Search size={120} /></div>
                   <h3 className="text-xl font-bold font-body tracking-tight text-white tracking-tight mb-2 relative z-10 flex items-center gap-2">
                      <Search size={18} className="text-white/60" /> Research Channel
                   </h3>
                   <p className="text-sm text-white/60 mb-6 relative z-10 max-w-2xl">Search for a YouTube channel to pull live metrics and generate an AI editing audit.</p>
                   
                   <form onSubmit={handleSearch} className="relative z-10 flex gap-4 max-w-xl">
                      <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-zinc-100" size={16} />
                        <input 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search YouTube channel (e.g., MKBHD, MrBeast)"
                          className="w-full bg-[#0f0f0f] border border-white/[0.06] rounded-sm py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
                        />
                      </div>
                      <button type="submit" disabled={loading || !searchQuery} className="bg-[var(--brand-primary)] text-white hover:bg-zinc-200 text-black shadow-[0_4px_24px_rgba(255, 59, 48,0.3)] disabled:opacity-50 disabled:active:scale-100 text-black font-black px-6 py-3 rounded-sm tracking-[0.2em] uppercase text-[10px] transition-all active:scale-95 whitespace-nowrap">
                         ACQUIRE TARGET
                      </button>
                   </form>
                </div>
              </div>
            )}

            {channel && !loading && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            {/* Channel Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4 bg-[#000000] rounded-sm pt-0 pb-6 px-6 ambient-shadow border border-white/[0.04] flex flex-col relative overflow-hidden">
                {channel.bannerUrl && (
                  <div className="w-full h-32 md:h-48 bg-[#000000] -mx-6 mb-6 relative overflow-hidden shrink-0">
                     <img src={channel.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-70 border-b border-white/[0.04]" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent"></div>
                  </div>
                )}
                <div className={`flex flex-col md:flex-row items-center md:items-start gap-10 text-white ${!channel.bannerUrl && 'pt-6'}`}>
                  <img src={channel.thumbnailUrl} alt="Thumbnail" className={`w-32 h-32 rounded-full border-4 border-[#1a1a1a] shadow-2xl relative ${channel.bannerUrl ? '-mt-20' : ''}`} />
                  <div className="text-center md:text-left flex-1">
                    <h3 className="text-4xl font-body tracking-tight font-black tracking-[0.02em] drop-shadow-sm flex items-center justify-center md:justify-start gap-4">
                      {channel.title} <span className="bg-white/20 text-zinc-100 border border-white/30 text-xs px-2 py-0.5 rounded font-mono uppercase tracking-[0.2em] shadow-[0_4px_24px_rgba(255,255,255,0.15)]">Target Locked</span>
                    </h3>
                    {channel.customUrl && <p className="text-zinc-100 font-mono text-sm mt-1">{channel.customUrl}</p>}
                    <p className="text-sm text-white/60 max-w-3xl line-clamp-2 mt-3 font-mono">{channel.description}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                      <a href={`https://youtube.com/channel/${channel.id}`} target="_blank" rel="noreferrer" className="text-black bg-white hover:bg-zinc-200 px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all active:scale-95 w-max">
                        <PlaySquare size={14} /> Open Channel
                      </a>
                      <button 
                         onClick={runAudit}
                         disabled={loadingAudit}
                         className="text-zinc-100 bg-white/10 border border-white/20 hover:bg-white/20 px-5 py-2.5 rounded-sm text-[10px] font-black shadow-[0_4px_24px_rgba(255,255,255,0.15)] uppercase tracking-[0.2em] flex items-center gap-2 transition-colors w-max disabled:opacity-50"
                      >
                         {loadingAudit ? <BrainCircuit className="animate-spin text-white" size={14} /> : <BrainCircuit size={14} className="text-white" />} 
                         {loadingAudit ? 'IDENTIFYING WEAKNESSES...' : 'GENERATE AI KILL REPORT'}
                      </button>
                      {audit && (
                         <button 
                           onClick={handleSaveLead}
                           className="bg-[var(--brand-primary)] text-black hover:bg-[var(--brand-primary)]/80 px-5 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors w-max shadow-[0_4px_15px_rgba(var(--brand-primary-rgb),0.3)]"
                         >
                           <Zap size={14} /> Convert to Lead
                         </button>
                      )}
                      {channel.country && <span className="text-white/60 font-mono text-[10px] uppercase tracking-[0.2em] bg-white/5 border border-white/[0.04] px-3 py-2 rounded-sm flex items-center gap-1.5"><MapPin size={12}/> {channel.country}</span>}
                      {channel.publishedAt && <span className="text-white/60 font-mono text-[10px] uppercase tracking-[0.2em] bg-white/5 border border-white/[0.04] px-3 py-2 rounded-sm flex items-center gap-1.5"><Calendar size={12}/> Joined {new Date(channel.publishedAt).getFullYear()}</span>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-10 flex justify-between flex-col gap-2">
                 <div className="flex items-center gap-2 text-white/60 uppercase text-[10px] font-bold tracking-[0.2em]"><Users size={14}/> Subs & Views</div>
                 <div>
                   <div className="text-3xl font-black text-white">{formatNumber(channel.subscriberCount)}</div>
                   <div className="text-xs text-white/60 font-mono mt-1">{formatNumber(channel.viewCount)} total views</div>
                 </div>
              </div>

              <div className="glass-card p-10 flex justify-between flex-col gap-2 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp size={64}/></div>
                 <div className="flex items-center gap-2 text-white/60 uppercase text-[10px] font-bold tracking-[0.2em] relative z-10"><Eye size={14}/> Avg. Views (Recent)</div>
                 <div className="relative z-10">
                   <div className="text-3xl font-black text-white">{formatNumber(avgViews.toString())}</div>
                   <div className="text-[10px] text-white/80/80 font-mono mt-1 uppercase tracking-[0.2em]">{formatNumber(channel.videoCount)} total videos</div>
                 </div>
              </div>

              <div className="glass-card p-10 flex justify-between flex-col gap-2 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5"><Activity size={64}/></div>
                 <div className="flex items-center gap-2 text-white/60 uppercase text-[10px] font-bold tracking-[0.2em] relative z-10"><ThumbsUp size={14}/> Eng. Rate (Recent)</div>
                 <div className="relative z-10">
                   <div className="text-3xl font-black text-white">{engRate.toFixed(2)}%</div>
                   <div className="text-[10px] text-white/60 font-mono mt-1 uppercase tracking-[0.2em]">Likes / Comments</div>
                 </div>
              </div>

              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121008] rounded-sm p-10 border border-white/30 flex flex-col justify-between gap-2 relative overflow-hidden shadow-[0_4px_24px_rgba(255,255,255,0.15)] text-zinc-100">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={64}/></div>
                 <div className="flex items-center gap-2 uppercase text-[10px] font-bold tracking-[0.2em] relative z-10 opacity-80">Algorithmic Est. Value</div>
                 <div className="relative z-10">
                   <div className="text-3xl font-black">${estSponsorshipVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                   <p className="text-[10px] text-zinc-100/50 mt-1 leading-tight font-mono tracking-[0.2em]">${algorithmicRevenueRating} / $20 CPM base</p>
                 </div>
              </div>
            </div>

            {loadingAudit && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mt-8 animate-pulse fade-in">
                <div className="lg:col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  </div>
                  <div className="h-6 w-48 bg-white/10 rounded"></div>
                  <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent ml-4"></div>
                </div>

                <div className="bg-[#0f0f0f] border border-white/[0.04] p-5 h-24 rounded flex flex-col justify-center">
                   <div className="h-4 bg-white/10 w-1/2 mb-2 rounded"></div>
                   <div className="h-4 bg-white/5 w-3/4 rounded"></div>
                </div>
                
                <div className="bg-[#0f0f0f] border border-white/[0.04] p-5 h-24 rounded flex flex-col justify-center">
                   <div className="h-4 bg-white/10 w-1/2 mb-2 rounded"></div>
                   <div className="h-4 bg-white/5 w-3/4 rounded"></div>
                </div>

                <div className="bg-[#0f0f0f] border border-white/[0.04] p-8 h-[300px] rounded flex flex-col lg:col-span-2">
                   <div className="h-4 bg-white/10 w-1/3 mb-4 rounded"></div>
                   <div className="flex-1 space-y-3">
                     <div className="h-4 bg-white/5 w-full rounded"></div>
                     <div className="h-4 bg-white/5 w-5/6 rounded"></div>
                     <div className="h-4 bg-white/5 w-4/5 rounded"></div>
                     <div className="h-4 bg-white/5 w-full rounded"></div>
                   </div>
                </div>
              </div>
            )}

            {audit && !loadingAudit && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="lg:col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/30 flex items-center justify-center">
                     <BrainCircuit size={16} className="text-zinc-100" />
                  </div>
                  <h3 className="text-xl font-body tracking-tight font-bold text-white">AI Deep Dossier</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent ml-4"></div>
                </div>

                <div className="glass-card p-5 flex flex-col gap-3 relative overflow-hidden group">
                  <div className="flex items-center gap-2 text-white/60 uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><Target size={14} className="text-zinc-100" /> Archetype</div>
                  <p className="text-white font-medium text-sm leading-relaxed">{audit.contentArchetype}</p>
                </div>
                
                <div className="glass-card p-5 flex flex-col gap-3 relative overflow-hidden group">
                  <div className="flex items-center gap-2 text-white/60 uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><UserCheck size={14} className="text-zinc-100" /> Target Proxy</div>
                  <p className="text-white font-medium text-sm leading-relaxed">{audit.targetAudience}</p>
                </div>

                                <div className="bg-[#000000] rounded-2xl border border-white/20 flex flex-col overflow-hidden lg:col-span-2 shadow-[0_4px_24px_rgba(255,255,255,0.15)] shadow-white/5">
                  <div className="bg-white/10 px-5 py-4 border-b border-white/20 flex items-center gap-2">
                     <ShieldAlert size={16} className="text-zinc-100" />
                     <h4 className="text-zinc-100 uppercase text-xs font-bold tracking-[0.2em]">Editing Weaknesses Detected</h4>
                  </div>
                  <div className="p-5 flex-1 bg-gradient-to-b from-[#1a1a1a] to-black">
                     <div className="space-y-3">
                       {audit.weaknesses?.map((w: string, i: number) => (
                         <div key={i} className="flex gap-4 p-3 rounded-2xl bg-[#000000] border border-white/[0.04]/80 hover:border-white/[0.06] transition-colors">
                           <div className="w-6 h-6 rounded-full bg-[#FF3B30]/10 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[#FF3B30] text-xs font-bold">{i + 1}</span>
                           </div>
                           <p className="text-white/80 text-sm leading-relaxed">{w}</p>
                         </div>
                       ))}
                     </div>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] rounded-2xl border border-white/20 flex flex-col overflow-hidden lg:col-span-2 shadow-[0_4px_24px_rgba(255,255,255,0.15)] shadow-[0_4px_24px_rgba(255,255,255,0.15)]/5">
                  <div className="bg-white/10 px-5 py-4 border-b border-white/20 flex items-center gap-2">
                     <Zap size={16} className="text-white/80" />
                     <h4 className="text-white/80 uppercase text-xs font-bold tracking-[0.2em]">Hyper-Personalized Pitch Angle</h4>
                  </div>
                  <div className="p-5 flex-1 relative group bg-gradient-to-b from-[#0a0a0a] to-black">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-white/80 group-hover:opacity-10 transition-opacity">
                       <MessageSquare size={100} />
                    </div>
                    <div className="relative z-10 text-white/80 text-sm font-light leading-relaxed whitespace-pre-wrap bg-[#007AFF]/10 p-4 rounded-2xl border border-white/20">
                       {audit.pitchAngle}
                    </div>
                  </div>
                </div>

                <div className="bg-[#000000] p-5 rounded-2xl border border-[#FF3B30]/30 shadow-[0_4px_30px_rgba(255,59,48,0.1)] flex flex-col gap-3 relative overflow-hidden group lg:col-span-1">
                  <div className="flex items-center gap-2 text-[#FF3B30] uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><DollarSign size={14} /> Estimated Missed Revenue</div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black tracking-tighter text-[#FF3B30]">{audit.estimatedMissedRevenue}</span>
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest pb-1">/ month</span>
                  </div>
                  <p className="text-xs text-[#FF3B30]/70 mt-2 font-mono">Lost directly to poor video retention & low CTR.</p>
                </div>

                <div className="bg-[#000000] p-5 rounded-2xl border border-white/20 flex flex-col gap-3 lg:col-span-1 shadow-[0_4px_24px_rgba(255,255,255,0.15)] shadow-white/5">
                  <div className="flex items-center gap-2 text-[var(--brand-primary)] uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><Activity size={14} /> Hook Analysis (First 10s)</div>
                  <div className="space-y-3 mt-1">
                    {audit.hookAnalysis?.map((hook: string, i: number) => (
                       <div key={i} className="bg-white/5 p-3 rounded text-sm text-white/80 border border-white/10 leading-relaxed font-mono">
                         {hook}
                       </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/20 flex flex-col gap-3 lg:col-span-2 shadow-[0_4px_24px_rgba(255,255,255,0.15)] shadow-white/5">
                  <div className="flex items-center gap-2 text-white/80 uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><ShieldAlert size={14} className="text-[#FF9500]" /> Brutal Editing Teardown</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                    {audit.editingStyleTearDown?.map((critique: string, i: number) => (
                       <div key={i} className="bg-[#000000] p-4 rounded text-sm text-white/90 border border-white/10 leading-relaxed font-mono flex items-start gap-3">
                         <div className="w-5 h-5 rounded-full bg-[#FF9500]/20 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[#FF9500] text-[10px] font-bold">{i + 1}</span>
                         </div>
                         <div className="flex-1">{critique}</div>
                       </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#000000] p-5 rounded-sm border border-white/20 flex flex-col gap-3 relative overflow-hidden group lg:col-span-2">
                  <div className="flex items-center gap-2 text-[#007AFF] uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><Users size={14} /> Competitor Bleed</div>
                  <p className="text-zinc-400 text-xs font-mono mb-2">They are actively losing views and sponsorships to:</p>
                  <div className="space-y-3">
                    {audit.competitorAnalysis?.map((competitor: string, i: number) => (
                       <div key={i} className="bg-white/5 p-4 rounded text-sm text-white/80 border border-[#007AFF]/20 leading-relaxed font-mono">
                         {competitor}
                       </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#000000] to-[#111111] p-5 rounded-2xl border border-[#00C7BE]/30 flex flex-col gap-3 lg:col-span-2 shadow-[0_8px_32px_rgba(0,199,190,0.1)]">
                  <div className="flex items-center gap-2 text-[#00C7BE] uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><Target size={14} /> The Strategic Pivot</div>
                  <p className="text-white/90 text-sm leading-relaxed font-semibold italic border-l-2 border-[#00C7BE] pl-4">
                    "{audit.contentStrategyShift}"
                  </p>
                </div>


                {audit.coldEmailDraft && (
                <div className="bg-[#111111] overflow-hidden rounded-2xl flex flex-col border border-white/10 lg:col-span-2 shadow-2xl shadow-black/50">
                  <div className="p-5 border-b border-white/5 bg-[#1a1a1a] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-white" />
                      <h4 className="text-sm font-bold text-white tracking-widest uppercase">Auto-Drafted Cold Email</h4>
                    </div>
                  </div>
                  <div className="p-5 flex-1 relative group bg-gradient-to-b from-[#0a0a0a] to-black">
                    <div className="relative z-10 text-white/80 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                       {audit.coldEmailDraft}
                    </div>
                  </div>
                </div>
                )}

                <div className="bg-[#000000] p-5 rounded-sm border border-white/20 flex flex-col gap-3 relative overflow-hidden group lg:col-span-2">
                  <div className="flex items-center gap-2 text-white/80 uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><DollarSign size={14} /> Potential Sponsor Leads</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {audit.sponsorshipClues?.map((sponsor: string, i: number) => (
                       <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/20 text-white/80 rounded-sm text-xs font-mono">{sponsor}</span>
                    ))}
                    {(!audit.sponsorshipClues || audit.sponsorshipClues.length === 0) && (
                       <span className="text-zinc-600 text-sm italic">No obvious sponsors detected in recent titles.</span>
                    )}
                  </div>
                </div>

                {/* --- NEW DEEP SCAN MODULES --- */}

                <div className="bg-[#000000] p-5 rounded-2xl border border-[var(--brand-primary)]/40 flex flex-col gap-3 lg:col-span-2 shadow-[0_4px_24px_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-2 text-[var(--brand-primary)] uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><MapPin size={14} /> 30-Day Action Plan (First Month)</div>
                  <div className="space-y-3 mt-1">
                    {audit.actionPlan30Days?.map((step: string, i: number) => (
                       <div key={i} className="bg-white/5 p-4 rounded text-sm text-white/80 border border-white/10 leading-relaxed font-mono flex items-start gap-3">
                         <div className="w-5 h-5 rounded bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{i+1}</div>
                         <div className="flex-1">{step}</div>
                       </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-[#AF52DE]/30 flex flex-col gap-3 lg:col-span-2 shadow-[0_4px_24px_rgba(175,82,222,0.1)]">
                  <div className="flex items-center gap-2 text-[#AF52DE] uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><BrainCircuit size={14} /> Storytelling & Pacing Breakdown</div>
                  <div className="space-y-2 mt-1">
                    {audit.storytellingBreakdown?.map((item: string, i: number) => (
                       <div key={i} className="text-sm text-white/80 border-b border-white/5 pb-2 last:border-0 last:pb-0 font-mono leading-relaxed flex items-start gap-2">
                         <span className="text-[#AF52DE] font-bold shrink-0 mt-1">»</span> {item}
                       </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#000000] p-5 rounded-2xl border border-[#FF9500]/30 flex flex-col gap-3 lg:col-span-1 shadow-[0_4px_24px_rgba(255,149,0,0.1)] relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><UserCheck size={100} className="text-[#FF9500]" /></div>
                  <div className="flex items-center gap-2 text-[#FF9500] uppercase text-[10px] font-bold tracking-[0.2em] mb-1 relative z-10"><UserCheck size={14} /> Creator Psychology</div>
                  <p className="text-white/80 text-sm leading-relaxed font-mono relative z-10">{audit.creatorPsychology}</p>
                </div>

                <div className="bg-[#0f0f0f] p-5 rounded-2xl border border-[#FF2D55]/30 flex flex-col gap-3 lg:col-span-1 shadow-[0_4px_24px_rgba(255,45,85,0.1)] relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><ShieldAlert size={100} className="text-[#FF2D55]" /></div>
                  <div className="flex items-center gap-2 text-[#FF2D55] uppercase text-[10px] font-bold tracking-[0.2em] mb-1 relative z-10"><ShieldAlert size={14} /> The #1 Objection</div>
                  <p className="text-white/80 text-sm leading-relaxed font-mono relative z-10">{audit.objectionHandling}</p>
                </div>

                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#000000] p-5 rounded-2xl border border-[#34C759]/30 flex flex-col gap-3 lg:col-span-2 shadow-[0_4px_24px_rgba(52,199,89,0.1)] relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-5 transition-opacity"><Target size={120} className="text-[#34C759]" /></div>
                  <div className="flex items-center gap-2 text-[#34C759] uppercase text-[10px] font-bold tracking-[0.2em] mb-1 relative z-10"><DollarSign size={14} /> Optimal Pricing Strategy</div>
                  <p className="text-white/90 text-sm leading-relaxed font-mono font-bold bg-[#34C759]/10 p-4 border border-[#34C759]/20 rounded-xl relative z-10">{audit.pricingStrategy}</p>
                </div>

                {/* --- END NEW DEEP SCAN MODULES --- */}

                <div className="bg-[#000000] p-5 rounded-2xl border border-white/20 flex flex-col gap-3 lg:col-span-2 shadow-[0_4px_24px_rgba(255,255,255,0.15)] shadow-white/5">
                  <div className="flex items-center gap-2 text-[#FF3B30] uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><Scissors size={14} /> Retention Leaks</div>
                  <div className="space-y-3 mt-1">
                    {audit.retentionLeaks?.map((leak: string, i: number) => (
                       <div key={i} className="bg-white/5 p-3 rounded text-sm text-white/80 border border-white/10 leading-relaxed font-mono">
                         {leak}
                       </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/20 flex flex-col gap-3 lg:col-span-2 shadow-[0_4px_24px_rgba(255,255,255,0.15)] shadow-white/5">
                  <div className="flex items-center gap-2 text-[var(--brand-primary)] uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><ListVideo size={14} /> Thumbnail & Title Suggestions</div>
                  <div className="space-y-3 mt-1">
                    {audit.thumbnailTitleSuggestions?.map((suggestion: string, i: number) => (
                       <div key={i} className="bg-[#000000] p-3 rounded text-sm text-white/80 border border-white/10 leading-relaxed flex items-start gap-3">
                         <div className="shrink-0 w-5 h-5 rounded-full bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] flex items-center justify-center text-xs font-bold mt-0.5">{i+1}</div>
                         <div className="flex-1 font-mono">{suggestion}</div>
                       </div>
                    ))}
                  </div>
                </div>

                 <div className="bg-[#111111] p-5 rounded-2xl border border-white/20 flex flex-col gap-3 lg:col-span-2 shadow-[0_4px_24px_rgba(255,255,255,0.15)] shadow-white/5">
                  <div className="flex items-center gap-2 text-green-400 uppercase text-[10px] font-bold tracking-[0.2em] mb-1"><Target size={14} /> Monetization Gaps</div>
                  <div className="space-y-3 mt-1">
                    {audit.monetizationGaps?.map((gap: string, i: number) => (
                       <div key={i} className="bg-white/5 p-3 rounded text-sm text-white/80 border border-white/10 leading-relaxed font-mono flex items-start gap-2">
                         <span className="text-green-400 font-bold shrink-0">→</span> {gap}
                       </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-tl from-[#0f0f0f] to-[#1a1a1a] p-5 rounded-2xl border border-white/20 flex flex-col gap-3 lg:col-span-2 shadow-[0_4px_24px_rgba(255,255,255,0.15)] shadow-[var(--brand-primary)]/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-white/80"><Sparkles size={100} /></div>
                  <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-1 relative z-10"><Sparkles size={14} className="text-[var(--brand-primary)]" /> 3 Pillar Video Ideas</div>
                  <div className="space-y-3 mt-1 relative z-10">
                    {audit.threeVideoIdeas?.map((idea: string, i: number) => (
                       <div key={i} className="bg-[#000000]/60 backdrop-blur p-4 rounded text-sm text-white/90 border border-white/10 leading-relaxed font-mono hover:border-white/30 transition-colors">
                         {idea}
                       </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Chart */}
              <div className="lg:col-span-2 glass-card p-10 h-[400px] flex flex-col">
                <h3 className="text-lg font-bold text-white font-body tracking-tight mb-4">Recent Upload Performance</h3>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff30" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#ffffff30" fontSize={12} tickFormatter={(val) => formatNumber(val.toString())} axisLine={false} tickLine={false} width={50} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#222', borderRadius: '4px', color: '#fff' }}
                        itemStyle={{ color: 'white', fontWeight: 'bold' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        formatter={(value: any, name: any) => [formatNumber(value.toString()), name === 'views' ? 'Views' : 'Likes']}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.title || label}
                      />
                      <Bar dataKey="views" fill="white" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Video List */}
              <div className="lg:col-span-1 bg-[#000000] rounded-sm p-4 border border-white/[0.04] flex flex-col overflow-hidden h-[400px]">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/60 mb-4 px-2">Latest Content</h3>
                <div className="flex-1 overflow-y-auto px-2 space-y-4 custom-scrollbar">
                  {videos.map(video => (
                    <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" key={video.id} className="flex gap-4 p-2 border border-transparent rounded-sm hover:border-white/[0.04] hover:bg-white/5 transition-colors group">
                      <div className="w-24 h-14 rounded-sm bg-[#000000] shrink-0 overflow-hidden relative">
                         <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                         <div className="absolute inset-x-0 bottom-0 top-0 bg-[#000000]/20 group-hover:bg-transparent transition-colors"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-[11px] font-bold text-white line-clamp-2 leading-snug group-hover:text-white transition-colors">{video.title}</h4>
                         <div className="flex items-center gap-3 mt-1.5 text-[9px] items-center text-white/60 font-medium">
                            <span className="flex items-center gap-1"><Eye size={10} className="text-white/60" /> {formatNumber(video.viewCount)}</span>
                            <span className="flex items-center gap-1"><ThumbsUp size={10} className="text-zinc-100" /> {formatNumber(video.likeCount)}</span>
                            <span className="flex items-center gap-1"><MessageSquare size={10} className="text-zinc-600" /> {formatNumber(video.commentCount)}</span>
                         </div>
                         <p className="text-[9px] text-zinc-600 mt-1 uppercase tracking-widest">{formatDistanceToNow(parseISO(video.publishedAt))} ago</p>
                      </div>
                    </a>
                  ))}
                  {videos.length === 0 && <p className="text-sm text-zinc-600 mt-4 px-2">No recent videos found.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {viewMode === 'teardown' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] border border-white/[0.04] rounded-sm p-10 mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-zinc-100"><Video size={120} /></div>
                <h3 className="text-xl font-bold font-body tracking-tight text-white tracking-tight mb-2 relative z-10 flex items-center gap-2">
                   <Video size={18} className="text-zinc-100" /> Deep-Dive Teardown Audit
                </h3>
                <p className="text-sm text-white/60 mb-6 relative z-10 max-w-2xl">Generate a timestamped retention teardown report for any YouTube video to attach to your cold emails. Prove instant, undeniable expertise.</p>
                
                <form onSubmit={runTeardown} className="relative z-10 flex gap-4 max-w-xl">
                   <div className="relative flex-1 group">
                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-zinc-100 transition-colors" />
                     <input 
                       value={teardownUrl}
                       onChange={e => setTeardownUrl(e.target.value)}
                       placeholder="Paste YouTube Video URL (e.g. https://youtu.be/...)"
                       className="w-full bg-[#0a0a0a] border border-white/[0.04] text-white pl-10 pr-4 py-3 rounded-sm text-sm focus:outline-none focus:border-white/20 transition-colors font-mono"
                     />
                   </div>
                   <button 
                     type="submit"
                     disabled={teardownLoading || !teardownUrl}
                     className="bg-[var(--brand-primary)] text-white font-bold uppercase tracking-[0.2em] text-xs px-6 py-3 rounded-sm hover:bg-zinc-200 text-black transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                   >
                     {teardownLoading ? <><div className="w-3 h-3 border-2 border-white/[0.02]0 border-t-white rounded-full animate-spin"></div> Running...</> : <><Scissors size={14} /> Analyze</>}
                   </button>
                </form>
             </div>

             {teardownLoading && (
               <div className="flex justify-center flex-col items-center py-20">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-[var(--brand-primary)] rounded-full animate-spin mb-4"></div>
                  <p className="text-zinc-100 font-bold tracking-[0.2em] text-sm animate-pulse">Running AI Retention Analysis...</p>
               </div>
             )}

             {teardownReport && !teardownLoading && (
                <div className="glass-card p-10 relative">
                   <div className="flex justify-between items-center mb-8 border-b border-white/[0.02] pb-4">
                     <h3 className="font-body tracking-tight text-2xl font-bold text-white flex items-center gap-3">
                       <Target className="text-zinc-100" /> Retention Teardown Report
                     </h3>
                     <button onClick={() => window.print()} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors border border-white/[0.04]">
                        <FileDown size={14} /> Export PDF
                     </button>
                   </div>
                   <div className="prose prose-invert prose-p:text-white/60 prose-headings:text-white prose-a:text-white/80 prose-li:text-white/80 max-w-none">
                      <ReactMarkdown>{teardownReport}</ReactMarkdown>
                   </div>
                </div>
             )}
          </div>
        )}

        {viewMode === 'ideas' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] border border-white/[0.04] rounded-sm p-10 mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-zinc-100"><TrendingUp size={120} /></div>
                <h3 className="text-xl font-bold font-body tracking-tight text-white mb-2 relative z-10 flex items-center gap-2">
                   <Target size={18} className="text-zinc-100" /> Topic & Format Ideation
                </h3>
                <p className="text-sm text-white/60 mb-6 relative z-10 max-w-2xl">Discover what videos are organically going viral in the last 30 days. Reverse-engineer their thumbnails, titles, and pacing to supply trending formats to your clients.</p>
                
                <form onSubmit={(e) => handleTrendingSearch(e)} className="relative z-10 flex gap-4 max-w-xl">
                   <div className="relative flex-1 group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-zinc-100" size={16} />
                     <input 
                       value={trendingQuery}
                       onChange={(e) => setTrendingQuery(e.target.value)}
                       placeholder="E.g., After Effects Tutorial, Real Estate Vlogs..."
                       className="w-full bg-[#0f0f0f] border border-white/[0.06] rounded-sm py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
                     />
                   </div>
                   <button type="submit" disabled={trendingLoading || !trendingQuery} className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:active:scale-100 font-bold px-6 py-3 rounded-sm tracking-[0.2em] uppercase text-[10px] transition-all active:scale-95 whitespace-nowrap shadow-[0_4px_15px_rgba(255,255,255,0.15)] flex items-center gap-2">
                      {trendingLoading ? <><div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> Scanning</> : <><Search size={14} /> Search Trends</>}
                   </button>
                </form>

                <div className="mt-8 relative z-10">
                   <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/40 mb-3">One-Click Industry Scans</p>
                   <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Video Editing', query: 'Video Editing Tutorial', icon: '✂️' },
                        { label: 'CapCut / TikTok', query: 'CapCut Viral', icon: '📱' },
                        { label: 'Finance / Wealth', query: 'Make Money Online 2026', icon: '💰' },
                        { label: 'Tech & Code', query: 'React JS Project', icon: '💻' },
                        { label: 'Storytelling Doc', query: 'Video Essay', icon: '📚' },
                        { label: 'Vlog Style', query: 'Day in the life vlog', icon: '🎥' },
                        { label: 'Faceless Cashcow', query: 'Faceless channel', icon: '👻' },
                        { label: 'High Retention', query: 'MrBeast Challenges', icon: '🔥' }
                      ].map(item => (
                         <button 
                           key={item.label} 
                           onClick={() => handleTrendingSearch(undefined, item.query)} 
                           className="px-4 py-2 text-[11px] font-bold tracking-wide flex items-center gap-2 bg-[#000000] hover:bg-[#1a1a1a] text-white/80 hover:text-white border border-white/[0.04] hover:border-white/20 rounded-sm transition-all"
                         >
                            <span>{item.icon}</span> {item.label}
                         </button>
                      ))}
                   </div>
                </div>
             </div>

             {trendingLoading && (
                <div className="flex justify-center flex-col items-center py-24 bg-[#0a0a0a] rounded-sm border border-white/[0.02]">
                   <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mb-6"></div>
                   <p className="text-white font-bold tracking-[0.2em] text-sm animate-pulse uppercase">Hunting Viral Formats...</p>
                </div>
             )}

             {!trendingLoading && trendingVideos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {trendingVideos.map(video => (
                      <div key={video.id} className="glass-card overflow-hidden flex flex-col group transition-all relative p-0 hover:shadow-[0_8px_32px_rgba(52,199,89,0.1)]">
                         <div className="absolute top-2 right-2 bg-[#000000]/80 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-white/[0.04] text-zinc-100 text-[10px] font-mono font-bold z-10 flex items-center gap-1.5 shadow-xl">
                            <Eye size={12} className="text-[#34C759]"/> {formatNumber(video.viewCount)}
                         </div>
                         <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" className="w-full aspect-video bg-[#000000] relative overflow-hidden block">
                            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-[#000000]/20 group-hover:bg-transparent transition-colors"></div>
                         </a>
                         <div className="p-5 flex flex-col flex-1 bg-gradient-to-b from-[#111111] to-[#0a0a0a]">
                            <h4 className="text-white font-bold text-[13px] line-clamp-2 leading-relaxed mb-3 group-hover:text-[#34C759] transition-colors">{video.title}</h4>
                            <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-[0.2em] font-mono mb-5 border-b border-white/[0.02] pb-4">
                               <ListVideo size={12} /> {video.channelTitle}
                            </div>
                            
                            <button onClick={() => generateHookAndScript(video)} className="w-full mb-2 bg-[#1a1a1a] hover:bg-[#34C759] text-white py-2.5 rounded-sm text-[10px] uppercase tracking-[0.2em] font-bold border border-white/[0.04] transition-all flex items-center justify-center gap-2 group/btn">
                               <BrainCircuit size={14} className="group-hover/btn:animate-pulse" /> Decode & Clone
                            </button>
                            <button onClick={() => { setSelectedTrendVideo(video); setShowTargetModal(true); }} className="w-full mb-5 bg-[#1a1a1a] hover:bg-white text-zinc-400 hover:text-black py-2.5 rounded-sm text-[10px] uppercase tracking-[0.2em] font-bold border border-white/[0.04] transition-all flex items-center justify-center gap-2 group/btn">
                               <Target size={14} /> Target Prospect
                            </button>
                            
                            <div className="mt-auto grid grid-cols-3 gap-2 pt-2">
                               <div className="flex flex-col items-center bg-[#000000] rounded p-2 border border-white/[0.02]">
                                  <span className="text-white/40 text-[8px] uppercase tracking-[0.2em] font-bold mb-1">Uploaded</span>
                                  <span className="text-white/80 text-[10px] font-mono">{formatDistanceToNow(parseISO(video.publishedAt), { addSuffix: false }).replace('about ', '')}</span>
                               </div>
                               <div className="flex flex-col items-center bg-[#000000] rounded p-2 border border-white/[0.02]">
                                  <span className="text-white/40 text-[8px] uppercase tracking-[0.2em] font-bold mb-1">Likes</span>
                                  <span className="text-white/80 text-[10px] font-mono">{formatNumber(video.likeCount)}</span>
                               </div>
                               <div className="flex flex-col items-center bg-[#000000] rounded p-2 border border-white/[0.02]">
                                  <span className="text-white/40 text-[8px] uppercase tracking-[0.2em] font-bold mb-1">Comments</span>
                                  <span className="text-white/80 text-[10px] font-mono">{formatNumber(video.commentCount)}</span>
                               </div>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {(generatingScript || generatedScript) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0f0f] w-full max-w-4xl rounded-sm shadow-2xl border border-white/[0.04] flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/[0.04] bg-[#000000]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-[var(--brand-primary)]/10 flex items-center justify-center border border-[var(--brand-primary)]/20">
                    <Sparkles size={18} className="text-[var(--brand-primary)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg font-body tracking-tight">AI Ideation Hub</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/60">Script & Hook Generator</p>
                  </div>
                </div>
                <button onClick={() => { setGeneratingScript(false); setGeneratedScript(null); }} className="text-white/60 hover:text-white p-2 bg-white/5 rounded-sm transition-colors border border-white/[0.04]">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
                 {generatingScript ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                       <BrainCircuit size={48} className="text-white/20 animate-pulse" />
                       <div className="text-sm font-bold uppercase tracking-[0.2em] text-white">Reverse Engineering Trend...</div>
                       <p className="text-xs text-white/60 font-mono">Writing hook, generating A/B titles, and planning editing cues based on "{selectedTrendVideo?.title}"</p>
                    </div>
                 ) : (
                    <div className="max-w-none">
                       {selectedTrendVideo && (
                         <div className="mb-6 p-4 bg-white/5 border border-white/[0.04] rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                               <img src={selectedTrendVideo.thumbnailUrl} alt="Thumb" className="w-24 h-14 object-cover rounded-sm" />
                               <div>
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-mono font-bold mb-1">Source Inspiration</p>
                                  <p className="text-sm text-white font-bold">{selectedTrendVideo.title}</p>
                               </div>
                            </div>
                            <button onClick={() => toast.success("Idea saved to CRM Pipeline.")} className="px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-sm text-[10px] uppercase tracking-widest font-bold shadow-[0_4px_15px_rgba(99,102,241,0.2)] flex items-center gap-2 transition-all">
                               <Sparkles size={14} className="text-indigo-200" /> Save Concept
                            </button>
                         </div>
                       )}
                       <div className="prose prose-invert prose-p:text-white/60 prose-headings:text-white prose-a:text-white/80 prose-li:text-white/80 max-w-none font-body text-base leading-relaxed p-6 bg-[#000000] rounded-sm border border-white/[0.04]">
                          <ReactMarkdown>{generatedScript || ''}</ReactMarkdown>
                       </div>
                    </div>
                 )}
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {showTargetModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0f0f] w-full max-w-lg rounded-sm shadow-2xl border border-white/[0.04] p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white text-lg font-body tracking-tight">Target Prospect</h3>
                <button onClick={() => setShowTargetModal(false)} className="text-white/60 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                <label className="text-white/80 text-sm font-semibold">Select Lead from CRM Pipeline</label>
                <select 
                  value={targetLeadId}
                  onChange={(e) => setTargetLeadId(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-sm py-3 px-4 text-white text-sm focus:outline-none focus:border-white/30"
                >
                  <option value="">-- Choose a Prospect --</option>
                  {analyticsLeads.map(l => (
                     <option key={l.id} value={l.id}>{l.brandName} - {l.niche}</option>
                  ))}
                </select>

                <div className="mt-4 flex gap-3">
                  <button onClick={() => setShowTargetModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-sm transition-colors text-xs uppercase tracking-[0.1em]">Cancel</button>
                  <button 
                     onClick={generateTargetedProspectScript} 
                     disabled={!targetLeadId} 
                     className="flex-1 bg-[var(--brand-primary)] hover:opacity-90 disabled:opacity-50 text-black font-bold py-3 rounded-sm transition-opacity text-xs uppercase tracking-[0.1em]"
                  >
                     Target & Generate
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
