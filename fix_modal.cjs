const fs = require('fs');
let c = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

c = c.replace(
  `} from 'lucide-react';`,
  `} from 'lucide-react';\nimport { motion, AnimatePresence } from 'framer-motion';`
);

const beforeInvoice = `                  </div>
                  {generatedInvoiceData ? (
                    <div className="flex flex-col gap-4">
                       <div id="invoice-print-area" className="w-full bg-[#f9f9f9] text-black p-12 rounded-xl font-sans print:p-0 print:bg-white relative overflow-hidden">`;

const afterInvoice = `                       <div className="grid grid-cols-2 gap-4">
                         <button onClick={() => {
                           const printContents = document.getElementById('invoice-print-area')?.innerHTML;
                           const originalContents = document.body.innerHTML;
                           if (printContents) {
                               document.body.innerHTML = printContents;
                               window.print();
                               document.body.innerHTML = originalContents;
                               window.location.reload(); // Reload to restore React app state correctly after modifying DOM
                           }
                         }} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest text-xs px-4 py-3 rounded-lg transition-colors">
                           Print / Save PDF
                         </button>
                         <button onClick={() => {
                           setGeneratedInvoiceData(null);
                         }} className="w-full bg-[#ff0000] hover:bg-[#ff3333] text-black font-bold uppercase tracking-widest text-xs px-4 py-3 rounded-lg transition-colors">
                           Close
                         </button>
                       </div>
                    </div>
                  ) : (`;

c = c.replace(beforeInvoice, `                  </div>
                  
                  {/* The Preview & Send Button */}
                  <br/>
                  <button disabled={generatingInvoice} onClick={async () => {
                       const invoiceNumber = (document.getElementById('standalone-invoice') as HTMLInputElement)?.value;
                       const email = (document.getElementById('standalone-email') as HTMLInputElement)?.value;
                       const clientName = (document.getElementById('standalone-clientName') as HTMLInputElement)?.value;
                       const amount = (document.getElementById('standalone-amount') as HTMLInputElement)?.value;
                       const amountPaid = (document.getElementById('standalone-amountPaid') as HTMLInputElement)?.value;
                       const desc = (document.getElementById('standalone-desc') as HTMLInputElement)?.value;
                       const format = (document.getElementById('standalone-format') as HTMLInputElement)?.value;
                       const revisions = (document.getElementById('standalone-revisions') as HTMLInputElement)?.value;
                       const dueDate = (document.getElementById('standalone-dueDate') as HTMLInputElement)?.value;
                       const terms = (document.getElementById('standalone-terms') as HTMLInputElement)?.value;
                       const clientPaymentLink = (document.getElementById('standalone-clientPaymentLink') as HTMLInputElement)?.value;
                       
                       if (!amount || !desc) {
                          alert("Please fill out Amount, and Project Scope.");
                          return;
                       }
                       setGeneratingInvoice(true);
                       try {
                          let paymentLinks = undefined;
                          if (clientPaymentLink) {
                             paymentLinks = { custom: clientPaymentLink };
                          } else if (user) {
                             const docSnap = await getDoc(doc(db, 'settings', user.uid));
                             if (docSnap.exists()) {
                               const data = docSnap.data();
                               paymentLinks = {
                                 stripe: data.stripeLink,
                                 paypal: data.paypalLink,
                                 wise: data.wiseLink,
                                 custom: data.paymentLink
                               };
                             }
                          }
                          setGeneratedInvoiceData({
                            invoiceNumber, email, amount, amountPaid, desc, clientName, format, revisions, dueDate, terms, paymentLinks
                          });
                       } catch(e) {
                          console.error(e);
                          alert("Failed to generate invoice overview.");
                       } finally {
                          setGeneratingInvoice(false);
                       }
                  }} className="w-full disabled:opacity-50 bg-[#ff0000] hover:bg-[#ff3333] text-black text-xs px-4 py-4 rounded-lg font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 mb-4">
                     <Receipt size={16} /> {generatingInvoice ? 'Processing...' : 'Preview & Send Invoice'}
                  </button>

                  <AnimatePresence>
                  {generatedInvoiceData && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white"
                    >
                      <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.95 }}
                        className="bg-[#0f0f0f] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:w-full print:h-auto print:max-h-none print:border-none print:bg-white print:block"
                      >
                       <div className="flex justify-between items-center p-4 border-b border-zinc-800 print:hidden shrink-0 bg-black">
                         <h3 className="text-white font-bold font-mono uppercase tracking-widest text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#ff0000] animate-pulse"></span>
                            Official Invoice Preview
                         </h3>
                         <div className="flex gap-2">
                           <button onClick={() => {
                             const printContents = document.getElementById('invoice-print-area')?.innerHTML;
                             const originalContents = document.body.innerHTML;
                             if (printContents) {
                                 document.body.innerHTML = printContents;
                                 window.print();
                                 document.body.innerHTML = originalContents;
                                 window.location.reload(); 
                             }
                           }} className="bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest text-[10px] px-3 py-2 rounded transition-colors flex items-center gap-1">
                             <span className="hidden sm:inline">Print / Save PDF</span>
                             <span className="sm:hidden">Print</span>
                           </button>
                           <button onClick={() => {
                              window.location.href = \`mailto:\${generatedInvoiceData.email}?subject=Invoice%20\${generatedInvoiceData.invoiceNumber}%20from%20JUNEDIT&body=Please%20find%20attached%20invoice%20\${generatedInvoiceData.invoiceNumber}.\`;
                           }} className="bg-[#ff0000]/20 hover:bg-[#ff0000]/40 text-[#ff0000] font-bold uppercase tracking-widest text-[10px] px-3 py-2 rounded transition-colors flex items-center gap-1">
                             <span className="hidden sm:inline">Send via Email</span>
                             <span className="sm:hidden">Email</span>
                           </button>
                           <button onClick={() => setGeneratedInvoiceData(null)} className="p-2 text-zinc-400 hover:text-white transition-colors bg-white/5 rounded hover:bg-white/10">
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                           </button>
                         </div>
                       </div>
                       
                       <div className="p-6 md:p-12 overflow-y-auto no-scrollbar print:p-0 print:overflow-visible">
                         <div id="invoice-print-area" className="w-full bg-[#f9f9f9] text-black w-full max-w-3xl mx-auto p-12 rounded-xl font-sans print:p-0 print:bg-white relative overflow-hidden shadow-2xl print:shadow-none min-h-[800px]">`);

