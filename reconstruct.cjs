const fs = require('fs');
let code = fs.readFileSync('src/screens/LeadsDashboard.tsx', 'utf8');

const lines = code.split('\\n');
const fixedLines = lines.slice(0, 369); // up to ${invoiceText}

const restoredContent = 
"Pay here: ${invoiceLink}\\n" +
"\`);\\n" +
"      toast.success(\\\"Generated invoice!\\\");\\n" +
"    } catch(e: any) {\\n" +
"      toast.error(\\\"Failed to generate invoice\\\");\\n" +
"    } finally {\\n" +
"      setAiInvoice(false);\\n" +
"    }\\n" +
"  };\\n\\n" +
"  return (\\n" +
"    <div className=\\\"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm\\\" onClick={onClose}>\\n" +
"      <div className=\\\"bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden\\\" onClick={e => e.stopPropagation()}>\\n" +
"        <div className=\\\"p-6 border-b border-white/5 flex justify-between items-start\\\">\\n" +
"           <h3 className=\\\"text-xl font-bold text-white\\\">{lead.brandName}</h3>\\n" +
"           <button onClick={onClose} className=\\\"text-slate-500 hover:text-white p-2\\\">\\n" +
"              <X size={16} />\\n" +
"           </button>\\n" +
"        </div>\\n" +
"        \\n" +
"        {/* Global Action Bar */}\\n" +
"        <div className=\\\"bg-[#1a1a1a] border-b border-white/5 p-4 flex flex-col md:flex-row justify-between items-center gap-3 px-6 select-none\\\">\\n" +
"           <div className=\\\"flex-1 w-full flex items-center min-w-[200px] max-w-sm\\\">\\n" +
"             <input \\n" +
"               type=\\\"text\\\"\\n" +
"               value={aiAssistContext}\\n" +
"               onChange={(e) => setAiAssistContext(e.target.value)}\\n" +
"               placeholder=\\\"Pitch Goal/Context (e.g. upsell package, 10% discount)\\\"\\n" +
"               className=\\\"bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#ff0000] w-full transition-colors font-mono\\\"\\n" +
"               onKeyDown={(e) => { if (e.key === 'Enter' && !aiGenerating) handleAIAssist(); }}\\n" +
"             />\\n" +
"           </div>\\n" +
"           <div className=\\\"flex flex-wrap justify-end gap-3 flex-1\\\">\\n" +
"             <button \\n" +
"               onClick={handleAIAssist}\\n" +
"               disabled={aiGenerating}\\n" +
"               className=\\\"bg-zinc-800/80 hover:bg-zinc-700 text-white border border-white/10 text-xs px-4 py-2 rounded-lg font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0\\\"\\n" +
"             >\\n" +
"               {aiGenerating ? 'Analyzing...' : <>🤖 Pitch Assist</>}\\n" +
"             </button>\\n" +
"           </div>\\n" +
"        </div>\\n\\n" +
"        <div className=\\\"flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-white font-mono text-sm leading-relaxed whitespace-pre-wrap\\\">\\n" +
"           {notes.map((n, i) => <div key={i} className=\\\"bg-white/5 p-4 rounded-lg border border-white/10 mb-2\\\">{n.content}</div>)}\\n" +
"           {notes.length === 0 && <div className=\\\"text-white/40\\\">No output details available... Use Pitch Assist!</div>}\\n" +
"        </div>\\n" +
"      </div>\\n" +
"    </div>\\n" +
"  );\\n" +
"}\\n\\n" +
"// Kanban Board\\n" +
"const KANBAN_COLUMNS = [\\n" +
"  { id: 'new', title: 'New Leads' },\\n" +
"  { id: 'contacted', title: 'Contacted' },\\n" +
"  { id: 'negotiating', title: 'Negotiating' },\\n" +
"  { id: 'closed', title: 'Closed/Won' },\\n" +
"  { id: 'lost', title: 'Lost' }\\n" +
"];\\n\\n" +
"export default function LeadsDashboard() {\\n" +
"  const [leads, setLeads] = useState([]);\\n" +
"  const [selectedLead, setSelectedLead] = useState(null);\\n\\n" +
"  useEffect(() => {\\n" +
"    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));\\n" +
"    return onSnapshot(q, (snapshot) => {\\n" +
"      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));\\n" +
"    });\\n" +
"  }, []);\\n\\n" +
"  const handleDragStart = (e, leadId) => {\\n" +
"    e.dataTransfer.setData('leadId', leadId);\\n" +
"  };\\n\\n" +
"  const handleDragOver = (e) => {\\n" +
"    e.preventDefault();\\n" +
"  };\\n\\n" +
"  const handleDrop = async (e, statusId) => {\\n" +
"    e.preventDefault();\\n" +
"    const leadId = e.dataTransfer.getData('leadId');\\n" +
"    if(leadId) {\\n" +
"       await updateDoc(doc(db, 'leads', leadId), { status: statusId });\\n" +
"    }\\n" +
"  };\\n\\n" +
"  return (\\n" +
"    <div className=\\\"flex-1 flex flex-col relative z-10 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8\\\">\\n" +
"      <div className=\\\"flex items-center justify-between mb-8\\\">\\n" +
"        <div>\\n" +
"          <h1 className=\\\"text-3xl font-headline font-light tracking-tight text-white mb-1 drop-shadow-md\\\">Pipeline</h1>\\n" +
"          <p className=\\\"text-white/50 text-sm font-light font-mono\\\">Drag and drop leads to update status.</p>\\n" +
"        </div>\\n" +
"      </div>\\n\\n" +
"      <div className=\\\"flex gap-4 overflow-x-auto pb-8 h-[calc(100vh-200px)] min-h-[500px]\\\">\\n" +
"        {KANBAN_COLUMNS.map(column => (\\n" +
"          <div \\n" +
"            key={column.id} \\n" +
"            className=\\\"flex-shrink-0 w-80 flex flex-col bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden backdrop-blur-xl\\\"\\n" +
"            onDragOver={handleDragOver}\\n" +
"            onDrop={(e) => handleDrop(e, column.id)}\\n" +
"          >\\n" +
"             <div className=\\\"p-4 border-b border-white/5 bg-white/[0.01]\\\">\\n" +
"               <h3 className=\\\"font-bold uppercase tracking-widest text-xs text-white/60 mb-1\\\">{column.title}</h3>\\n" +
"               <div className=\\\"text-[10px] text-white/30 font-mono\\\">\\n" +
"                 {leads.filter(l => l.status === column.id).length} Leads\\n" +
"               </div>\\n" +
"             </div>\\n" +
"             \\n" +
"             <div className=\\\"flex-1 p-3 overflow-y-auto flex flex-col gap-3\\\">\\n" +
"               {leads.filter(l => l.status === column.id).map(lead => (\\n" +
"                 <div\\n" +
"                   key={lead.id}\\n" +
"                   draggable\\n" +
"                   onDragStart={(e) => handleDragStart(e, lead.id)}\\n" +
"                   onClick={() => setSelectedLead(lead)}\\n" +
"                   className=\\\"bg-black/40 border border-white/10 p-4 rounded-lg cursor-pointer hover:border-white/30 transition-colors\\\"\\n" +
"                 >\\n" +
"                   <div className=\\\"font-bold text-white mb-1\\\">{lead.brandName}</div>\\n" +
"                   <div className=\\\"text-xs text-white/60 font-mono mb-3\\\">{lead.contactName}</div>\\n" +
"                   <div className=\\\"flex justify-between items-center text-[10px] uppercase font-bold tracking-widest\\\">\\n" +
"                     <span className=\\\"text-emerald-500/80 bg-emerald-500/10 px-2 py-1 rounded\\\">$\\{(lead.budget || 0).toLocaleString()}</span>\\n" +
"                   </div>\\n" +
"                 </div>\\n" +
"               ))}\\n" +
"             </div>\\n" +
"          </div>\\n" +
"        ))}\\n" +
"      </div>\\n" +
"      \\n" +
"      {selectedLead && (\\n" +
"         <LeadDetailsModal \\n" +
"           lead={selectedLead} \\n" +
"           onClose={() => setSelectedLead(null)} \\n" +
"         />\\n" +
"      )}\\n" +
"    </div>\\n" +
"  );\\n" +
"}\\n";

fixedLines.push(restoredContent);

fs.writeFileSync('src/screens/LeadsDashboard.tsx', fixedLines.join('\\n'));
