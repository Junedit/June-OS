const fs = require('fs');
let c = fs.readFileSync('src/screens/Financials.tsx', 'utf-8');

c = c.replace(/<button onClick=\{\(\) => \{\n                            const invoiceNumber = \(document\.getElementById\('standalone-invoice'\) as HTMLInputElement\)\.value;[\s\S]*?<\/button>\n                   }\)/, `<button onClick={() => {
                           const emailElem = document.getElementById('standalone-email') as HTMLInputElement;
                           const descElem = document.getElementById('standalone-desc') as HTMLInputElement;
                           if (emailElem && descElem) {
                             const url = \`mailto:\${emailElem.value}?subject=\${encodeURIComponent(\`Invoice for \${descElem.value}\`)}&body=\${encodeURIComponent(generatedInvoiceText)}\`;
                             window.open(url);
                           }
                           setGeneratedInvoiceText('');
                         }} className="w-full bg-[#ff0000] hover:bg-[#ff3333] text-black font-bold uppercase tracking-widest text-xs px-4 py-3 rounded-lg transition-colors">
                           Send via Email
                         </button>
                       </div>
                    </div>
                  ) : (
                    <button disabled={generatingInvoice} onClick={async () => {
                       const invoiceNumber = (document.getElementById('standalone-invoice') as HTMLInputElement)?.value;
                       const email = (document.getElementById('standalone-email') as HTMLInputElement)?.value;
                       const clientName = (document.getElementById('standalone-clientName') as HTMLInputElement)?.value;
                       const amount = (document.getElementById('standalone-amount') as HTMLInputElement)?.value;
                       const desc = (document.getElementById('standalone-desc') as HTMLInputElement)?.value;
                       const format = (document.getElementById('standalone-format') as HTMLInputElement)?.value;
                       const revisions = (document.getElementById('standalone-revisions') as HTMLInputElement)?.value;
                       const dueDate = (document.getElementById('standalone-dueDate') as HTMLInputElement)?.value;
                       const terms = (document.getElementById('standalone-terms') as HTMLInputElement)?.value;
                       
                       if (!amount || !desc) {
                          alert("Please fill out Amount and Project Scope.");
                          return;
                       }
                       setGeneratingInvoice(true);
                       try {
                          let paymentLinks = undefined;
                          if (user) {
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
                          const invoiceBody = await generateStandaloneInvoiceText({
                            invoiceNumber, email, amount, description: desc, clientName, format, revisions, dueDate, terms
                          }, "Junedit", paymentLinks);
                          setGeneratedInvoiceText(invoiceBody);
                       } catch(e) {
                          console.error(e);
                          alert("Failed to generate AI invoice");
                       } finally {
                          setGeneratingInvoice(false);
                       }
                    }} className="w-full disabled:opacity-50 bg-[#ff0000]/10 hover:bg-[#ff0000]/20 text-[#ff0000] border border-[#ff0000]/20 text-xs px-4 py-3 rounded-lg font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                      <Receipt size={14} /> {generatingInvoice ? 'Generating Official Invoice...' : 'Generate AI Invoice'}
                    </button>
                  )}`);

fs.writeFileSync('src/screens/Financials.tsx', c);
console.log("Replaced!");
