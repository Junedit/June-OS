const fs = require('fs');
let code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const corporateStart = '{invoiceTemplate === "corporate" && (';
const creativeStart = '{invoiceTemplate === "creative" && (';
const endOfCreative = '</AnimatePresence>';

let newCorporate = `{invoiceTemplate === "corporate" && (
                            <div className="flex flex-col h-full bg-white text-slate-800 shadow-xl overflow-hidden rounded-xl border border-slate-200 print:shadow-none print:border-none print:rounded-none">
                              <div className="flex justify-between items-stretch border-b border-slate-200">
                                <div className="p-8 md:p-12 w-2/3">
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className="w-4 h-4 bg-[var(--brandColor)] rounded-sm print:border print:border-black print:bg-transparent"></div>
                                    <h2 onClick={() => document.getElementById('standalone-senderName')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity font-bold text-lg text-slate-900 tracking-tight uppercase" title="Click to edit">
                                        {previewData.senderName || "JUNEDIT"}
                                    </h2>
                                  </div>
                                  <h1 className="text-5xl font-light text-slate-900 mb-8 tracking-tighter">INVOICE</h1>
                                  <div className="grid grid-cols-2 gap-8 -mx-4 px-4">
                                    <div>
                                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5 font-mono">Invoice Number</p>
                                      <p className="text-sm font-medium text-slate-900">
                                        <span onClick={() => document.getElementById('standalone-invoice')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">{previewData.invoiceNumber}</span>
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5 font-mono">Date of Issue</p>
                                      <p className="text-sm font-medium text-slate-900">{new Date().toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-8 md:p-12 w-1/3 bg-slate-50 flex flex-col items-end text-right justify-between border-l border-slate-200 print:bg-white">
                                  {previewData.logoUrl ? (
                                    <div className="mb-4">
                                      <img src={previewData.logoUrl} alt="Logo" className="h-10 object-contain ml-auto print:h-8" />
                                    </div>
                                  ) : (
                                    <div className="p-4 bg-white border border-slate-200 rounded shadow-sm text-center w-full mb-4">
                                      <span className="font-bold tracking-widest uppercase text-xs text-slate-400">AGENCY LOGO</span>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-[10px] uppercase font-bold text-[var(--brandColor)] tracking-widest mb-1.5 font-mono transition-colors">Amount Due</p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">
                                        {getCurrencySymbol(previewData?.currency)}
                                        {Math.max(0, Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (1 + Number(previewData.taxRate || 0) / 100) - Number(previewData.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-2 font-mono">
                                      Due: <span onClick={() => document.getElementById('standalone-dueDate')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-slate-900" title="Click to edit">{previewData.dueDate || "Upon Receipt"}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex-grow flex flex-col">
                                <div className="flex justify-between items-start pt-10 pb-10 px-8 md:px-12 border-b border-slate-200 bg-white">
                                  <div className="w-1/2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono">Billed To</p>
                                    <p onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-2xl font-bold tracking-tight text-slate-900 mb-1" title="Click to edit">
                                      {previewData.clientName || "Valued Client"}
                                    </p>
                                    <p onClick={() => document.getElementById('standalone-email')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm text-slate-600" title="Click to edit">
                                      {previewData.email}
                                    </p>
                                  </div>
                                  <div className="w-1/2 text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono">From</p>
                                    <p className="text-sm font-semibold text-slate-900 mb-1">{previewData.senderName || "JUNEDIT"}</p>
                                    <p onClick={() => document.getElementById('standalone-senderEmail')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm text-slate-600" title="Click to edit">
                                      {previewData.senderEmail || 'hello@junedit.com'}
                                    </p>
                                  </div>
                                </div>

                                {previewData.welcomeMessage && (
                                  <div className="px-8 md:px-12 py-8 bg-slate-50 border-b border-slate-200 print:bg-white text-center">
                                    <p onClick={() => document.getElementById('standalone-welcomeMessage')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto" title="Click to edit">
                                      {previewData.welcomeMessage}
                                    </p>
                                  </div>
                                )}

                                <div className="p-8 md:px-12 py-10 flex-grow bg-white">
                                  <div className="flex text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b-2 border-slate-800 pb-3 mb-6 font-mono">
                                    <div className="w-3/4">Description</div>
                                    <div className="w-1/4 text-right">Amount</div>
                                  </div>
                                  
                                  <div className="flex items-start mb-12">
                                    <div className="w-3/4 pr-8">
                                      <p onClick={() => document.getElementById('standalone-desc')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity font-bold text-slate-900 text-lg mb-2" title="Click to edit">
                                        {previewData.desc}
                                      </p>
                                      <div className="flex gap-4 mt-2">
                                        {previewData.format && (
                                          <p className="text-xs text-slate-500"><span className="font-bold">Format:</span> {previewData.format}</p>
                                        )}
                                        {previewData.revisions && (
                                          <p className="text-xs text-slate-500"><span className="font-bold">Revisions:</span> {previewData.revisions}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="w-1/4 text-right font-medium text-lg text-slate-900 border-l border-slate-100 pl-4 py-2">
                                      {getCurrencySymbol(previewData?.currency)}
                                      <span onClick={() => document.getElementById('standalone-amount')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-slate-50 p-8 md:px-12 py-10 flex flex-col md:flex-row justify-between items-start border-t border-slate-200">
                                  <div className="w-full md:w-1/2 space-y-8 pr-8 mb-8 md:mb-0">
                                    {previewData.terms && (
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Terms</p>
                                        <p onClick={() => document.getElementById('standalone-terms')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-xs text-slate-600 leading-relaxed whitespace-pre-wrap" title="Click to edit">
                                          {previewData.terms}
                                        </p>
                                       </div>
                                    )}
                                    {previewData.additionalNotes && (
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Notes</p>
                                        <p onClick={() => document.getElementById('standalone-additionalNotes')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-xs text-slate-600 leading-relaxed whitespace-pre-wrap" title="Click to edit">
                                          {previewData.additionalNotes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="w-full md:w-80 bg-white p-6 border border-slate-200 rounded shadow-sm relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-1 h-full bg-[var(--brandColor)]"></div>
                                     <div className="space-y-4 mb-6">
                                       <div className="flex justify-between text-sm text-slate-600">
                                          <span>Subtotal</span>
                                          <span className="font-medium text-slate-900">
                                            {getCurrencySymbol(previewData?.currency)}
                                            {Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                          </span>
                                       </div>
                                       {Number(previewData.discount || 0) > 0 && (
                                          <div className="flex justify-between text-sm text-slate-600 border-t border-slate-100 pt-4">
                                             <span className="font-bold text-red-600">Discount</span>
                                             <span className="font-bold text-red-600">
                                                -{getCurrencySymbol(previewData?.currency)}
                                                {Number(previewData.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                             </span>
                                          </div>
                                       )}
                                       {Number(previewData.taxRate || 0) > 0 && (
                                          <div className="flex justify-between text-sm text-slate-600 border-t border-slate-100 pt-4">
                                             <span>Tax ({previewData.taxRate}%)</span>
                                             <span className="font-medium text-slate-900">
                                                {getCurrencySymbol(previewData?.currency)}
                                                {(Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (Number(previewData.taxRate) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                             </span>
                                          </div>
                                       )}
                                       {Number(previewData.amountPaid || 0) > 0 && (
                                          <div className="flex justify-between text-sm text-slate-600 border-t border-slate-100 pt-4">
                                             <span className="font-bold text-green-600">Paid Amount</span>
                                             <span className="font-bold text-green-600">
                                                -{getCurrencySymbol(previewData?.currency)}
                                                {Number(previewData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                             </span>
                                          </div>
                                       )}
                                     </div>
                                     <div className="flex justify-between items-end border-t-2 border-slate-800 pt-4">
                                       <span className="text-[10px] font-bold text-[var(--brandColor)] uppercase tracking-widest font-mono">Total</span>
                                       <span className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">
                                          {getCurrencySymbol(previewData?.currency)}
                                          {Math.max(0, Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (1 + Number(previewData.taxRate || 0) / 100) - Number(previewData.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                       </span>
                                     </div>
                                  </div>
                                </div>
                                
                                <div className="mt-auto px-12 py-6 bg-slate-900 flex justify-end print:hidden">
                                  {previewData.paymentLinks && Object.values(previewData.paymentLinks).some((v: any) => v.enabled) ? (
                                    <div className="flex gap-3">
                                      {previewData.paymentLinks.stripe?.enabled && previewData.paymentLinks.stripe?.url && (
                                        <a href={previewData.paymentLinks.stripe.url} target="_blank" rel="noreferrer" className="bg-[#635BFF] hover:bg-white hover:text-[#635BFF] text-white font-bold py-2.5 px-6 text-sm transition-all shadow border border-transparent hover:border-[#635BFF]">
                                          Pay with Stripe
                                        </a>
                                      )}
                                      {previewData.paymentLinks.paypal?.enabled && previewData.paymentLinks.paypal?.url && (
                                        <a href={previewData.paymentLinks.paypal.url} target="_blank" rel="noreferrer" className="bg-[#00457C] hover:bg-white hover:text-[#00457C] text-white font-bold py-2.5 px-6 text-sm transition-all shadow border border-transparent hover:border-[#00457C]">
                                          Pay with PayPal
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <a href={"mailto:" + (previewData.senderEmail || 'hello@junedit.com') + "?subject=Payment%20Arrangement"} className="bg-white hover:bg-slate-200 text-slate-900 font-bold py-2.5 px-6 text-sm transition-all shadow">
                                      Contact for Payment Options
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}`;

