const fs = require('fs');

// 1. Fix ClientPortal.tsx
let portalStr = fs.readFileSync('src/screens/ClientPortal.tsx', 'utf8');

const badButton = `<button className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap">\n                    <Download size={14} /> Download Master\n                 </button>`;
const goodButton = `<a href={lead.masterFileUrl || '#'} target={lead.masterFileUrl ? "_blank" : "_self"} rel="noreferrer" className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap">\n                    <Download size={14} /> {lead.masterFileUrl ? 'Download Master' : 'Link Pending'}\n                 </a>`;

portalStr = portalStr.replace(badButton, goodButton);
fs.writeFileSync('src/screens/ClientPortal.tsx', portalStr);

// 2. Fix LeadsDashboard.tsx
let leadsStr = fs.readFileSync('src/screens/LeadsDashboard.tsx', 'utf8');

const tasksDivEnd = `                  ))}\n                </div>\n\n                <div className="space-y-2 mb-2">`;

const replaceWith = `                  ))}\n                </div>\n\n                <div className="space-y-3 mt-4 mb-4 pb-4 border-b border-white/5">\n                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#ff0000] mb-3 px-2 mt-2">Deliverables Links</h4>\n                   <div>\n                     <label className="text-xs text-white/50 px-2 block mb-1">Review Video URL (Frame.io, Vimeo...)</label>\n                     <input type="text" value={lead.reviewVideoUrl || ''} onChange={(e) => updateDoc(doc(db, 'leads', lead.id), { reviewVideoUrl: e.target.value })} className="w-full bg-black/40 border border-white/10 p-2 rounded text-sm text-white" placeholder="https://..." />\n                   </div>\n                   <div>\n                     <label className="text-xs text-white/50 px-2 block mb-1 mt-2">Final Master DL Link (Drive, Dropbox...)</label>\n                     <input type="text" value={lead.masterFileUrl || ''} onChange={(e) => updateDoc(doc(db, 'leads', lead.id), { masterFileUrl: e.target.value })} className="w-full bg-black/40 border border-white/10 p-2 rounded text-sm text-white" placeholder="https://..." />\n                   </div>\n                </div>\n\n                <div className="space-y-2 mb-2">`;

leadsStr = leadsStr.replace(tasksDivEnd, replaceWith);
fs.writeFileSync('src/screens/LeadsDashboard.tsx', leadsStr);
