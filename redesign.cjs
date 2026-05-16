const fs = require('fs');
let code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// Find the branded block and replace it.
const brandedStart = '{invoiceTemplate === "branded" && (';
const minimalistStart = '{invoiceTemplate === "minimalist" && (';

let newBranded = `{invoiceTemplate === "branded" && (
                            <>
                              <div className="absolute inset-0 bg-black pointer-events-none z-[-2]"></div>
                              <div className="absolute inset-0 opacity-20 pointer-events-none z-[-1]" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, var(--brandColor) 0%, transparent 50%)' }}></div>
                              
                              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none select-none">
                                <div className="text-[140px] font-black leading-none tracking-tighter mix-blend-overlay print:hidden">
                                  REC
                                </div>
                              </div>

                              <div className="border-b border-zinc-800 print:border-black pb-12 mb-12 flex justify-between items-start relative">
                                <div>
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
                                    <span className="text-xs font-bold tracking-[0.3em] font-mono text-zinc-400 uppercase">
                                      Video & Post-Production
                                    </span>
                                  </div>
                                  <h1 className="text-6xl font-black tracking-tighter uppercase mb-4 text-white print:text-black drop-shadow-md">
                                    INVOICE
                                  </h1>
                                  <p onClick={() => document.getElementById('standalone-invoice')?.focus()} className="cursor-pointer hover:opacity-70 transition-all text-sm font-mono text-zinc-300 print:text-gray-500 bg-zinc-900 print:bg-gray-200 inline-block px-3 py-1.5 rounded-md border border-zinc-800 print:border-none shadow-sm" title="Click to edit">
                                    NO. {previewData.invoiceNumber}
                                  </p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                  {previewData.logoUrl ? (
                                    <div className="mb-4 bg-white/5 p-2 rounded-lg border border-white/10 backdrop-blur-sm">
                                      <img src={previewData.logoUrl} alt="Logo" className="h-12 object-contain print:h-10 filter drop-shadow-lg" />
                                    </div>
                                  ) : (
                                    <h2 onClick={() => document.getElementById('standalone-senderName')?.focus()} className="cursor-pointer hover:opacity-70 transition-all font-black text-4xl tracking-tighter uppercase text-[var(--brandColor)] drop-shadow-md mb-2" title="Click to edit">
                                      {previewData.senderName || "JUNEDIT"}
                                    </h2>
                                  )}
                                  <p className="text-white print:text-gray-900 font-bold font-mono text-[10px] tracking-widest mt-1 uppercase bg-white/10 print:bg-gray-200 backdrop-blur-md inline-block px-3 py-1 rounded-sm border border-white/5">
                                    DIRECTOR & EDITOR
                                  </p>
                                  <p onClick={() => document.getElementById('standalone-senderEmail')?.focus()} className="cursor-pointer hover:text-white transition-colors text-zinc-400 print:text-gray-500 font-mono mt-4 text-sm" title="Click to edit">
                                    {previewData.senderEmail || 'hello@junedit.com'}
                                  </p>
                                </div>
                              </div>

                              {previewData.welcomeMessage && (
                                <div className="mb-12 max-w-2xl bg-gradient-to-r from-zinc-900 to-transparent p-6 rounded-r-xl border-l-2 border-[var(--brandColor)] print:border-l-4 print:bg-transparent print:p-0">
                                  <p onClick={() => document.getElementById('standalone-welcomeMessage')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm font-medium text-zinc-300 print:text-zinc-700 leading-relaxed whitespace-pre-wrap italic" title="Click to edit">
                                    "{previewData.welcomeMessage}"
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                                <div className="bg-[#0a0a0a] print:bg-white p-8 border border-zinc-800 print:border-black rounded-xl shadow-2xl relative overflow-hidden group">
                                  <div className="absolute top-0 left-0 w-1 h-full bg-zinc-800 print:bg-black group-hover:bg-[var(--brandColor)] transition-colors duration-500"></div>
                                  <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 print:border-gray-200 pb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 print:bg-gray-400"></div>
                                    <p className="text-[10px] font-bold font-mono text-zinc-500 print:text-gray-400 uppercase tracking-widest">
                                      Client / Billed To
                                    </p>
                                  </div>
                                  <p onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-3xl font-black tracking-tight text-white print:text-black mb-2 flex items-center gap-3" title="Click to edit">
                                    {previewData.clientName || "Valued Client"}
                                  </p>
                                  <p onClick={() => document.getElementById('standalone-email')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm text-zinc-400 print:text-gray-600 font-mono" title="Click to edit">
                                    {previewData.email}
                                  </p>
                                </div>
                                <div className="bg-gradient-to-br from-[#111] to-black text-white p-8 border border-zinc-800 print:border-black rounded-xl shadow-2xl relative overflow-hidden flex flex-col justify-center">
                                  <div className="absolute -inset-1 bg-[var(--brandColor)] opacity-10 blur-xl pointer-events-none"></div>
                                  <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none">
                                    <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                                  </div>
                                  <div className="flex justify-between items-end mb-6 border-b border-zinc-800/80 print:border-gray-200 pb-5 relative z-10">
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 print:bg-gray-400"></div>
                                        <p className="text-[10px] font-bold font-mono text-zinc-500 print:text-gray-400 uppercase tracking-widest">
                                          Due Date
                                        </p>
                                      </div>
                                      <p onClick={() => document.getElementById('standalone-dueDate')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-2xl font-black uppercase text-white print:text-black tracking-tight" title="Click to edit">
                                        {previewData.dueDate || "Upon Receipt"}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex items-center justify-end gap-2 mb-2">
                                        <p className="text-[10px] font-bold font-mono text-zinc-500 print:text-gray-400 uppercase tracking-widest">
                                          Amount Due
                                        </p>
                                      </div>
                                      <p className="text-3xl font-black uppercase text-[var(--brandColor)] tabular-nums tracking-tighter drop-shadow-sm">
                                        {getCurrencySymbol(previewData?.currency)}
                                        {Math.max(0, Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (1 + Number(previewData.taxRate || 0) / 100) - Number(previewData.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="space-y-3 relative z-10 print:hidden mt-2">
                                    {previewData.paymentLinks && Object.values(previewData.paymentLinks).some((v: any) => v.enabled) && (
                                    <div className="flex gap-2">
                                      {previewData.paymentLinks.stripe?.enabled && previewData.paymentLinks.stripe?.url && (
                                        <a href={previewData.paymentLinks.stripe.url} target="_blank" rel="noreferrer" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-widest text-center transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2">
                                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M13.976 9.15c-2.172-.806-3.356-1.143-3.356-2.077 0-.839.683-1.42 1.95-1.42 2.16 0 3.332 1.258 3.513 1.488l1.458-1.503C16.892 4.962 14.869 4 12.57 4 9.172 4 6.942 6.002 6.942 8.547c0 3.327 3.517 4.237 5.927 4.975 2.127.65 3.12 1.344 3.12 2.385 0 .977-.82 1.638-2.227 1.638-1.22 0-2.812-.662-3.8-1.74l-1.637 1.493c1.233 1.484 3.144 2.452 5.437 2.452 3.424 0 5.867-1.924 5.867-4.632 0-2.78-1.9-3.882-5.653-5.018z"/></svg> Pay Card
                                        </a>
                                      )}
                                      {previewData.paymentLinks.paypal?.enabled && previewData.paymentLinks.paypal?.url && (
                                        <a href={previewData.paymentLinks.paypal.url} target="_blank" rel="noreferrer" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-widest text-center transition-all shadow-lg shadow-yellow-900/50 flex items-center justify-center gap-2">
                                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993c-.19.96-.407 1.393-1.18 1.393h-2.33c-.31 0-.54-.26-.47-.56l1.24-7.857.17-1.12c.07-.46.46-.8.93-.8h1.22c2.19 0 4-.54 4.88-2.52.28-.62.33-1.24.16-1.84a1.86 1.86 0 0 0-.25-.5v.02c-.01.02 0 0 0 .04l-.07.36c-.66 4.19-3.15 5.56-6.42 5.56H7.98c-.47 0-.86.34-.93.8l-1.04 6.57c-.07.31-.3.56-.62.56H3.06c-.31 0-.54-.26-.47-.56L4.54 8.78l.45-2.88c.07-.46.46-.8.93-.8h4.63c3.55 0 5.62.9 6.22 3.36z"/></svg> PayPal
                                        </a>
                                      )}
                                    </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mb-12 border border-zinc-800 print:border-black rounded-xl overflow-hidden shadow-xl bg-[#080808]">
                                <div className="bg-zinc-900/80 print:bg-gray-100 p-5 flex border-b border-zinc-800 print:border-black backdrop-blur-md">
                                  <div className="flex-1">
                                    <p className="text-[10px] font-bold text-zinc-400 print:text-gray-500 uppercase tracking-widest font-mono">
                                      Project Scope & Deliverables
                                    </p>
                                  </div>
                                  <div className="w-32 text-right hidden sm:block">
                                    <p className="text-[10px] font-bold text-zinc-400 print:text-gray-500 uppercase tracking-widest font-mono">
                                      Total
                                    </p>
                                  </div>
                                </div>
                                <div className="p-6 md:p-8 flex flex-col sm:flex-row border-b border-zinc-800/50 print:border-gray-200">
                                  <div className="flex-1 mb-4 sm:mb-0">
                                    <p onClick={() => document.getElementById('standalone-desc')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-xl font-medium tracking-tight text-white print:text-black mb-4 leading-relaxed" title="Click to edit">
                                      {previewData.desc}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                      {previewData.format && (
                                        <div className="inline-flex items-center gap-2 bg-zinc-900 print:bg-gray-100 px-3 py-1.5 rounded-md border border-zinc-700/50 print:border-gray-300">
                                          <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                          <span className="text-xs font-mono text-zinc-300 print:text-gray-600">
                                            {previewData.format}
                                          </span>
                                        </div>
                                      )}
                                      {previewData.revisions && (
                                        <div className="inline-flex items-center gap-2 bg-zinc-900 print:bg-gray-100 px-3 py-1.5 rounded-md border border-zinc-700/50 print:border-gray-300">
                                          <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                          <span className="text-xs font-mono text-zinc-300 print:text-gray-600">
                                            {previewData.revisions} Rev
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="w-full sm:w-32 sm:text-right mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-zinc-800 print:border-gray-200">
                                    <p className="text-2xl font-black text-white print:text-black tabular-nums tracking-tighter">
                                      {getCurrencySymbol(previewData?.currency)}
                                      <span onClick={() => document.getElementById('standalone-amount')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">{Number(previewData.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="bg-[#111] print:bg-transparent p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end border-t border-zinc-800 print:border-gray-200 gap-6">
                                  <div className="space-y-4 w-full md:w-auto">
                                    {Number(previewData.discount || 0) > 0 && (
                                      <div className="flex items-center justify-between gap-6">
                                        <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest"><span onClick={() => document.getElementById('standalone-discount')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">Discount</span></p>
                                        <p className="text-sm font-bold text-red-500 tabular-nums">
                                          -{getCurrencySymbol(previewData?.currency)}
                                          {Number(previewData.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    )}
                                    {Number(previewData.taxRate || 0) > 0 && (
                                      <div className="flex items-center justify-between gap-6">
                                        <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest"><span onClick={() => document.getElementById('standalone-taxRate')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">Tax Rate ({previewData.taxRate}%)</span></p>
                                        <p className="text-sm font-bold text-zinc-300 print:text-gray-600 tabular-nums">
                                          {getCurrencySymbol(previewData?.currency)}
                                          {(Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (Number(previewData.taxRate) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    )}
                                    {Number(previewData.amountPaid || 0) > 0 && (
                                      <div className="flex items-center justify-between gap-6">
                                        <p className="text-xs font-mono text-[var(--brandColor)] uppercase tracking-widest"><span onClick={() => document.getElementById('standalone-amountPaid')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">Amount Paid</span></p>
                                        <p className="text-sm font-bold text-green-500 tabular-nums">
                                          -{getCurrencySymbol(previewData?.currency)}
                                          {Number(previewData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col-reverse md:flex-row md:justify-between items-stretch md:items-start pt-8 gap-8 mt-auto border-t border-zinc-800">
                                <div className="w-full md:max-w-md space-y-6">
                                  {previewData.terms && (
                                    <div className="bg-[#111] print:bg-gray-50 p-6 rounded-xl border border-zinc-800 print:border-gray-200 hover:border-zinc-700 transition-colors">
                                      <p className="text-[10px] font-bold font-mono text-zinc-500 print:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Contract Terms
                                      </p>
                                      <p onClick={() => document.getElementById('standalone-terms')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-xs font-mono text-zinc-400 print:text-gray-600 leading-relaxed whitespace-pre-wrap" title="Click to edit">
                                        {previewData.terms}
                                      </p>
                                    </div>
                                  )}
                                  {previewData.additionalNotes && (
                                    <div className="bg-zinc-900/60 print:bg-white p-6 rounded-xl border border-zinc-800/80 print:border-gray-200">
                                      <p className="text-[10px] font-bold font-mono text-zinc-500 print:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                        Additional Notes
                                      </p>
                                      <p onClick={() => document.getElementById('standalone-additionalNotes')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-xs font-mono text-zinc-400 print:text-gray-600 leading-relaxed whitespace-pre-wrap" title="Click to edit">
                                        {previewData.additionalNotes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="text-left md:text-right w-full md:w-auto">
                                  <div className="inline-block flex flex-col items-start md:items-end">
                                    <div className="h-16 w-32 border-b-2 border-[var(--brandColor)] opacity-50 mb-2 transform -skew-x-12"></div>
                                    <p className="text-xs font-bold font-mono text-zinc-500 print:text-gray-500 uppercase tracking-widest">
                                      Authorized Signatory
                                    </p>
                                    <p className="text-lg font-serif italic text-zinc-300 mt-2">
                                      {previewData.senderName || "JUNEDIT"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}`;

let parts = code.split(brandedStart);
let part2 = parts[1].split(minimalistStart);
part2[0] = "";
code = parts[0] + newBranded + "\n                          " + minimalistStart + part2.slice(1).join(minimalistStart);
fs.writeFileSync('src/screens/Financials.tsx', code);
