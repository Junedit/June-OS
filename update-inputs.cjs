const fs = require('fs');
let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const clientAddressInput = `                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">
                      Client Address
                    </label>
                    <textarea id="standalone-clientAddress" rows={2} className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono resize-none" placeholder="123 Client St..." />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">
                      Sender Name / Company
                    </label>
                    <input type="text" id="standalone-senderName" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" placeholder="Your Name or LLC" />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">
                      Sender Address
                    </label>
                    <textarea id="standalone-senderAddress" rows={2} className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono resize-none" placeholder="Your Address..." />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">
                      Logo URL
                    </label>
                    <input type="url" id="standalone-logoUrl" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono" placeholder="https://..." />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">
                      Additional Notes
                    </label>
                    <textarea id="standalone-notes" rows={2} className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono resize-none" placeholder="Thank you for your business..." />
                  `;

content = content.replace(/(placeholder="client@example\.com"\s*\/>\s*)<\/div>/, '$1</div>\n' + clientAddressInput);

fs.writeFileSync('src/screens/Financials.tsx', content);