const remainingContent = `                       <button disabled={generatingInvoice} onClick={async () => {
                       const invoiceNumber = (document.getElementById('standalone-invoice') as HTMLInputElement)?.value;
                       const email = (document.getElementById('standalone-email') as HTMLInputElement)?.value;
                       const clientName = (document.getElementById('standalone-clientName') as HTMLInputElement)?.value;
                       const amount = (document.getElementById('standalone-amount') as HTMLInputElement)?.value;
                       const amountPaid = (document.getElementById('standalone-amountPaid') as HTMLInputElement)?.value;
                       const desc = (document.getElementById('standalone-desc') as HTMLInputElement)?.value;
                       const format = (document.getElementById('standalone-format') as HTMLInputElement)?.value;
                       const revisions = (document.getElementById('standalone-revisions') as HTMLInputElement)?.value;
                       const dueDate = (document.getElementById('standalone-dueDate') as HTMLInputElement)?.value;
                       const terms = (document.getElementById('standalone-terms') as HTMLInputElement)?.value;
                       const clientPaymentLink = (document.getElementById('standalone-clientPaymentLink') as HTMLInputElement)?.value;
                       
                       if (!amount || !desc) {
                          alert("Please fill out Amount, and Project Scope.");
                          return;
                       }
                       setGeneratingInvoice(true);
                       try {
                          let paymentLinks = undefined;
                          if (clientPaymentLink) {
                             paymentLinks = { custom: clientPaymentLink };
                          } else if (user) {
                             const docSnap = await getDoc(doc(db, 'settings', user.uid));
                             if (docSnap.exists()) {
                               const data = docSnap.data();
                               paymentLinks = {
                                 stripe: data.stripeLink,
                                 paypal: data.paypalLink,
                                 wise: data.wiseLink,
                                 custom: data.paymentLink
                               };
                             }
                          }
                          setGeneratedInvoiceData({
                            invoiceNumber, email, amount, amountPaid, desc, clientName, format, revisions, dueDate, terms, paymentLinks
                          });
                       } catch(e) {
                          console.error(e);
                          alert("Failed to generate AI invoice");
                       } finally {
                          setGeneratingInvoice(false);
                       }
                    }} className="w-full disabled:opacity-50 bg-[#ff0000]/10 hover:bg-[#ff0000]/20 text-[#ff0000] border border-[#ff0000]/20 text-xs px-4 py-3 rounded-lg font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                      <Receipt size={14} /> {generatingInvoice ? 'Generating Invoice...' : 'Generate Official Invoice'}
                    </button>
                  )}`;

const newEnd = `                            </div>
                          </div>
                       </div>
                    </motion.div>
                  </motion.div>
                  )}
                  </AnimatePresence>`;

c = c.replace(afterInvoice + "\n" + remainingContent, newEnd);
// Handle case if there was spacing differences
if (c.includes(afterInvoice)) {
  console.log("Failed to fully replace. Debugging..");
} else {
  let lines = c.split('\\n');
  fs.writeFileSync('src/screens/Financials.tsx', c);
  console.log("Success");
}
