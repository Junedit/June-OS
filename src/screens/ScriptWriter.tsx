import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Wand2, Loader2, PlayCircle, Download } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';

export default function ScriptWriter() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptResponse, setScriptResponse] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchLeads = async () => {
      const q = query(
        collection(db, 'leads'),
        where('ownerId', '==', auth.currentUser?.uid),
        where('status', 'in', ['closed', 'negotiating'])
      );
      const snap = await getDocs(q);
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchLeads();
  }, []);

  const handleGenerate = async () => {
    if (!selectedLeadId && !customPrompt) {
      toast.error('Select a client or type a prompt first!');
      return;
    }
    
    setIsGenerating(true);
    let fullPrompt = customPrompt;
    
    if (selectedLeadId) {
       const lead = leads.find(l => l.id === selectedLeadId);
       let context = `Client Name: ${lead.brandName || lead.name}. `;
       if (lead.questionnaireAnswers) {
          context += `Onboarding Questionnaire Answers: ${lead.questionnaireAnswers}. `;
       }
       if (lead.notes) {
          context += `Notes: ${lead.notes}. `;
       }
       fullPrompt = `${context}\n\nPlease generate a full video script and accompanying shot list (storyboard details) for this client based on the context. ${customPrompt ? 'Also incorporate this: ' + customPrompt : ''}`;
    }

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          systemInstruction: 'You are an elite YouTube/Commercial scriptwriter and creative director. Output a structured script containing sections, voiceover/on-screen dialogue, and a detailed B-roll/Shot list. Keep it engaging, high-retention, and professional. Format cleanly.'
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setScriptResponse(data.text);
      toast.success('Script generated successfully!');
    } catch (e: any) {
      toast.error('Failed to generate script: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full overflow-hidden">
      <div className="mb-8">
        <h1 className="text-3xl font-body font-bold text-white flex items-center gap-3">
          <Wand2 size={28} className="text-[var(--brand-primary)]" />
          AI Script Writer
        </h1>
        <p className="text-sm text-white/50 mt-2 font-mono uppercase tracking-widest">Auto-generate storyboards & scripts from client questionnaires</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
         <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
            <div className="bg-[#0a0a0a] border border-white/[0.04] p-6 rounded-[24px] shadow-2xl">
               <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-[0.2em] flex items-center gap-2"><PlayCircle size={16}/> Select Client</h3>
               <select 
                 value={selectedLeadId}
                 onChange={e => setSelectedLeadId(e.target.value)}
                 className="w-full bg-[#141414] border border-white/[0.08] p-3 text-sm text-white rounded-[16px] focus:outline-none focus:border-[var(--brand-primary)] transition-colors mb-4"
               >
                 <option value="">-- Choose a closed/negotiating client --</option>
                 {leads.map(l => (
                   <option key={l.id} value={l.id}>{l.brandName || l.name}</option>
                 ))}
               </select>

               <h3 className="text-sm font-bold text-white mb-4 mt-6 uppercase tracking-[0.2em] flex items-center gap-2"><FileText size={16}/> Custom Prompt</h3>
               <textarea
                 value={customPrompt}
                 onChange={e => setCustomPrompt(e.target.value)}
                 placeholder="E.g., Make it a 60-second TikTok ad focusing on their new product launch..."
                 className="w-full bg-[#141414] border border-white/[0.08] p-4 text-sm text-white rounded-[16px] h-32 resize-none focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
               />

               <button 
                 onClick={handleGenerate}
                 disabled={isGenerating || (!selectedLeadId && !customPrompt)}
                 className="w-full mt-6 bg-gradient-to-r from-[var(--brand-primary)] to-[#00C2A8] text-black font-bold uppercase tracking-[0.2em] text-xs py-4 rounded-[16px] hover:shadow-[0_0_30px_rgba(0,239,209,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
               >
                 {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Wand2 size={16} /> Generate Script</>}
               </button>
            </div>
         </div>

         <div className="flex-1 bg-[#050505] border border-white/[0.08] p-8 rounded-[32px] shadow-inner flex flex-col min-h-0 relative">
            <div className="flex justify-between items-center mb-6 border-b border-white/[0.04] pb-4">
               <h3 className="text-lg font-bold text-white tracking-widest font-mono">OUTPUT SCRIPT</h3>
               {scriptResponse && (
                 <button onClick={() => { navigator.clipboard.writeText(scriptResponse); toast.success('Copied!'); }} className="text-white/40 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                    <Download size={16} />
                 </button>
               )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isGenerating ? (
                 <div className="h-full flex flex-col items-center justify-center text-white/30 gap-4">
                    <Loader2 size={32} className="animate-spin text-[var(--brand-primary)]/50" />
                    <p className="font-mono text-xs uppercase tracking-widest animate-pulse">Consulting creative director AI...</p>
                 </div>
              ) : scriptResponse ? (
                 <div className="prose prose-invert max-w-none text-white/80 font-mono text-sm whitespace-pre-wrap leading-relaxed pr-4">
                    {scriptResponse}
                 </div>
              ) : (
                 <div className="h-full flex items-center justify-center text-white/20 font-mono text-xs uppercase tracking-widest text-center px-10">
                    Your generated script and shot list will appear here. The AI uses the client's onboarding questionnaire answers to craft the perfect story.
                 </div>
              )}
            </div>
         </div>
      </div>
    </div>
  );
}
