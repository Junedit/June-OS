const fs = require('fs');
const path = 'src/screens/Financials.tsx';
let data = fs.readFileSync(path, 'utf8');

const anchorTop = `                          )}
                          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none">
                             <div className="text-[120px] font-black leading-none tracking-tighter mix-blend-overlay print:mix-blend-multiply">REC</div>`;

const anchorBottomStart = `                                 </p>
                              </div>
                            </div>
                         </div>

                       </div>`;

const otherTemplates = `
                         {invoiceTemplate === 'minimalist' && (
                           <div className="flex flex-col h-full bg-white text-zinc-900">
                             <div className="flex justify-between items-end border-b border-zinc-200 pb-8 mb-8">
                               <div>
                                 <h1 className="text-3xl font-light tracking-tight mb-1 text-black">Invoice</h1>
                                 <p className="text-sm text-zinc-500 font-mono mt-1">#{generatedInvoiceData.invoiceNumber}</p>
                                 <p className="text-sm text-zinc-500 mt-2">Due <span className="font-medium text-black">{generatedInvoiceData.dueDate || 'Upon Receipt'}</span></p>
                               </div>
                               <div className="text-right">
                                 <h2 className="font-bold text-lg text-black tracking-tight">JUNEDIT</h2>
                                 <p className="text-sm text-zinc-500 mt-1">hello@junedit.com</p>
                               </div>
                             </div>
                             
                             <div className="mb-12">
                               <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Bill To</p>
                               <p className="text-xl font-medium tracking-tight text-black">{generatedInvoiceData.clientName || 'Valued Client'}</p>
                               <p className="text-sm text-zinc-500 mt-1">{generatedInvoiceData.email}</p>
                             </div>

                             <div className="mb-12">
                               <div className="grid grid-cols-4 gap-4 text-xs font-semibold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-3 mb-4">
                                 <div className="col-span-3">Description</div>
                                 <div className="col-span-1 text-right">Amount</div>
                               </div>
                               <div className="grid grid-cols-4 gap-4 text-sm items-start border-b border-zinc-100 pb-8 mb-8">
                                 <div className="col-span-3 pb-8">
                                   <p className="font-medium text-black text-base">{generatedInvoiceData.desc}</p>
                                   <div className="mt-2 text-zinc-500">
                                      {generatedInvoiceData.format && <p className="mb-0.5">Format: {generatedInvoiceData.format}</p>}
                                      {generatedInvoiceData.revisions && <p>Revisions: {generatedInvoiceData.revisions}</p>}
                                   </div>
                                 </div>
                                 <div className="col-span-1 text-right font-medium text-black text-base">
                                   \${Number(generatedInvoiceData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                 </div>
                               </div>
                             </div>

                             <div className="mt-auto pt-8 border-t border-zinc-200 flex justify-between items-start">
                               <div className="max-w-md">
                                 {generatedInvoiceData.terms && (
                                   <>
                                     <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Terms</p>
                                     <p className="text-sm text-zinc-500 leading-relaxed">{generatedInvoiceData.terms}</p>
                                   </>
                                 )}
                               </div>
                               <div className="text-right w-64 space-y-3">
                                  <div className="flex justify-between text-sm text-zinc-500">
                                    <span>Subtotal</span>
                                    <span>\${Number(generatedInvoiceData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                  </div>
                                  <div className="flex justify-between text-sm text-green-600">
                                    <span>Amount Paid</span>
                                    <span>-\${Number(generatedInvoiceData.amountPaid || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xl font-medium tracking-tight text-black pt-3 border-t border-zinc-200">
                                    <span>Total Due</span>
                                    <span>\${Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                  </div>
                                  
                                  <div className="pt-4 print:hidden">
                                   {generatedInvoiceData.paymentLinks && Object.values(generatedInvoiceData.paymentLinks).some(v => v) ? (
                                     <div className="grid grid-cols-2 gap-2">
                                       {generatedInvoiceData.paymentLinks.stripe && <a href={generatedInvoiceData.paymentLinks.stripe} target="_blank" rel="noreferrer" className="flex justify-center items-center gap-2 bg-[#635BFF] text-white font-medium text-xs px-3 py-2 rounded hover:opacity-90 transition-opacity">Stripe</a>}
                                       {generatedInvoiceData.paymentLinks.paypal && <a href={generatedInvoiceData.paymentLinks.paypal} target="_blank" rel="noreferrer" className="flex justify-center items-center gap-2 bg-[#00457C] text-white font-medium text-xs px-3 py-2 rounded hover:opacity-90 transition-opacity">PayPal</a>}
                                       {generatedInvoiceData.paymentLinks.wise && <a href={generatedInvoiceData.paymentLinks.wise} target="_blank" rel="noreferrer" className="flex justify-center items-center gap-2 bg-[#9fe870] text-[#163300] font-medium text-xs px-3 py-2 rounded hover:opacity-90 transition-opacity">Wise</a>}
                                       {generatedInvoiceData.paymentLinks.custom && <a href={generatedInvoiceData.paymentLinks.custom} target="_blank" rel="noreferrer" className="flex justify-center items-center gap-2 bg-black text-white font-medium text-xs px-3 py-2 rounded hover:opacity-90 transition-opacity">Pay</a>}
                                     </div>
                                   ) : (
                                     <a href="mailto:hello@junedit.com?subject=Payment%20Arrangement" className="flex justify-center items-center text-center w-full bg-black text-white font-medium text-xs px-4 py-2.5 rounded hover:opacity-90 transition-opacity">
                                       Contact for Payment
                                     </a>
                                   )}
                                  </div>
                               </div>
                             </div>
                           </div>
                         )}

                         {invoiceTemplate === 'detailed' && (
                           <div className="flex flex-col h-full bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                             <div className="bg-zinc-900 text-white p-8 border-b border-zinc-800 md:p-12 flex justify-between items-center print:bg-white print:text-black print:border-b print:border-zinc-200">
                               <div>
                                 <h1 className="text-4xl font-serif mb-1 tracking-tight">Invoice</h1>
                                 <p className="text-sm opacity-80 print:text-zinc-500">Invoice Number: {generatedInvoiceData.invoiceNumber}</p>
                                 <p className="text-sm opacity-80 print:text-zinc-500 mt-1">Date Issued: {new Date().toLocaleDateString()}</p>
                                 <p className="text-sm opacity-80 print:text-zinc-500 mt-1">Due Date: {generatedInvoiceData.dueDate || 'Upon Receipt'}</p>
                               </div>
                               <div className="text-right">
                                 <h2 className="text-2xl font-bold tracking-tight">JUNEDIT</h2>
                                 <p className="text-sm opacity-80 print:text-zinc-500 mt-2">Director & Post-Production</p>
                                 <p className="text-sm opacity-80 print:text-zinc-500">hello@junedit.com</p>
                                 <p className="text-sm opacity-80 print:text-zinc-500">Los Angeles, CA</p>
                               </div>
                             </div>

                             <div className="p-8 md:p-12 flex-grow flex flex-col">
                               <div className="mb-10 bg-white p-6 rounded-lg border border-zinc-200 shadow-sm print:shadow-none">
                                 <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Invoice To:</h3>
                                 <p className="text-2xl font-semibold text-zinc-900 mb-1">{generatedInvoiceData.clientName || 'Valued Client'}</p>
                                 <p className="text-zinc-600">{generatedInvoiceData.email}</p>
                               </div>

                               <table className="w-full text-left mb-10 overflow-hidden rounded-lg border border-zinc-200 shadow-sm print:shadow-none bg-white">
                                 <thead className="bg-zinc-100 border-b border-zinc-200 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                   <tr>
                                     <th className="p-4">Description</th>
                                     <th className="p-4 text-right">Amount</th>
                                   </tr>
                                 </thead>
                                 <tbody className="bg-white text-zinc-900">
                                   <tr>
                                     <td className="p-4 border-b border-zinc-100">
                                       <p className="font-semibold text-base text-zinc-900 mb-1">{generatedInvoiceData.desc}</p>
                                       {generatedInvoiceData.format && <span className="inline-block bg-zinc-100 text-zinc-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider mr-2">Format: {generatedInvoiceData.format}</span>}
                                       {generatedInvoiceData.revisions && <span className="inline-block bg-zinc-100 text-zinc-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Revs: {generatedInvoiceData.revisions}</span>}
                                     </td>
                                     <td className="p-4 text-right font-medium text-lg border-b border-zinc-100 text-zinc-900">
                                       \${Number(generatedInvoiceData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                     </td>
                                   </tr>
                                   <tr>
                                      <td className="p-12 border-b border-zinc-100"></td>
                                      <td className="p-12 border-b border-zinc-100"></td>
                                   </tr>
                                 </tbody>
                                 <tfoot className="bg-zinc-50 text-zinc-900">
                                   <tr>
                                     <td className="p-4 text-right font-medium text-sm text-zinc-500">Subtotal</td>
                                     <td className="p-4 text-right font-medium text-base text-zinc-900">\${Number(generatedInvoiceData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                   </tr>
                                   <tr className="border-b border-zinc-200">
                                     <td className="p-4 text-right font-medium text-sm text-green-600">Payments Received</td>
                                     <td className="p-4 text-right font-medium text-base text-green-600">-\${Number(generatedInvoiceData.amountPaid || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                   </tr>
                                   <tr className="bg-zinc-200/50">
                                     <td className="p-6 text-right font-bold text-lg text-zinc-900 uppercase tracking-widest">Balance Due</td>
                                     <td className="p-6 text-right font-bold text-2xl text-zinc-900">
                                        \${Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                     </td>
                                   </tr>
                                 </tfoot>
                               </table>

                               <div className="mt-auto grid grid-cols-2 gap-8 text-zinc-900">
                                 <div>
                                   {generatedInvoiceData.terms && (
                                     <>
                                       <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Terms & Information</h4>
                                       <p className="text-sm text-zinc-600 leading-relaxed">{generatedInvoiceData.terms}</p>
                                     </>
                                   )}
                                 </div>
                                 <div className="print:hidden">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Payment Methods</h4>
                                    {generatedInvoiceData.paymentLinks && Object.values(generatedInvoiceData.paymentLinks).some(v => v) ? (
                                      <div className="flex flex-wrap gap-2">
                                        {generatedInvoiceData.paymentLinks.stripe && <a href={generatedInvoiceData.paymentLinks.stripe} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 font-medium text-sm px-4 py-2 rounded shadow-sm hover:bg-zinc-50 transition-colors">Stripe</a>}
                                        {generatedInvoiceData.paymentLinks.paypal && <a href={generatedInvoiceData.paymentLinks.paypal} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 font-medium text-sm px-4 py-2 rounded shadow-sm hover:bg-zinc-50 transition-colors">PayPal</a>}
                                        {generatedInvoiceData.paymentLinks.wise && <a href={generatedInvoiceData.paymentLinks.wise} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 font-medium text-sm px-4 py-2 rounded shadow-sm hover:bg-zinc-50 transition-colors">Wise</a>}
                                        {generatedInvoiceData.paymentLinks.custom && <a href={generatedInvoiceData.paymentLinks.custom} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-900 text-white font-medium text-sm px-4 py-2 rounded shadow-sm hover:bg-black transition-colors">Pay Now</a>}
                                      </div>
                                    ) : (
                                       <a href="mailto:hello@junedit.com?subject=Payment%20Arrangement" className="inline-block bg-zinc-900 text-white font-medium text-sm px-5 py-2.5 rounded shadow-sm hover:bg-black transition-colors">
                                         Contact for Payment
                                       </a>
                                    )}
                                 </div>
                               </div>
                             </div>
                           </div>
                         )}
`;

let topReplacement = `                          )}
                         {invoiceTemplate === 'branded' && (
                           <>
                          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none">
                             <div className="text-[120px] font-black leading-none tracking-tighter mix-blend-overlay print:mix-blend-multiply">REC</div>`;

let startIdx = data.indexOf(anchorTop);
if (startIdx > -1) {
    data = data.substring(0, startIdx) + topReplacement + data.substring(startIdx + anchorTop.length);
} else {
    console.log("Could not find start");
}

let endIdx = data.indexOf(anchorBottomStart);
if (endIdx > -1) {
    // replace anchorBottomStart with the bottom closing tag of <> and then other templates!
    data = data.substring(0, endIdx) + `                                 </p>
                              </div>
                            </div>
                         </div>
                         </>
                         )}` + otherTemplates + `\n\n                       </div>` + data.substring(endIdx + anchorBottomStart.length);
    fs.writeFileSync(path, data);
    console.log("Success");
} else {
    console.log("Could not find end");
}
