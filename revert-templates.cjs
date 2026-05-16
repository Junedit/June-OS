const fs = require('fs');

let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// Revert branded template
content = content.replace(/\{generatedInvoiceData\.logoUrl \? <img src=\{generatedInvoiceData\.logoUrl\}[^>]+ \/> : <h2[^>]*>\{generatedInvoiceData\.senderName \|\| "JUNEDIT"\}<\/h2>\}/, 
  '<h2 className="font-black text-3xl tracking-tighter uppercase text-[#ff0000]">JUNEDIT</h2>');

content = content.replace(/\{generatedInvoiceData\.senderName && <p[^>]*>\{\!generatedInvoiceData\.logoUrl \? "DIRECTOR & EDITOR" : generatedInvoiceData\.senderName\}<\/p>\}/,
  '<p className="text-white print:text-gray-900 font-bold font-mono text-[10px] tracking-widest mt-1">DIRECTOR & EDITOR</p>');

content = content.replace(/<p className="text-zinc-500 print:text-gray-500 font-mono mt-1 whitespace-pre-wrap">\{generatedInvoiceData\.senderAddress \|\| "Los Angeles, CA"\}<br \/>\{generatedInvoiceData\.email\}<\/p>/,
  '<p className="text-zinc-500 print:text-gray-500 font-mono mt-1">Los Angeles, CA<br />{generatedInvoiceData.email}</p>');

content = content.replace(/<p className="font-black text-xl tracking-tighter text-white uppercase print:text-black">\{generatedInvoiceData\.clientName \|\| generatedInvoiceData\.email\}<\/p>\{generatedInvoiceData\.clientAddress && <p[^>]*>\{generatedInvoiceData\.clientAddress\}<\/p>\}/,
  '<p className="font-black text-xl tracking-tighter text-white uppercase print:text-black">{generatedInvoiceData.clientName || generatedInvoiceData.email}</p>');


// Revert minimalist template
content = content.replace(/\{generatedInvoiceData\.logoUrl \? <img src=\{generatedInvoiceData\.logoUrl\}[^>]+ \/> : <h2[^>]*>\{generatedInvoiceData\.senderName \|\| "JUNEDIT"\}<\/h2>\}/,
  '<h2 className="text-xl font-medium tracking-tight">JUNEDIT</h2>');

content = content.replace(/<p className="text-sm text-zinc-500 mt-1 whitespace-pre-wrap">\{generatedInvoiceData\.senderAddress \|\| "Los Angeles, CA"\}<\/p><p className="text-sm text-zinc-500">\{generatedInvoiceData\.email\}<\/p>/,
  '<p className="text-sm text-zinc-500 mt-1">Los Angeles, CA</p><p className="text-sm text-zinc-500">{generatedInvoiceData.email}</p>');

content = content.replace(/<span className="block text-black font-medium">\{generatedInvoiceData\.clientName \|\| generatedInvoiceData\.email\}<\/span>\{generatedInvoiceData\.clientAddress \? <span[^>]*>\{generatedInvoiceData\.clientAddress\}<\/span> : null\}/,
  '<span className="block text-black font-medium">{generatedInvoiceData.clientName || generatedInvoiceData.email}</span><span className="block mt-1">Client Address</span><span className="block">City, State ZIP</span>');

fs.writeFileSync('src/screens/Financials.tsx', content);
