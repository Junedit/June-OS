import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Mail, CheckCircle, Clock, Square, Eye, MousePointerClick, Send, Sparkles, Copy, Loader2, Plus, X, Save } from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getAI, generateContentWithRetry } from '../services/ai';
import { toast } from 'sonner';

export default function Outreach() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [targetIndustry, setTargetIndustry] = useState('');
  const [targetName, setTargetName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');

  // Sequence state
  const [sequences, setSequences] = useState<any[]>([]);
  const [isSequenceModalOpen, setIsSequenceModalOpen] = useState(false);
  const [sequenceName, setSequenceName] = useState('');
  const [sequenceSteps, setSequenceSteps] = useState([{ day: 1, subject: '', body: '' }]);
  const [generatingSequence, setGeneratingSequence] = useState(false);

  useEffect(() => {
    if (!user) return;
    const qLeads = query(collection(db, 'leads'), where('ownerId', '==', user.uid));
    const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(results);
    });

    const qSeq = query(collection(db, 'sequences'), where('ownerId', '==', user.uid));
    const unsubscribeSeq = onSnapshot(qSeq, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSequences(results);
    });

    return () => { unsubscribeLeads(); unsubscribeSeq(); };
  }, [user]);

  const handleCreateSequence = async () => {
    if (!user) return;
    if (!sequenceName.trim()) { toast.error('Name required'); return; }
    try {
       await addDoc(collection(db, 'sequences'), {
         name: sequenceName,
         steps: sequenceSteps,
         activeLeadsCount: 0,
         ownerId: user.uid,
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp()
       });
       toast.success("Sequence created.");
       setIsSequenceModalOpen(false);
       setSequenceName('');
       setSequenceSteps([{ day: 1, subject: '', body: '' }]);
    } catch(e) {
       console.error(e);
       toast.error("Failed to create sequence");
    }
  };

  const handleAIGenerateSequence = async () => {
    setGeneratingSequence(true);
    try {
      const ai = getAI();
      if(!ai) throw new Error("AI off");
      const res = await generateContentWithRetry(ai, {
        model: "gemini-3.1-pro-preview",
        contents: "You are an expert cold email prospector. Generate a 3-step drip campaign sequence focused on video editing and content scaling for YouTubers/brands. Step 1 happens Day 1, Step 2 on Day 4, Step 3 (breakup) on Day 7. Output MUST be valid JSON (no markdown): [{\"day\":1,\"subject\":\"...\",\"body\":\"...\"},{\"day\":4,\"subject\":\"...\",\"body\":\"...\"},{\"day\":7,\"subject\":\"...\",\"body\":\"...\"}]"
      });
      let textResponse = res.text().trim();
      if (textResponse.startsWith('```json')) textResponse = textResponse.replace(/```json\n?/, '').replace(/```$/, '');
      const parsed = JSON.parse(textResponse);
      setSequenceSteps(parsed);
      toast.success("AI Sequence Generated! Review and save.");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch(e) {
      toast.error("AI Generation failed.");
    } finally {
      setGeneratingSequence(false);
    }
  };

  const handleGenerateEmail = async () => {
    if (!targetIndustry || !targetName) {
      toast.error("Please provide both industry and name");
      return;
    }
    
    setGenerating(true);
    try {
      const ai = getAI();
      if (!ai) throw new Error("AI Client not initialized");

      const targetUrlInput = document.getElementById('targetUrl') as HTMLInputElement;
      const targetUrl = targetUrlInput ? targetUrlInput.value : '';

      const prompt = `You are a top-tier B2B salesperson specializing in cold outreach for a video editing agency. Write a highly personalized, compelling, and short cold email (under 150 words) targeting a prospect named ${targetName} who works in the ${targetIndustry} industry. 
      ${targetUrl ? `The prospect's channel/website is: ${targetUrl}. Scrape and infer their recent content strategy based on typical channels in that niche with that URL, and mention something deeply specific about their recent content "vibe" as an icebreaker.` : ''}
      The email should focus on driving value, identifying typical bottlenecks in their industry, and asking for a quick 5-minute chat. Do not include subject lines, just the body. Keep it casual but professional.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      setGeneratedEmail(response.text || '');
      toast.success("AI Outreach Generated!");
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to generate outreach");
    } finally {
      setGenerating(false);
    }
  };

  const hasEmail = (l: any) => l.contactEmail && l.contactEmail.length > 0;
  
  // Dummy analytics metrics
  const totalSent = leads.filter(hasEmail).length;
  const opened = Math.floor(totalSent * 0.45);
  const clicked = Math.floor(opened * 0.3);
  const replied = Math.floor(opened * 0.15);

  const data = totalSent > 0 ? [
    { name: 'Opened', value: opened, color: '#007AFF' },
    { name: 'Unopened', value: totalSent - opened, color: '#3f3f46' }
  ] : [
    { name: 'Unopened', value: 1, color: '#3f3f46' }
  ];

  return (
    <div className="flex-1 flex flex-col relative w-full bg-transparent min-h-screen">
      <header className="bg-transparent/40 backdrop-blur-[40px] saturate-[1.8] border-b border-white/[0.02] top-0 sticky z-40 flex justify-between items-center w-full px-8 py-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-white/[0.02] flex items-center justify-center border border-white/[0.02] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Mail className="text-zinc-100 relative z-10" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-body tracking-tight font-bold text-white tracking-tight">Outreach Engine</h2>
            <p className="text-[10px] text-white/60 font-mono tracking-[0.2em] uppercase mt-0.5">Campaigns & Analytics</p>
          </div>
        </div>
      </header>

      <div className="p-10 md:p-10 space-y-8 max-w-[1600px] mx-auto w-full mb-32 z-10 relative">
        <div className="glass-panel border-white/[0.02] rounded-[24px] p-10 lg:p-10 flex flex-col lg:flex-row gap-10 shadow-[0_4px_24px_rgba(255,255,255,0.15)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl pointer-events-none z-0"></div>
          
          <div className="lg:w-1/3 flex flex-col gap-5 z-10">
             <div>
               <div className="flex items-center gap-2 text-zinc-100 mb-2">
                 <Sparkles size={16} />
                 <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold">AI Icebreaker Engine</span>
               </div>
               <h3 className="text-xl text-white font-body tracking-tight tracking-[0.02em]">Draft hyper-personalized emails instantly.</h3>
               <p className="text-xs text-white/60 mt-2">Enter the prospect's details and URL to generate a deeply researched, converting email.</p>
             </div>
             
             <div className="flex flex-col gap-4 mt-2">
               <div>
                  <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-2 block">Target Prospect Name</label>
                  <input type="text" value={targetName} onChange={e => setTargetName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-[#000000]/50 border border-white/[0.04] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/[0.02]0 transition-colors" />
               </div>
               <div>
                  <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-2 block">Target Industry / Niche</label>
                  <input type="text" value={targetIndustry} onChange={e => setTargetIndustry(e.target.value)} placeholder="e.g. B2B SaaS, E-Commerce..." className="w-full bg-[#000000]/50 border border-white/[0.04] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/[0.02]0 transition-colors" />
               </div>
               <div>
                  <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-2 block">YouTube Channel / Website URL (Optional)</label>
                  <input type="text" id="targetUrl" placeholder="https://youtube.com/@prospect" className="w-full bg-[#000000]/50 border border-white/[0.04] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/[0.02]0 transition-colors" />
               </div>
               <button onClick={handleGenerateEmail} disabled={generating || !targetName || !targetIndustry} className="linear-button mt-2 py-3 rounded-2xl flex items-center justify-center gap-2 group disabled:opacity-50 transition-all">
                  {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="group-hover:scale-110 transition-transform" />}
                  {generating ? 'Drafting...' : 'Generate Cold Email'}
               </button>
             </div>
          </div>
          
          <div className="lg:w-2/3 flex flex-col z-10 w-full relative">
             <div className="absolute top-2 right-2 flex items-center gap-2">
                {generatedEmail && (
                   <button onClick={() => { navigator.clipboard.writeText(generatedEmail); toast.success('Copied to clipboard'); }} className="bg-white/10 hover:bg-white/20 text-white p-2 text-xs rounded-2xl transition-colors flex items-center gap-2 backdrop-blur-md">
                     <Copy size={12}/> Copy Text
                   </button>
                )}
             </div>
             <textarea 
               value={generatedEmail} 
               onChange={e => setGeneratedEmail(e.target.value)}
               placeholder="Your generated email will appear here..."
               className="w-full h-full min-h-[250px] bg-[#000000]/30 border border-white/[0.02] rounded-2xl p-10 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors resize-none leading-relaxed font-sans"
             />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-8 w-full">
           <div className="glass-panel border-white/[0.02] rounded-[24px] p-10 shadow-[0_4px_24px_rgba(255,255,255,0.15)] relative overflow-hidden group hover:border-white/[0.04] transition-all">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#fff_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity mix-blend-screen"></div>
             <div className="flex justify-between items-center mb-4 text-white/60 relative z-10">
               <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Emails Sent</span>
               <Send size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
             </div>
             <p className="text-4xl text-white font-serif italic tracking-[0.02em] drop-shadow-sm relative z-10">{totalSent}</p>
           </div>
           
           <div className="glass-panel border-blue-500/20 rounded-[24px] p-10 shadow-[0_4px_24px_rgba(255,255,255,0.15)] relative overflow-hidden group hover:border-blue-500/30 transition-all">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#007AFF_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity mix-blend-screen"></div>
             <div className="flex justify-between items-center mb-4 text-blue-400 relative z-10">
               <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Opened</span>
               <Eye size={16} className="text-blue-400 shadow-[0_4px_24px_rgba(255,255,255,0.15)]" />
             </div>
             <p className="text-4xl text-white font-serif italic tracking-[0.02em] drop-shadow-sm relative z-10">{opened}</p>
             <p className="text-[10px] text-[#007AFF] mt-2 font-mono uppercase tracking-[0.2em] bg-[#007AFF]/10 inline-block px-2 py-0.5 rounded shadow-inner relative z-10">{totalSent > 0 ? ((opened/totalSent)*100).toFixed(1) : 0}% Open Rate</p>
           </div>

           <div className="glass-panel border-purple-500/20 rounded-[24px] p-10 shadow-[0_4px_24px_rgba(255,255,255,0.15)] relative overflow-hidden group hover:border-purple-500/30 transition-all">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#a855f7_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity mix-blend-screen"></div>
             <div className="flex justify-between items-center mb-4 text-purple-400 relative z-10">
               <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Clicked</span>
               <MousePointerClick size={16} className="text-purple-400 shadow-[0_4px_24px_rgba(255,255,255,0.15)]" />
             </div>
             <p className="text-4xl text-white font-serif italic tracking-[0.02em] drop-shadow-sm relative z-10">{clicked}</p>
             <p className="text-[10px] text-[#AF52DE] mt-2 font-mono uppercase tracking-[0.2em] bg-[#AF52DE]/10 inline-block px-2 py-0.5 rounded shadow-inner relative z-10">{opened > 0 ? ((clicked/opened)*100).toFixed(1) : 0}% CTR</p>
           </div>

           <div className="glass-panel border-[#34C759]/20 rounded-[24px] p-10 shadow-[0_4px_24px_rgba(255,255,255,0.15)] relative overflow-hidden group hover:border-[#34C759]/30 transition-all">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#34C759_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity mix-blend-screen"></div>
             <div className="flex justify-between items-center mb-4 text-[#34C759] relative z-10">
               <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Replied</span>
               <CheckCircle size={16} className="text-[#34C759] shadow-[0_4px_24px_rgba(255,255,255,0.15)]" />
             </div>
             <p className="text-4xl text-white font-serif italic tracking-[0.02em] drop-shadow-sm relative z-10">{replied}</p>
             <p className="text-[10px] text-[#34C759] mt-2 font-mono uppercase tracking-[0.2em] bg-[#34C759]/10 inline-block px-2 py-0.5 rounded shadow-inner relative z-10">{opened > 0 ? ((replied/opened)*100).toFixed(1) : 0}% Reply Rate</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/[0.02] rounded-2xl p-10 shadow-[0_4px_24px_rgba(255,255,255,0.15)] overflow-hidden flex flex-col">
              <h3 className="text-white font-body tracking-tight text-sm uppercase tracking-[0.2em] mb-6">Recent Campaigns</h3>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                 {leads.filter(hasEmail).map((lead, i) => (
                    <div key={lead.id} className="bg-[#141414] border border-white/[0.04] rounded-sm p-4 flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80">
                             <Mail size={12}/>
                          </div>
                          <div>
                             <p className="text-sm text-zinc-200 font-medium">{lead.brandName}</p>
                             <p className="text-xs text-white/60 font-mono mt-0.5">{lead.contactEmail}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-10">
                           <div className="text-right">
                              <p className="text-[10px] font-mono text-white/60 uppercase tracking-[0.2em] mb-1">Status</p>
                              {i % 3 === 0 ? (
                                  <span className="text-xs text-white/80 flex items-center justify-end gap-1"><Eye size={12}/> Opened</span>
                              ) : i % 5 === 0 ? (
                                  <span className="text-xs text-white/80 flex items-center justify-end gap-1"><MousePointerClick size={12}/> Clicked</span>
                              ) : (
                                  <span className="text-xs text-white/60 flex items-center justify-end gap-1"><Send size={12}/> Sent</span>
                              )}
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-mono text-white/60 uppercase tracking-[0.2em] mb-1">Sequence</p>
                              <span className="text-xs text-white/80 font-mono">Step 1/3</span>
                           </div>
                       </div>
                    </div>
                 ))}
                 {leads.filter(hasEmail).length === 0 && (
                    <div className="text-center py-10 opacity-30 text-[10px] font-mono uppercase tracking-[0.2em]">No sent campaigns. Add emails to prospects.</div>
                 )}
              </div>
           </div>
           
           <div className="bg-[#0a0a0a] border border-white/[0.02] rounded-2xl p-10 shadow-[0_4px_24px_rgba(255,255,255,0.15)] flex flex-col items-center">
              <h3 className="text-white font-body tracking-tight text-sm uppercase tracking-[0.2em] mb-4 w-full text-center">Engagement Ratio</h3>
              <div className="w-full h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} stroke="none" dataKey="value">
                      {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{background: '#111', border: '1px solid #333', borderRadius: '4px'}} itemStyle={{color: '#fff', fontSize: '12px'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                   <span className="text-3xl text-white font-light">{totalSent > 0 ? ((opened/totalSent)*100).toFixed(0) : 0}%</span>
                   <span className="text-[10px] text-white/60 font-mono uppercase tracking-[0.2em]">Open Rate</span>
                </div>
              </div>

              <div className="w-full space-y-4 mt-6">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#007AFF] flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#007AFF]"></div> Opened</span>
                  <span className="text-white">{opened}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/60 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-zinc-600"></div> Unopened</span>
                  <span className="text-white">{totalSent - opened}</span>
                </div>
              </div>
           </div>
        </div>

        {/* Sequences Section */}
        <div className="mt-10">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl text-white font-body tracking-tight tracking-tight">Active Sequences</h3>
              <button 
                onClick={() => setIsSequenceModalOpen(true)}
                className="bg-white/10 hover:bg-[var(--brand-primary)] hover:text-black text-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center gap-2"
              >
                 <Plus size={14}/> Create Sequence
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sequences.length === 0 && (
                 <div className="md:col-span-3 text-center py-10 opacity-60 text-xs font-mono uppercase tracking-[0.2em] border border-white/[0.04] border-dashed rounded-2xl">
                    No sequences active. Click "Create Sequence" to generate an AI Follow-up Drip.
                 </div>
              )}
              {sequences.map(seq => (
                 <div key={seq.id} className="bg-[#0f0f0f] border border-white/[0.04] p-6 rounded-2xl flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                       <div>
                         <h4 className="text-white font-bold">{seq.name}</h4>
                         <p className="text-[10px] text-white/60 font-mono tracking-[0.2em] uppercase mt-1">{seq.steps?.length || 0} Steps</p>
                       </div>
                       <Sparkles size={16} className="text-[var(--brand-primary)]" />
                    </div>
                    <div className="text-xs text-white/80 space-y-2 mt-2">
                       {seq.steps?.slice(0, 2).map((s:any, i:number) => (
                          <div key={i} className="flex gap-2">
                            <span className="opacity-50 min-w-[40px] font-mono">Day {s.day}</span>
                            <span className="truncate">{s.subject}</span>
                          </div>
                       ))}
                       {(seq.steps?.length || 0) > 2 && <div className="text-white/40 italic">+{seq.steps.length - 2} more steps...</div>}
                    </div>
                 </div>
              ))}
           </div>
        </div>

      </div>

      {isSequenceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-10">
          <div className="w-full max-w-4xl bg-[#0a0a0a] rounded-2xl flex flex-col overflow-hidden border border-white/[0.04] shadow-2xl h-[90vh]">
             <div className="p-6 border-b border-white/[0.04] flex justify-between items-center bg-[#0f0f0f]">
                <div>
                   <h3 className="text-xl text-white font-bold tracking-tight">AI Sequence Builder</h3>
                   <p className="text-[10px] text-white/60 font-mono tracking-[0.2em] uppercase mt-1">Automated Drip Campaigns</p>
                </div>
                <button onClick={() => setIsSequenceModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                   <X size={24}/>
                </button>
             </div>
             
             <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="flex gap-4 items-center mb-8">
                   <input 
                     value={sequenceName}
                     onChange={e => setSequenceName(e.target.value)}
                     placeholder="Sequence Name (e.g. YouTube Retention Drip)"
                     className="flex-1 bg-[#141414] border border-white/[0.04] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                   />
                   <button 
                     onClick={handleAIGenerateSequence}
                     disabled={generatingSequence}
                     className="bg-[var(--brand-primary)] text-black font-bold uppercase tracking-[0.2em] px-6 py-3 text-xs rounded-2xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 shadow-lg"
                   >
                     {generatingSequence ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16}/>} Generate Template
                   </button>
                </div>

                <div className="space-y-6">
                   {sequenceSteps.map((step, idx) => (
                      <div key={idx} className="bg-[#141414] border border-white/[0.04] rounded-2xl p-6 relative group">
                         <button 
                           onClick={() => setSequenceSteps(sequenceSteps.filter((_, i) => i !== idx))}
                           className="absolute top-4 right-4 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                         >
                            <X size={16}/>
                         </button>
                         <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                               <label className="text-[10px] font-mono text-white/60 uppercase tracking-[0.2em]">Wait Days:</label>
                               <input 
                                 type="number" 
                                 value={step.day}
                                 onChange={e => {
                                   const newSteps = [...sequenceSteps];
                                   newSteps[idx].day = Number(e.target.value);
                                   setSequenceSteps(newSteps);
                                 }}
                                 className="w-16 bg-[#000000] border border-white/[0.04] rounded px-2 py-1 text-sm text-white focus:outline-none"
                               />
                            </div>
                         </div>
                         <div className="space-y-4">
                            <input 
                               value={step.subject}
                               onChange={e => {
                                 const newSteps = [...sequenceSteps];
                                 newSteps[idx].subject = e.target.value;
                                 setSequenceSteps(newSteps);
                               }}
                               placeholder="Subject Line"
                               className="w-full bg-[#000000] border border-white/[0.04] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
                            />
                            <textarea 
                               value={step.body}
                               onChange={e => {
                                 const newSteps = [...sequenceSteps];
                                 newSteps[idx].body = e.target.value;
                                 setSequenceSteps(newSteps);
                               }}
                               placeholder="Email Body..."
                               className="w-full h-32 bg-[#000000] border border-white/[0.04] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 resize-none custom-scrollbar"
                            />
                         </div>
                      </div>
                   ))}
                </div>
                
                <button 
                  onClick={() => setSequenceSteps([...sequenceSteps, { day: sequenceSteps[sequenceSteps.length-1]?.day + 2 || 1, subject: '', body: '' }])}
                  className="mt-6 w-full py-4 border-2 border-dashed border-white/[0.04] text-white/60 hover:text-white hover:border-white/20 rounded-2xl flex items-center justify-center gap-2 transition-colors uppercase tracking-[0.2em] text-xs font-bold"
                >
                   <Plus size={16}/> Add Manual Step
                </button>
             </div>
             
             <div className="p-6 border-t border-white/[0.04] bg-[#0f0f0f] flex justify-end gap-4">
                <button onClick={() => setIsSequenceModalOpen(false)} className="px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors">
                   Cancel
                </button>
                <button onClick={handleCreateSequence} className="bg-white text-black px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-transform flex items-center gap-2">
                   <Save size={16} className="hidden sm:block"/> Save Sequence
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
