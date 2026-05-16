const fs = require('fs');
let c = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

c = c.replace(
  `<div>
                       <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">Amount Paid ($)</label>
                       <input type="number" id="standalone-amountPaid" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" placeholder="0" defaultValue="0" />
                     </div>`,
  `<div>
                       <div className="flex justify-between items-center mb-1.5">
                         <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest block text-white/50">Amount Paid ($)</label>
                         <div className="flex gap-1">
                           <button type="button" onClick={() => {
                             const el = document.getElementById('standalone-amountPaid');
                             if (el) el.value = 0;
                           }} className="text-[8px] bg-white/5 hover:bg-white/10 px-1 py-0.5 rounded text-white/50 uppercase">0%</button>
                           <button type="button" onClick={() => {
                             const amt = parseFloat(document.getElementById('standalone-amount').value || 0);
                             const el = document.getElementById('standalone-amountPaid');
                             if (el) el.value = (amt * 0.5).toFixed(2);
                           }} className="text-[8px] bg-white/5 hover:bg-white/10 px-1 py-0.5 rounded text-white/50 uppercase">50%</button>
                           <button type="button" onClick={() => {
                             const amt = document.getElementById('standalone-amount').value || 0;
                             const el = document.getElementById('standalone-amountPaid');
                             if (el) el.value = amt;
                           }} className="text-[8px] bg-[#ff0000]/20 hover:bg-[#ff0000]/40 text-[#ff0000] px-1 py-0.5 rounded uppercase">Full</button>
                         </div>
                       </div>
                       <input type="number" id="standalone-amountPaid" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" placeholder="0" defaultValue="0" />
                     </div>`
);

fs.writeFileSync('src/screens/Financials.tsx', c);
