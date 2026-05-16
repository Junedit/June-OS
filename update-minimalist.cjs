const fs = require('fs');

let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// Minimalist Template Updates
content = content.replace(/<h2 className="text-xl font-medium tracking-tight">\s*JUNEDIT\s*<\/h2>/,
  '{generatedInvoiceData.logoUrl ? <img src={generatedInvoiceData.logoUrl} alt="Logo" className="h-10 object-contain ml-auto mb-2" /> : <h2 className="text-xl font-medium tracking-tight">{generatedInvoiceData.senderName || "JUNEDIT"}</h2>}');

content = content.replace(/<p className="text-sm text-zinc-500 mt-1">\s*Los Angeles, CA\s*<\/p>\s*<p className="text-sm text-zinc-500">\s*june@junedit.com\s*<\/p>/,
  '<p className="text-sm text-zinc-500 mt-1 whitespace-pre-wrap">{generatedInvoiceData.senderAddress || "Los Angeles, CA"}</p><p className="text-sm text-zinc-500">{generatedInvoiceData.email}</p>');

content = content.replace(/<span className="block text-black font-medium">\s*\{generatedInvoiceData\.clientName \|\|\s*generatedInvoiceData\.email\}\s*<\/span>\s*<span className="block mt-1">\s*Client Address\s*<\/span>\s*<span className="block">\s*City, State ZIP\s*<\/span>/,
  '<span className="block text-black font-medium">{generatedInvoiceData.clientName || generatedInvoiceData.email}</span>{generatedInvoiceData.clientAddress ? <span className="block mt-1 whitespace-pre-wrap">{generatedInvoiceData.clientAddress}</span> : null}');

content = content.replace(/\{generatedInvoiceData\.terms && \(\s*<div className="pt-8 border-t border-zinc-200 mt-8">\s*<h4/,
  `{generatedInvoiceData.notes && (<div className="pt-8 border-zinc-200 mt-8"><h4 className="text-sm font-medium text-black mb-2">Notes</h4><p className="text-sm text-zinc-500 whitespace-pre-wrap">{generatedInvoiceData.notes}</p></div>)} {generatedInvoiceData.terms && (<div className="pt-8 border-t border-zinc-200 mt-8"><h4`);

fs.writeFileSync('src/screens/Financials.tsx', content);
