const fs = require('fs');
let code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const detailedStart = '{invoiceTemplate === "detailed" && (';
const corporateStart = '{invoiceTemplate === "corporate" && (';

let newDetailed = `{invoiceTemplate === "detailed" && (
                            <div className="flex flex-col h-full bg-[#fcfcfc] border border-zinc-200 shadow-sm relative overflow-hidden">
                              {/* Header element */}
                              <div className="absolute top-0 left-0 right-0 h-32 bg-zinc-900 pointer-events-none"></div>
                              <div className="absolute top-0 right-1/4 h-64 w-64 bg-[var(--brandColor)] opacity-20 blur-3xl rounded-full pointer-events-none"></div>

                              <div className="relative pt-12 px-12 pb-8 text-white flex justify-between items-start print:pt-6 print:px-0">
                                <div>
                                  <h1 className="text-4xl font-serif mb-2 tracking-tight">Invoice</h1>
                                  <p className="text-sm text-zinc-300 font-mono">
                                    Number: <span onClick={() => document.getElementById('standalone-invoice')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity font-bold text-white bg-white/10 px-2 py-0.5 rounded" title="Click to edit">{previewData.invoiceNumber}</span>
                                  </p>
                                  <p className="text-sm text-zinc-300 font-mono mt-1">
                                    Issued: <span className="text-white">{new Date().toLocaleDateString()}</span>
                                  </p>
                                  <p className="text-sm text-zinc-300 font-mono mt-1">
                                    Due: <span onClick={() => document.getElementById('standalone-dueDate')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity font-bold text-[var(--brandColor)] mix-blend-screen" title="Click to edit">{previewData.dueDate || "Upon Receipt"}</span>
                                  </p>
                                </div>
                                <div className="text-right">
                                  {previewData.logoUrl ? (
                                    <div className="bg-white p-2 rounded inline-block shadow-sm">
                                      <img src={previewData.logoUrl} alt="Logo" className="h-10 object-contain ml-auto print:h-8" />
                                    </div>
                                  ) : (
                                    <h2 onClick={() => document.getElementById('standalone-senderName')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-2xl font-bold tracking-tight text-white mb-1" title="Click to edit">
                                      {previewData.senderName || "JUNEDIT"}
                                    </h2>
                                  )}
                                  <p className="text-xs font-bold tracking-widest uppercase text-[var(--brandColor)]">Studio Production</p>
                                  <p onClick={() => document.getElementById('standalone-senderEmail')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm text-zinc-300 mt-2 font-mono" title="Click to edit">
                                    {previewData.senderEmail || 'hello@junedit.com'}
                                  </p>
                                </div>
                              </div>

                              <div className="px-12 py-8 flex-grow flex flex-col relative z-10 print:px-0">
                                {previewData.welcomeMessage && (
                                  <div className="mb-10 text-center max-w-xl mx-auto">
                                    <p onClick={() => document.getElementById('standalone-welcomeMessage')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm text-zinc-500 leading-relaxed font-serif italic" title="Click to edit">
                                      "{previewData.welcomeMessage}"
                                    </p>
                                  </div>
                                )}

                                <div className="mb-10 bg-white p-8 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                  <div>
                                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">
                                      Invoice To
                                    </h3>
                                    <p onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-xl font-bold text-zinc-900" title="Click to edit">
                                      {previewData.clientName || "Valued Client"}
                                    </p>
                                    <p onClick={() => document.getElementById('standalone-email')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm text-zinc-500 font-mono mt-1" title="Click to edit">
                                      {previewData.email}
                                    </p>
                                  </div>
                                  <div className="w-full md:w-auto text-right border-t md:border-t-0 md:border-l border-zinc-100 pt-4 md:pt-0 md:pl-8">
                                     <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">Amount Due</p>
                                     <p className="text-4xl font-black tabular-nums tracking-tighter text-[var(--brandColor)]">
                                        {getCurrencySymbol(previewData?.currency)}
                                        {Math.max(0, Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (1 + Number(previewData.taxRate || 0) / 100) - Number(previewData.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                     </p>
                                  </div>
                                </div>

                                <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-sm mb-12">
                                  <table className="w-full text-left">
                                    <thead className="bg-[#f0f0f0]">
                                      <tr>
                                        <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-200">Service Items</th>
                                        <th className="py-4 px-6 text-right text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-200 w-48">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                      <tr className="hover:bg-zinc-50 transition-colors">
                                        <td className="py-6 px-6 border-b border-zinc-100 align-top">
                                          <p onClick={() => document.getElementById('standalone-desc')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity font-semibold text-zinc-900 mb-3" title="Click to edit">
                                            {previewData.desc}
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {previewData.format && (
                                              <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-600 text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-widest font-mono">
                                                Format: {previewData.format}
                                              </span>
                                            )}
                                            {previewData.revisions && (
                                              <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-600 text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-widest font-mono">
                                                Revisions: {previewData.revisions}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-6 px-6 text-right font-medium text-lg border-b border-zinc-100 align-top">
                                          {getCurrencySymbol(previewData?.currency)}
                                          <span onClick={() => document.getElementById('standalone-amount')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  
                                  <div className="bg-[#f8f8f8] flex flex-col md:flex-row border-t border-zinc-200 text-sm">
                                    <div className="flex-1 p-6 md:border-r border-zinc-200">
                                      {previewData.terms && (
                                        <div className="mb-4">
                                          <p className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-1">Contract Terms</p>
                                          <p onClick={() => document.getElementById('standalone-terms')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-xs text-zinc-500 leading-relaxed max-w-sm" title="Click to edit">
                                            {previewData.terms}
                                          </p>
                                        </div>
                                      )}
                                      {previewData.additionalNotes && (
                                        <div>
                                          <p className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-1">Notes</p>
                                          <p onClick={() => document.getElementById('standalone-additionalNotes')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-xs text-zinc-500 leading-relaxed max-w-sm" title="Click to edit">
                                            {previewData.additionalNotes}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="w-full md:w-72 p-6 bg-white space-y-3 font-mono">
                                      <div className="flex justify-between text-zinc-500">
                                        <span>Subtotal</span>
                                        <span>
                                          {getCurrencySymbol(previewData?.currency)}
                                          {Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </span>
                                      </div>
                                      {Number(previewData.discount || 0) > 0 && (
                                        <div className="flex justify-between text-red-500 font-bold">
                                          <span>Discount</span>
                                          <span>
                                            -{getCurrencySymbol(previewData?.currency)}
                                            {Number(previewData.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      )}
                                      {Number(previewData.taxRate || 0) > 0 && (
                                        <div className="flex justify-between text-zinc-500">
                                          <span>Tax ({previewData.taxRate}%)</span>
                                          <span>
                                            {getCurrencySymbol(previewData?.currency)}
                                            {(Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (Number(previewData.taxRate) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      )}
                                      {Number(previewData.amountPaid || 0) > 0 && (
                                        <div className="flex justify-between text-green-500 font-bold border-t border-zinc-100 pt-3">
                                          <span>Paid</span>
                                          <span>
                                            -{getCurrencySymbol(previewData?.currency)}
                                            {Number(previewData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-auto px-1">
                                    <div className="pt-6 border-t border-zinc-200 flex flex-wrap gap-4 items-center justify-between print:hidden">
                                      <div className="flex-1"></div>
                                      <div className="flex gap-2">
                                        {previewData.paymentLinks && Object.values(previewData.paymentLinks).some((v: any) => v.enabled) ? (
                                          <div className="flex gap-2">
                                            {previewData.paymentLinks.stripe?.enabled && previewData.paymentLinks.stripe?.url && (
                                              <a href={previewData.paymentLinks.stripe.url} target="_blank" rel="noreferrer" className="bg-[#635BFF] hover:bg-[#524be0] text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-all shadow-sm">
                                                Pay securely via Stripe
                                              </a>
                                            )}
                                            {previewData.paymentLinks.paypal?.enabled && previewData.paymentLinks.paypal?.url && (
                                              <a href={previewData.paymentLinks.paypal.url} target="_blank" rel="noreferrer" className="bg-[#00457C] hover:bg-[#003865] text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-all shadow-sm">
                                                Pay securely via PayPal
                                              </a>
                                            )}
                                          </div>
                                        ) : (
                                          <a href={"mailto:" + (previewData.senderEmail || 'hello@junedit.com') + "?subject=Payment%20Arrangement"} className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-all shadow-sm">
                                            Contact to Arrrange Payment
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                </div>
                              </div>
                            </div>
                          )}`;

let parts = code.split(detailedStart);
let part2 = parts[1].split(corporateStart);
part2[0] = "";
code = parts[0] + newDetailed + "\n                          " + corporateStart + part2.slice(1).join(corporateStart);
fs.writeFileSync('src/screens/Financials.tsx', code);
