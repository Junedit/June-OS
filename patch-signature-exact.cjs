const fs = require('fs');
let code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// 1. Branded
// Replace the signature font
code = code.replace(
  /<p className="text-lg font-serif italic text-zinc-300 mt-2">\s*\{previewData\.senderName \|\| "JUNEDIT"\}\s*<\/p>/g,
  `<p className="text-6xl pt-2 opacity-90 text-zinc-200 mt-2" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-5deg)' }}>{previewData.senderName || "JUNEDIT"}</p>`
);

// 2. Minimalist
let minTarget = `<div className="flex justify-between items-end border-t-2 border-zinc-900 pt-4">
                                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Total Due</span>
                                    <span className="text-3xl font-black text-zinc-900 tabular-nums tracking-tighter">
                                      {getCurrencySymbol(previewData?.currency)}
                                      {Math.max(0, Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (1 + Number(previewData.taxRate || 0) / 100) - Number(previewData.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>
                              </div>`;
let minSig = `
                                  <div className="mt-12 flex flex-col items-end print:items-start md:items-end w-full">
                                      <div className="h-6 w-56 border-b-2 border-zinc-300 mb-2 opacity-60"></div>
                                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Authorized Signatory</p>
                                      <p className="text-6xl pt-2 text-zinc-800" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-5deg)' }}>
                                        {previewData.senderName || "JUNEDIT"}
                                      </p>
                                  </div>`;
code = code.replace(minTarget, minTarget + minSig);

// 3. Detailed
let detTarget = `<div className="flex justify-between text-green-500 font-bold border-t border-zinc-100 pt-3">
                                          <span>Paid</span>
                                          <span>
                                            -{getCurrencySymbol(previewData?.currency)}
                                            {Number(previewData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>`;
let detSig = `
                                <div className="mt-12 flex flex-col items-end w-full">
                                    <div className="h-6 w-56 border-b-2 border-zinc-300 mb-2 opacity-60"></div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Authorized Signatory</p>
                                    <p className="text-6xl pt-2 text-zinc-800" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-5deg)' }}>
                                      {previewData.senderName || "JUNEDIT"}
                                    </p>
                                </div>`;
code = code.replace(detTarget, detTarget + detSig);


// 4. Corporate
let corpTarget = `<div className="flex justify-between items-end border-t-2 border-slate-800 pt-4">
                                       <span className="text-[10px] font-bold text-[var(--brandColor)] uppercase tracking-widest font-mono">Total</span>
                                       <span className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">
                                          {getCurrencySymbol(previewData?.currency)}
                                          {Math.max(0, Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (1 + Number(previewData.taxRate || 0) / 100) - Number(previewData.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                       </span>
                                     </div>
                                  </div>
                                </div>`;
let corpSig = `
                                <div className="mt-12 flex flex-col items-end pb-8">
                                    <div className="h-6 w-56 border-b-2 border-slate-300 mb-2 opacity-60"></div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Authorized Signatory</p>
                                    <p className="text-6xl pt-2 text-slate-800" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-5deg)' }}>
                                      {previewData.senderName || "JUNEDIT"}
                                    </p>
                                </div>`;
code = code.replace(corpTarget, corpTarget + corpSig);


// 5. Creative
let creTarget = `<div className="flex justify-between text-sm text-green-500 font-bold border-t border-orange-50 pt-3">
                                              <span>Paid Remaining</span>
                                              <span>
                                                -{getCurrencySymbol(previewData?.currency)}
                                                {Number(previewData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                          )}
                                       </div>
                                    </div>
                                  </div>
                                </div>`;
let creSig = `
                                <div className="mt-12 mb-4 px-12 md:px-16 flex flex-col items-end">
                                    <div className="h-6 w-56 border-b-2 border-stone-300 mb-2 opacity-60 transform -skew-x-12"></div>
                                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 font-mono">Authorized Signatory</p>
                                    <p className="text-6xl pt-2 text-stone-800" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-5deg)' }}>
                                      {previewData.senderName || "JUNEDIT"}
                                    </p>
                                </div>`;
code = code.replace(creTarget, creTarget + creSig);

fs.writeFileSync('src/screens/Financials.tsx', code);
console.log("Patched file successfully.");
