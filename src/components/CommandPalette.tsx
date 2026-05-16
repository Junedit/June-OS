import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Search, Command, FileText, User, Settings, Video, Target, ArrowRight, UserPlus, Hash, Brain, Sparkles } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getAI } from '../services/ai';
import { toast } from 'sonner';

export default function CommandPalette({ isOpen, setIsOpen, navigateTo }: { isOpen: boolean, setIsOpen: (o: boolean) => void, navigateTo: (tab: string) => void }) {
  const { user } = useAuth();
  const [queryText, setQuery] = useState('');
  const [leadResults, setLeadResults] = useState<any[]>([]);
  const [isProcessingAgent, setIsProcessingAgent] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if(!user || !queryText || queryText.length < 2) {
       setTimeout(() => setLeadResults([]), 0);
       return;
    }
    const searchLeads = async () => {
       const leadsRef = collection(db, 'leads');
       const q = query(leadsRef, where('ownerId', '==', user.uid));
       const snap = await getDocs(q);
       const queryLower = queryText.toLowerCase();
       const matches = snap.docs.map(d => ({id: d.id, ...d.data()})).filter((l: any) => 
          (l.brandName || '').toLowerCase().includes(queryLower) ||
          (l.contactName || '').toLowerCase().includes(queryLower)
       );
       setLeadResults(matches);
    };
    const to = setTimeout(searchLeads, 300);
    return () => clearTimeout(to);
  }, [queryText, user]);

  const actions = [
    { id: 'home', title: 'Command Center', icon: Command, action: () => navigateTo('home') },
    { id: 'leads', title: 'Go to Leads Dashboard', icon: Target, action: () => navigateTo('dashboard') },
    { id: 'prospector', title: 'Run OmniScout AI', icon: Search, action: () => navigateTo('prospector') },
    { id: 'agents', title: 'AI War Room & Sync', icon: Brain, action: () => navigateTo('agents') },
    { id: 'proposals', title: 'View Proposals', icon: FileText, action: () => navigateTo('proposals') },
    { id: 'financials', title: 'Financial Overview', icon: FileText, action: () => navigateTo('financials') },
    { id: 'client-portal', title: 'Client Portals', icon: User, action: () => navigateTo('client-portals') },
    { id: 'settings', title: 'System Settings', icon: Settings, action: () => navigateTo('settings') },
  ];

  const filteredActions = actions.filter(a => a.title.toLowerCase().includes(queryText.toLowerCase()));

  // Dynamic actions based on query
  if (queryText.toLowerCase().startsWith('pitch ') && queryText.length > 6) {
    filteredActions.unshift({
       id: 'dynamic-pitch',
       title: `Draft AI Pitch for ${queryText.substring(6)}`,
       icon: Target,
       action: () => { navigateTo('prospector'); } // In a real app this might auto-fill the radar search
    });
  }
  if (queryText.toLowerCase().startsWith('invoice ') && queryText.length > 8) {
    filteredActions.unshift({
       id: 'dynamic-inv',
       title: `Jump to Invoice #${queryText.substring(8)}`,
       icon: FileText,
       action: () => { navigateTo('financials'); }
    });
  }
  if (queryText.toLowerCase().includes('create lead') || queryText.toLowerCase().includes('new lead')) {
    filteredActions.unshift({
       id: 'dynamic-lead',
       title: `Create New Lead`,
       icon: UserPlus,
       action: () => { navigateTo('dashboard'); }
    });
  }

  const handleExecuteAgentCommand = async () => {
    if (!queryText.trim() || !user) return;
    
    setIsProcessingAgent(true);
    const ai = getAI();
    if (!ai) {
        toast.error("AI not configured.");
        setIsProcessingAgent(false);
        return;
    }

    try {
        const leadsQ = query(collection(db, 'leads'), where('ownerId', '==', user.uid));
        const leadsSnap = await getDocs(leadsQ);
        const leadsContext = leadsSnap.docs.map(d => ({ id: d.id, name: d.data().brandName || d.data().contactName })).slice(0, 50);

        const prompt = `You are JunePrime, an elite AI Agent operating inside a video agency CRM.
Your job is to interpret the user's natural language command and output a JSON array of actions you will take.

Available Leads:
${JSON.stringify(leadsContext, null, 2)}

Possible Actions Schema:
[
  { "type": "NAVIGATE", "tab": "dashboard" | "proposals" | "financials" | "projects" | "analytics" | "prospector" | "settings" },
  { "type": "CREATE_LEAD", "name": "Company Name", "niche": "Tech" },
  { "type": "DRAFT_INVOICE", "leadId": "string", "leadName": "string", "amount": 1000 },
  { "type": "CREATE_PROPOSAL", "leadId": "string", "title": "Project Proposal" }
]

Rules:
- Output ONLY a valid JSON array. Do not include markdown code block syntax like \`\`\`json.
- If you don't know the exact lead ID, omit the invoice/proposal action.
- Chain actions if useful (e.g., create a lead, then navigate).

User Command: "${queryText}"
`;

        const response = await ai.models.generateContent({
           model: "gemini-3.1-pro-preview",
           contents: prompt
        });

        let text = response.text || "[]";
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        let actions = [];
        try {
           actions = JSON.parse(text);
        } catch(e: any) {
           throw new Error("Invalid output received from JunePrime", { cause: e });
        }

        if (!Array.isArray(actions) || actions.length === 0) {
           toast.info("JunePrime could not determine an action for that command.");
           setIsProcessingAgent(false);
           return;
        }

        for (const action of actions) {
            switch(action.type) {
                case "NAVIGATE":
                   navigateTo(action.tab);
                   break;
                case "CREATE_LEAD":
                   await addDoc(collection(db, 'leads'), {
                      ownerId: user.uid,
                      brandName: action.name,
                      niche: action.niche || 'General',
                      status: 'new',
                      createdAt: serverTimestamp(),
                      source: 'JunePrime Intent'
                   });
                   toast.success(`JunePrime created lead: ${action.name}`);
                   break;
                case "DRAFT_INVOICE":
                   await addDoc(collection(db, 'invoices'), {
                      ownerId: user.uid,
                      leadId: action.leadId,
                      clientName: action.leadName,
                      amount: action.amount,
                      status: 'draft',
                      invoiceNumber: `INV-AUTO-${Math.floor(Math.random()*10000)}`,
                      createdAt: serverTimestamp()
                   });
                   toast.success(`JunePrime drafted an invoice for ${action.leadName}`);
                   break;
                case "CREATE_PROPOSAL":
                   await addDoc(collection(db, 'proposals'), {
                      ownerId: user.uid,
                      leadId: action.leadId,
                      title: action.title,
                      status: 'draft',
                      amount: 0,
                      content: '# Proposal built by JunePrime\n\nGenerated via intent.',
                      createdAt: serverTimestamp()
                   });
                   toast.success(`JunePrime built a proposal framework`);
                   break;
            }
        }

        setQuery('');
        setIsOpen(false);
    } catch (e: any) {
        console.error(e);
        toast.error("Agent failed: " + e.message);
    } finally {
        setIsProcessingAgent(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl cyber-border bg-[#050505]/95 backdrop-blur-3xl border border-white/[0.04] rounded-3xl shadow-[0_32px_120px_rgba(0,0,0,0.9),0_0_80px_rgba(255,59,48,0.05),inset_0_1px_1px_rgba(255,255,255,0.05)] z-[101] overflow-hidden"
          >
            <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--brand-primary)]/10 bg-[var(--brand-primary)]/[0.02]">
              {isProcessingAgent ? <Sparkles className="text-[var(--brand-primary)] animate-pulse" size={20} /> : <Search className="text-[#FF3B30] animate-pulse" size={20} />}
              <input 
                autoFocus
                type="text" 
                placeholder="Search leads, or type an action for JunePrime..." 
                className="w-full bg-transparent border-none text-[#F5F5F7] focus:outline-none focus:ring-0 font-body text-base placeholder:text-white/30"
                value={queryText}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isProcessingAgent}
                onKeyDown={(e) => {
                   if (e.key === 'Enter' && queryText.length > 5 && filteredActions.length < 5) {
                      handleExecuteAgentCommand();
                   }
                }}
              />
              <div className="flex items-center gap-1 text-[10px] text-[#FF3B30] font-mono bg-[#FF3B30]/10 border border-[#FF3B30]/20 px-2 py-1 rounded-2xl text-glow-red shrink-0">
                <Command size={10} /> <span>K</span>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
              {queryText.length > 4 && (
                 <button 
                  onClick={handleExecuteAgentCommand}
                  disabled={isProcessingAgent}
                  className="w-full mb-4 flex items-center justify-between px-4 py-4 rounded-2xl transition-all group text-left border border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10 overflow-hidden relative"
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)]/20 blur-[40px] rounded-full opacity-50 transition-all duration-700"></div>
                    <div className="flex flex-col relative z-10">
                       <span className="text-[14px] font-bold text-white tracking-wide flex items-center gap-2 max-w-lg truncate"><Sparkles size={16} className="text-[var(--brand-primary)]" /> Ask JunePrime to "{queryText}"</span>
                       <span className="text-[10px] font-mono text-[var(--brand-primary)]/70 uppercase tracking-[0.1em] mt-1">Execute via AI Natural Language Intent</span>
                    </div>
                    <ArrowRight size={16} className="text-[var(--brand-primary)] opacity-50 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300 relative z-10" />
                 </button>
              )}

              {leadResults.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] px-3 py-2 mb-2 font-semibold">Leads & Projects</div>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
                  {leadResults.map((lead) => (
                    <button 
                      key={lead.id}
                      onClick={() => { navigateTo('dashboard'); setIsOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-4 rounded-2xl hover:bg-[#FF3B30]/10 transition-all group text-left border border-transparent hover:border-[#FF3B30]/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#111111] to-[#000000] border border-white/[0.04] flex items-center justify-center text-[#FF3B30] shadow-[0_2px_10px_rgba(255,59,48,0.1)] group-hover:shadow-[0_4px_16px_rgba(255,59,48,0.2)] group-hover:scale-105 transition-all">
                          <Hash size={16} strokeWidth={2} />
                        </div>
                        <div>
                           <span className="text-[15px] font-body text-white/80 group-hover:text-white transition-colors tracking-wide block">{lead.brandName}</span>
                           <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.1em]">{lead.niche || 'Lead'}</span>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-white/0 group-hover:text-[#FF3B30] transition-colors" />
                    </button>
                  ))}
                </div>
              )}
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] px-3 py-2 mb-2 font-semibold">Quick Actions</div>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
              {filteredActions.map((action) => (
                <button 
                  key={action.id}
                  onClick={() => { action.action(); setIsOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-4 rounded-2xl hover:bg-white/[0.03] transition-all group text-left border border-transparent hover:border-[var(--brand-primary)]/20 hover:bg-[var(--brand-primary)]/[0.02] hover:shadow-[0_4px_24px_rgba(255,59,48,0.05),inset_0_1px_1px_rgba(255,255,255,0.02)] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)]/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-2xl border border-white/[0.04] bg-[#111111]/50 backdrop-blur-md flex items-center justify-center text-[#FF3B30] shadow-[0_2px_10px_rgba(255,59,48,0.1)] group-hover:shadow-[0_4px_16px_rgba(255,59,48,0.2),0_0_15px_rgba(255,59,48,0.3)] group-hover:scale-105 transition-all">
                      <action.icon size={16} strokeWidth={2} />
                    </div>
                    <span className="text-[15px] font-body text-white/80 group-hover:text-white transition-colors tracking-wide">{action.title}</span>
                  </div>
                  <ArrowRight size={16} className="text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300 relative z-10" />
                </button>
              ))}
              {filteredActions.length === 0 && leadResults.length === 0 && queryText.length <= 4 && (
                 <div className="px-3 py-16 text-center text-white/40 font-mono text-xs tracking-widest uppercase">Unknown Command / Type clearly</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