let newCreative = `{invoiceTemplate === "creative" && (
                            <div className="flex flex-col h-full bg-[#fdfbf7] text-stone-800 shadow-2xl relative overflow-hidden rounded-xl border border-orange-100 print:shadow-none print:border-none print:rounded-none">
                              {/* Background Art */}
                              <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-bl from-[var(--brandColor)] to-transparent opacity-[0.03] pointer-events-none rounded-bl-full"></div>
                              <div className="absolute top-10 left-10 w-64 h-64 border border-stone-200 rounded-full opacity-50 blur-sm pointer-events-none"></div>

                              <div className="relative p-12 md:p-16 flex justify-between items-start border-b border-orange-100/50 print:border-stone-200">
                                <div>
                                  <h1 className="text-6xl font-serif italic text-stone-900 tracking-tight pr-4">Invoice</h1>
                                  <div className="mt-6 space-y-1">
                                    <p className="text-sm font-semibold text-stone-800 uppercase tracking-widest"><span onClick={() => document.getElementById('standalone-invoice')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity bg-stone-100 px-2 py-1 rounded" title="Click to edit">{previewData.invoiceNumber}</span></p>
                                    <p className="text-xs text-stone-500 uppercase tracking-widest font-medium pt-1">
                                      Issued: {new Date().toLocaleDateString()}
                                    </p>
                                    <div className="pt-4 flex items-center gap-3">
                                      <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Due On</p>
                                      <p className="text-sm font-bold text-white bg-[var(--brandColor)] px-3 py-1 rounded-full shadow-sm">
                                        <span onClick={() => document.getElementById('standalone-dueDate')?.focus()} className="cursor-pointer hover:opacity-90 transition-opacity" title="Click to edit">{previewData.dueDate || "Upon Receipt"}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {previewData.logoUrl ? (
                                    <div className="mb-6 flex justify-end">
                                      <div className="bg-white p-3 rounded-2xl shadow-xl shadow-stone-200/50 rotate-3 float-animation">
                                        <img src={previewData.logoUrl} alt="Logo" className="h-14 object-contain print:h-10" />
                                      </div>
                                    </div>
                                  ) : (
                                    <h2 onClick={() => document.getElementById('standalone-senderName')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity font-black text-4xl text-stone-900 tracking-tighter uppercase mb-4 font-serif" title="Click to edit">
                                      {previewData.senderName || "JUNEDIT"}
                                    </h2>
                                  )}
                                  <p onClick={() => document.getElementById('standalone-senderEmail')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm text-stone-500 uppercase tracking-widest font-medium" title="Click to edit">
                                    {previewData.senderEmail || 'hello@junedit.com'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex-grow flex flex-col relative z-10">
                                {previewData.welcomeMessage && (
                                  <div className="px-12 md:px-16 pt-10">
                                    <p onClick={() => document.getElementById('standalone-welcomeMessage')?.focus()} className="cursor-pointer text-lg text-stone-600 leading-relaxed font-serif italic max-w-2xl border-l-4 border-[var(--brandColor)] pl-6 hover:opacity-70 transition-opacity" title="Click to edit">
                                      {previewData.welcomeMessage}
                                    </p>
                                  </div>
                                )}

                                <div className="p-12 md:p-16 flex flex-col md:flex-row justify-between items-start gap-12">
                                  <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-50 w-full md:w-1/2">
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Invoice Issued To</p>
                                    <p onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-3xl font-bold tracking-tight text-stone-900 mb-2 font-serif" title="Click to edit">
                                      {previewData.clientName || "Valued Client"}
                                    </p>
                                    <p onClick={() => document.getElementById('standalone-email')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-sm text-stone-500" title="Click to edit">
                                      {previewData.email}
                                    </p>
                                  </div>
                                  <div className="w-full md:w-1/2 flex justify-end">
                                    <div className="text-right">
                                      <p className="text-[10px] font-bold text-[var(--brandColor)] uppercase tracking-widest mb-4">Amount Due</p>
                                      <p className="text-5xl font-black text-stone-900 tracking-tighter tabular-nums drop-shadow-sm">
                                        {getCurrencySymbol(previewData?.currency)}
                                        {Math.max(0, Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (1 + Number(previewData.taxRate || 0) / 100) - Number(previewData.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="px-12 md:px-16 pb-12 flex-grow">
                                  <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-50">
                                    <table className="w-full text-left">
                                      <thead className="bg-[#fcfaf7]">
                                        <tr>
                                          <th className="py-6 px-8 text-xs font-bold uppercase tracking-widest text-stone-400 border-b border-orange-100">Project Specifics</th>
                                          <th className="py-6 px-8 text-right text-xs font-bold uppercase tracking-widest text-stone-400 border-b border-orange-100">Investment</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white">
                                        <tr>
                                          <td className="py-8 px-8 border-b border-orange-50">
                                            <p onClick={() => document.getElementById('standalone-desc')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity font-bold text-xl text-stone-800 mb-3 font-serif" title="Click to edit">
                                              {previewData.desc}
                                            </p>
                                            <div className="flex gap-3 mt-1">
                                              {previewData.format && (
                                                <span className="text-[10px] uppercase tracking-widest bg-stone-100 text-stone-500 font-bold px-3 py-1.5 rounded-full">
                                                  Format: {previewData.format}
                                                </span>
                                              )}
                                              {previewData.revisions && (
                                                <span className="text-[10px] uppercase tracking-widest bg-stone-100 text-stone-500 font-bold px-3 py-1.5 rounded-full">
                                                  Revisions: {previewData.revisions}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-8 px-8 text-right font-bold text-xl text-stone-900 border-b border-orange-50">
                                            {getCurrencySymbol(previewData?.currency)}
                                            <span onClick={() => document.getElementById('standalone-amount')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity" title="Click to edit">{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <div className="p-8 bg-[#fdfbf7] flex flex-col md:flex-row gap-8 items-start border-t border-orange-100">
                                       <div className="flex-1 space-y-6">
                                          {previewData.terms && (
                                            <div>
                                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span> Contract Terms
                                              </p>
                                              <p onClick={() => document.getElementById('standalone-terms')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-xs text-stone-600 leading-relaxed max-w-sm pl-3.5 border-l-2 border-stone-200" title="Click to edit">
                                                {previewData.terms}
                                              </p>
                                            </div>
                                          )}
                                          {previewData.additionalNotes && (
                                            <div>
                                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span> Additional Notes
                                              </p>
                                              <p onClick={() => document.getElementById('standalone-additionalNotes')?.focus()} className="cursor-pointer hover:opacity-70 transition-opacity text-xs text-stone-600 leading-relaxed max-w-sm pl-3.5 border-l-2 border-stone-200" title="Click to edit">
                                                {previewData.additionalNotes}
                                              </p>
                                            </div>
                                          )}
                                       </div>
                                       <div className="w-full md:w-80 space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-orange-50">
                                          <div className="flex justify-between text-sm text-stone-500 font-medium">
                                            <span>Subtotal</span>
                                            <span className="text-stone-900">
                                              {getCurrencySymbol(previewData?.currency)}
                                              {Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </span>
                                          </div>
                                          {Number(previewData.discount || 0) > 0 && (
                                            <div className="flex justify-between text-sm text-red-500 font-bold border-t border-orange-50 pt-3">
                                              <span>Discount</span>
                                              <span>
                                                -{getCurrencySymbol(previewData?.currency)}
                                                {Number(previewData.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                          )}
                                          {Number(previewData.taxRate || 0) > 0 && (
                                            <div className="flex justify-between text-sm text-stone-500 font-medium border-t border-orange-50 pt-3">
                                              <span>Taxes ({previewData.taxRate}%)</span>
                                              <span className="text-stone-900">
                                                {getCurrencySymbol(previewData?.currency)}
                                                {(Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (Number(previewData.taxRate) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                          )}
                                          {Number(previewData.amountPaid || 0) > 0 && (
                                            <div className="flex justify-between text-sm text-green-500 font-bold border-t border-orange-50 pt-3">
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
                                </div>

                                <div className="mt-auto px-12 md:px-16 py-8 border-t border-orange-100 flex flex-wrap gap-4 items-center justify-between bg-white print:hidden">
                                  <div className="font-serif italic text-stone-500 text-sm">
                                    Thank you for your business.
                                  </div>
                                  <div className="flex gap-3">
                                    {previewData.paymentLinks && Object.values(previewData.paymentLinks).some((v: any) => v.enabled) ? (
                                      <>
                                        {previewData.paymentLinks.stripe?.enabled && previewData.paymentLinks.stripe?.url && (
                                          <a href={previewData.paymentLinks.stripe.url} target="_blank" rel="noreferrer" className="bg-[#635BFF] hover:bg-[#524be0] text-white font-bold py-3 px-8 rounded-full text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#635BFF]/30">
                                            Pay w/ Stripe
                                          </a>
                                        )}
                                        {previewData.paymentLinks.paypal?.enabled && previewData.paymentLinks.paypal?.url && (
                                          <a href={previewData.paymentLinks.paypal.url} target="_blank" rel="noreferrer" className="bg-[#00457C] hover:bg-[#003865] text-white font-bold py-3 px-8 rounded-full text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#00457C]/30">
                                            Pay w/ PayPal
                                          </a>
                                        )}
                                      </>
                                    ) : (
                                      <a href={"mailto:" + (previewData.senderEmail || 'hello@junedit.com') + "?subject=Payment%20Arrangement"} className="bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-8 rounded-full text-xs uppercase tracking-widest transition-all shadow-lg">
                                        Request Payment Detail
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          </AnimatePresence>`;

let parts = code.split(corporateStart);
let part2 = parts[1].split(creativeStart);
let part3 = part2[1].split(endOfCreative);

code = parts[0] + newCorporate + "\n                          " + newCreative + "\n";
fs.writeFileSync('src/screens/Financials.tsx', code);
