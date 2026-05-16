const fs = require('fs');

let code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// 1. Branded Template: Upgrade signature font
code = code.replace(
  /<p className="text-lg font-serif italic text-zinc-300 mt-2">/g,
  '<p className="text-4xl text-zinc-200 mt-2" style={{ fontFamily: \'"Caveat", cursive\', transform: \'rotate(-4deg)\' }}>'
);


// 2. Minimalist Template: Add Signature
let minMatch = code.indexOf('                                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm min-w-[320px]">');
if(minMatch !== -1) {
  let sub = code.substring(0, minMatch);
  let lastDiv = sub.lastIndexOf('</div>');
  
  if (lastDiv !== -1) {
    let pre = code.substring(0, lastDiv);
    let post = code.substring(lastDiv);
    
    // Check if it already has signature
    if (!pre.includes("Authorized Signatory")) {
      code = pre + `
                                  <div className="pt-8">
                                    <div className="h-10 w-48 border-b-2 border-zinc-200 mb-2"></div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Authorized Signatory</p>
                                    <p className="text-4xl text-zinc-700" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-4deg)' }}>
                                      {previewData.senderName || "JUNEDIT"}
                                    </p>
                                  </div>
` + post;
    }
  }
}

// 3. Detailed Template: Check for Contract Terms and Add Signature
let detMatch = code.indexOf(`                                    <p className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-1">Contract Terms</p>`);
if(detMatch === -1) {
  // It already has terms! Line 2077
}

let detEndMatch = code.indexOf(`                                <div className="w-full md:w-80 space-y-4">`);
if(detEndMatch !== -1) {
  // Let's add the signature below the terms
  let termsDiv = code.indexOf(`</div>`, detEndMatch - 50); // Before the price box
}

// Just add signature directly below the pricing summaries for minimal, detailed, corporate, creative.

const addSignatureAfter = (templateName, afterText, color, textColor) => {
   let startIdx = code.indexOf(`invoiceTemplate === "${templateName}"`);
   if(startIdx === -1 && templateName === "creative") startIdx = code.indexOf(`invoiceTemplate === "${templateName}"`);
   if(startIdx === -1) return;
   
   let afterIdx = code.indexOf(afterText, startIdx);
   if(afterIdx !== -1) {
      // Find the closing div of afterText
      let insertIdx = afterIdx + afterText.length;
      
      let snippet = `
                                    <div className="mt-8 flex flex-col items-end">
                                        <div className="h-10 w-48 border-b-2 ${color} mb-2"></div>
                                        <p className="text-[10px] font-bold ${textColor} uppercase tracking-widest mb-1">Authorized Signatory</p>
                                        <p className="text-5xl ${textColor} opacity-90" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-5deg)' }}>
                                          {previewData.senderName || "JUNEDIT"}
                                        </p>
                                    </div>`;
      
      if (!code.substring(afterIdx - 200, afterIdx + 200).includes("Authorized Signatory")) {
        code = code.substring(0, insertIdx) + snippet + code.substring(insertIdx);
      }
   }
}

// Detailed ends pricing with <div className="flex justify-between text-zinc-500 font-bold border-t-2 border-zinc-800 pt-3 text-lg">...</div>
addSignatureAfter('detailed', 
  '{Math.max(0, Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (1 + Number(previewData.taxRate || 0) / 100) - Number(previewData.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>\n                                        </div>\n                                      </div>\n                                    </div>\n                                  </div>', 
  'border-zinc-300', 
  'text-zinc-600');

addSignatureAfter('corporate', 
  '{Math.max(0, Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (1 + Number(previewData.taxRate || 0) / 100) - Number(previewData.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}\n                                       </span>\n                                     </div>\n                                  </div>\n                                </div>', 
  'border-slate-300', 
  'text-slate-600');

addSignatureAfter('creative', 
  '{Math.max(0, Math.max(0, Number(previewData.amount) - Number(previewData.discount || 0)) * (1 + Number(previewData.taxRate || 0) / 100) - Number(previewData.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}\n                                            </span>\n                                          </div>\n                                        </div>\n                                    </div>\n                                  </div>\n                                </div>', 
  'border-stone-300', 
  'text-stone-600');


fs.writeFileSync('src/screens/Financials.tsx', code);
