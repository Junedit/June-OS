const fs = require('fs');
let c = fs.readFileSync('src/screens/Financials.tsx', 'utf-8');

c = c.replace(/<div className="grid grid-cols-2 gap-4 mb-4">[\s\S]*?<\/div>\s*<\/div>/, `<div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                       <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">Invoice # (Auto)</label>
                       <input type="text" id="standalone-invoice" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" defaultValue={"INV-" + Math.floor(1000 + Math.random() * 9000)} />
                     </div>
                     <div>
                       <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">Amount ($)</label>
                       <input type="number" id="standalone-amount" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" placeholder="1000" />
                     </div>
                     <div>
                       <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">Client Name</label>
                       <input type="text" id="standalone-clientName" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" placeholder="MrBeast LLC" />
                     </div>
                     <div>
                       <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">Client Email</label>
                       <input type="email" id="standalone-email" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" placeholder="client@example.com" />
                     </div>
                     <div className="col-span-2">
                       <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">Project Name / Scope</label>
                       <input type="text" id="standalone-desc" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" placeholder="e.g. 4x YouTube Videos - February Retainer" />
                     </div>
                     <div>
                       <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">Format & Length</label>
                       <input type="text" id="standalone-format" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" placeholder="e.g. 10min 4K MP4" />
                     </div>
                     <div>
                       <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">Revisions Included</label>
                       <input type="text" id="standalone-revisions" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" placeholder="e.g. 2 Rounds" />
                     </div>
                     <div>
                       <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">Due Date</label>
                       <input type="text" id="standalone-dueDate" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" placeholder="e.g. Net 15 / Upon receipt" />
                     </div>
                     <div>
                       <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">Terms/Notes</label>
                       <input type="text" id="standalone-terms" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" placeholder="e.g. 50% upfront" />
                     </div>
                  </div>`);

c = c.replace(/className="w-full bg-\[#1a1a1a\] border border-zinc-800 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-\[#ff0000\] transition-colors font-mono h-48"/g, `className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-4 text-[10px] text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono h-[500px] resize-y whitespace-pre"`);

c = c.replace(/const email = \(document.getElementById\('standalone-email'\) as HTMLInputElement\).value;[\s\S]*?const terms = \(document.getElementById\('standalone-terms'\) as HTMLInputElement\).value;/g, `const invoiceNumber = (document.getElementById('standalone-invoice') as HTMLInputElement).value;
                       const email = (document.getElementById('standalone-email') as HTMLInputElement).value;
                       const clientName = (document.getElementById('standalone-clientName') as HTMLInputElement).value;
                       const amount = (document.getElementById('standalone-amount') as HTMLInputElement).value;
                       const desc = (document.getElementById('standalone-desc') as HTMLInputElement).value;
                       const format = (document.getElementById('standalone-format') as HTMLInputElement).value;
                       const revisions = (document.getElementById('standalone-revisions') as HTMLInputElement).value;
                       const dueDate = (document.getElementById('standalone-dueDate') as HTMLInputElement).value;
                       const terms = (document.getElementById('standalone-terms') as HTMLInputElement).value;`);

c = c.replace(/if \(!email \|\| !amount \|\| !desc\) \{[\s\S]*?alert\("Please fill out Email, Amount, and Service Description."\);/g, `if (!email || !amount || !desc) {
                          alert("Please fill out Email, Amount, and Project Scope.");`);

c = c.replace(/email, amount, description: desc, deliverables, dueDate, terms\s*\}, "Junedit", paymentLinks\);/g, `invoiceNumber, email, amount, description: desc, clientName, format, revisions, dueDate, terms
                          }, "Junedit", paymentLinks);`);

fs.writeFileSync('src/screens/Financials.tsx', c);
