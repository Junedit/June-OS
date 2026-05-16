const fs = require('fs');

let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// Update branded template
content = content.replace(/<h2 className="font-black text-3xl tracking-tighter uppercase text-\[#ff0000\]">\s*JUNEDIT\s*<\/h2>/, 
  '{generatedInvoiceData.logoUrl ? <img src={generatedInvoiceData.logoUrl} alt="Logo" className="h-12 object-contain ml-auto mb-2" /> : <h2 className="font-black text-3xl tracking-tighter uppercase text-[#ff0000]">{generatedInvoiceData.senderName || "JUNEDIT"}</h2>}');

content = content.replace(/<p className="text-white print:text-gray-900 font-bold font-mono text-\[10px\] tracking-widest mt-1">\s*DIRECTOR & EDITOR\s*<\/p>/,
  '{generatedInvoiceData.senderName && <p className="text-white print:text-gray-900 font-bold font-mono text-[10px] tracking-widest mt-1">{!generatedInvoiceData.logoUrl ? "DIRECTOR & EDITOR" : generatedInvoiceData.senderName}</p>}');

content = content.replace(/<p className="text-zinc-500 print:text-gray-500 font-mono mt-1">\s*Los Angeles, CA\s*<br \/>\s*june@junedit\.com\s*<\/p>/,
  '<p className="text-zinc-500 print:text-gray-500 font-mono mt-1 whitespace-pre-wrap">{generatedInvoiceData.senderAddress || "Los Angeles, CA"}<br />{generatedInvoiceData.email}</p>');

// Update client address in branded
content = content.replace(/<p className="font-black text-xl tracking-tighter text-white uppercase print:text-black">\s*\{generatedInvoiceData\.clientName \|\| generatedInvoiceData\.email\}\s*<\/p>/,
  '<p className="font-black text-xl tracking-tighter text-white uppercase print:text-black">{generatedInvoiceData.clientName || generatedInvoiceData.email}</p>{generatedInvoiceData.clientAddress && <p className="text-sm font-mono text-zinc-400 mt-2 whitespace-pre-wrap">{generatedInvoiceData.clientAddress}</p>}');

// Add Notes block for branded
content = content.replace(/\{generatedInvoiceData\.terms && \(\s*<div className="mt-8">\s*<h4/,
  `{generatedInvoiceData.notes && (<div className="mt-8"><h4 className="text-xs font-bold tracking-widest text-[#ff0000] uppercase mb-2">Notes</h4><p className="text-sm font-mono text-zinc-400">{generatedInvoiceData.notes}</p></div>)} {generatedInvoiceData.terms && (<div className="mt-8"><h4`);

fs.writeFileSync('src/screens/Financials.tsx', content);
