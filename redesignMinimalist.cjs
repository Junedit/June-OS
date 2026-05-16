const fs = require('fs');
let code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const minimalistStart = '{invoiceTemplate === "minimalist" && (';
const detailedStart = '{invoiceTemplate === "detailed" && (';

let newMinimalist = `{invoiceTemplate === "minimalist" && (
                            <div className="flex flex-col h-full bg-[#fcfcfc] text-zinc-900 overflow-hidden relative">
                              <div className="absolute top-0 left-0 w-full h-[6px] bg-zinc-900 border-b-2 border-[var(--brandColor)]"></div>
                              <div className="flex justify-between items-end border-b-2 border-zinc-900 pb-8 mx-12 mt-16 mb-12 relative">
                                <div className="absolute -top-12 left-0 w-full flex justify-between font-mono text-zinc-300 pointer-events-none select-none text-[8px] tracking-[0.3em]">
                                  <span>00:00:00:00</span>
                                  <span>00:00:01:00</span>
                                  <span>00:00:02:00</span>
                                </div>
                                <div className="mt-8">
                                  <h1 className="text-4xl font-bold tracking-tighter mb-2 text-zinc-900 font-mono uppercase bg-zinc-100 inline-block px-4 py-1 border border-zinc-200">
                                    SEQ_01 // INVOICE
                                  </h1>
                                  <div className="grid grid-cols-2 gap-8 mt-6">
                                    <div>
                                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Invoice ID</p>
                                      <p className="text-base text-zinc-900 font-mono font-medium">
                                        <span onClick={() => document.getElementById('standalone-invoice')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">{previewData.invoiceNumber}</span>
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Due Date</p>
                                      <p className="text-base text-zinc-900 font-medium">
                                        <span onClick={() => document.getElementById('standalone-dueDate')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">
                                          {previewData.dueDate || "Upon Receipt"}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                  {previewData.logoUrl ? (
                                    <div className="mb-4">
                                      <img src={previewData.logoUrl} alt="Logo" className="h-10 object-contain ml-auto print:h-8 grayscale hover:grayscale-0 transition-all" />
                                    </div>
                                  ) : (
                                    <h2 onClick={() => document.getElementById('standalone-senderName')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity font-bold text-3xl text-zinc-900 tracking-tighter uppercase mb-2 border-b-4 border-[var(--brandColor)] pb-1 inline-block" title="Click to edit">
                                      {previewData.senderName || "JUNEDIT"}
                                    </h2>
                                  )}
                                  <p className="text-sm font-medium text-zinc-600 font-mono">
                                    {previewData.senderName || "hello@junedit.com"}
                                  </p>
                                  <p onClick={() => document.getElementById('standalone-senderEmail')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm text-zinc-500 mt-1 font-mono" title="Click to edit">
                                    {previewData.senderEmail || 'hello@junedit.com'}
                                  </p>
                                </div>
                              </div>

                              {previewData.welcomeMessage && (
                                <div className="px-12 mb-12">
                                  <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-sm border-l-4 border-l-zinc-800">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono flex items-center gap-2">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                      Message
                                    </p>
                                    <p onClick={() => document.getElementById('standalone-welcomeMessage')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap font-medium" title="Click to edit">
                                      {previewData.welcomeMessage}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="px-12 mb-16 flex gap-16">
                                <div>
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 font-mono">
                                    Billed To
                                  </p>
                                  <div className="pl-4 border-l-2 border-[var(--brandColor)]">
                                    <p onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-2xl font-bold tracking-tight text-zinc-900" title="Click to edit">
                                      {previewData.clientName || "Valued Client"}
                                    </p>
                                    <p onClick={() => document.getElementById('standalone-email')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm text-zinc-500 mt-2 font-mono" title="Click to edit">
                                      {previewData.email}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="px-12 mb-16 flex-grow">
                                <div className="bg-zinc-900 text-white flex text-[10px] font-bold uppercase tracking-widest p-4 rounded-t-lg">
                                  <div className="w-2/3">Deliverable / Sequence</div>
                                  <div className="w-1/3 text-right">Total Amount</div>
                                </div>
                                <div className="border border-zinc-200 border-t-0 p-8 rounded-b-lg flex bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--brandColor)]"></div>
                                  <div className="w-2/3 pr-8 relative">
                                    <p onClick={() => document.getElementById('standalone-desc')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity font-bold text-zinc-900 text-xl leading-relaxed mb-4" title="Click to edit">
                                      {previewData.desc}
                                    </p>
                                    <div className="flex gap-4">
                                      {previewData.format && (
                                        <div>
                                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Format</p>
                                          <p className="text-xs font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-1 inline-block rounded-sm border border-zinc-200">
                                            {previewData.format}
                                          </p>
                                        </div>
                                      )}
                                      {previewData.revisions && (
                                        <div>
                                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Revisions</p>
                                          <p className="text-xs font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-1 inline-block rounded-sm border border-zinc-200">
                                            {previewData.revisions} Rounds
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="w-1/3 text-right flex flex-col justify-center items-end border-l border-zinc-100 pl-8">
                                    <p className="text-3xl font-bold text-zinc-900 tabular-nums tracking-tighter">
                                      {getCurrencySymbol(previewData?.currency)}
                                      <span onClick={() => document.getElementById('standalone-amount')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-auto px-12 py-10 bg-zinc-50 border-t border-zinc-200 flex justify-between items-end relative">
                                <div className="absolute top-0 left-0 bg-[var(--brandColor)] w-32 h-1 -translate-y-[1px]"></div>
                                <div className="max-w-md space-y-8">
                                  {previewData.terms && (
                                    <div>
                                      <p className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-3 border-b border-zinc-200 inline-block pb-1">
                                        Contract Terms
                                      </p>
                                      <p onClick={() => document.getElementById('standalone-terms')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap font-medium" title="Click to edit">
                                        {previewData.terms}
                                      </p>
                                    </div>
                                  )}
                                  {previewData.additionalNotes && (
                                    <div>
                                      <p className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-3 border-b border-zinc-200 inline-block pb-1">
                                        Additional Notes
                                      </p>
                                      <p onClick={() => document.getElementById('standalone-additionalNotes')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap font-medium" title="Click to edit">
                                        {previewData.additionalNotes}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm min-w-[320px]">
                                  <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm text-zinc-500 font-medium font-mono">
                                      <span>Subtotal</span>
                                      <span>
                                        {getCurrencySymbol(previewData?.currency)}
                                        <span onClick={() => document.getElementById('standalone-amount')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                      </span>
                                    </div>
                                    {Number(previewData.discount || 0) > 0 && (
                                      <div className="flex justify-between text-sm font-bold text-red-600 font-mono">
                                        <span><span onClick={() => document.getElementById('standalone-discount')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">Discount</span></span>
                                        <span>
                                          -{getCurrencySymbol(previewData?.currency)}
                                          {Number(previewData.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    )}
                                    {Number(previewData.taxRate || 0) > 0 && (
                                      <div className="flex justify-between text-sm font-medium text-zinc-500 font-mono">
                                        <span><span onClick={() => document.getElementById('standalone-taxRate')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">Tax ({previewData.taxRate}%)</span></span>
                                        <span>
                                          {getCurrencySymbol(previewData?.currency)}
                                          {(Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (Number(previewData.taxRate) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    )}
                                    {Number(previewData.amountPaid || 0) > 0 && (
                                      <div className="flex justify-between text-sm font-bold text-green-600 font-mono">
                                        <span><span onClick={() => document.getElementById('standalone-amountPaid')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">Amount Paid</span></span>
                                        <span>
                                          -{getCurrencySymbol(previewData?.currency)}
                                          {Number(previewData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex justify-between items-end border-t-2 border-zinc-900 pt-4">
                                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Total Due</span>
                                    <span className="text-3xl font-black text-zinc-900 tabular-nums tracking-tighter">
                                      {getCurrencySymbol(previewData?.currency)}
                                      {Math.max(0, Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (1 + Number(previewData.taxRate || 0) / 100) - Number(previewData.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-zinc-900 py-6 px-12 print:hidden flex flex-wrap gap-4 items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                     <span className="text-xs text-zinc-400 font-mono font-medium">Ready for Payment</span>
                                  </div>
                                  <div className="flex gap-2">
                                    {previewData.paymentLinks && Object.values(previewData.paymentLinks).some((v: any) => v.enabled) ? (
                                      <>
                                        {previewData.paymentLinks.stripe?.enabled && previewData.paymentLinks.stripe?.url && (
                                          <a href={previewData.paymentLinks.stripe.url} target="_blank" rel="noreferrer" className="bg-[#635BFF] hover:bg-[#524be0] text-white font-bold py-2.5 px-6 rounded text-[10px] uppercase tracking-widest transition-all">
                                            Pay via Stripe
                                          </a>
                                        )}
                                        {previewData.paymentLinks.paypal?.enabled && previewData.paymentLinks.paypal?.url && (
                                          <a href={previewData.paymentLinks.paypal.url} target="_blank" rel="noreferrer" className="bg-[#00457C] hover:bg-[#003865] text-white font-bold py-2.5 px-6 rounded text-[10px] uppercase tracking-widest transition-all">
                                            Pay via PayPal
                                          </a>
                                        )}
                                      </>
                                    ) : (
                                      <a href={"mailto:" + (previewData.senderEmail || 'hello@junedit.com') + "?subject=Payment%20Arrangement"} className="bg-white hover:bg-zinc-200 text-black font-bold py-2.5 px-6 rounded text-[10px] uppercase tracking-widest transition-all">
                                        Contact for Payment Details
                                      </a>
                                    )}
                                  </div>
                              </div>
                            </div>
                          )}`;

let parts = code.split(minimalistStart);
let part2 = parts[1].split(detailedStart);
part2[0] = "";
code = parts[0] + newMinimalist + "\n                          " + detailedStart + part2.slice(1).join(detailedStart);
fs.writeFileSync('src/screens/Financials.tsx', code);
