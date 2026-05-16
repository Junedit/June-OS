const fs = require('fs');
const code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const scanTemplateEnd = (startString, endString) => {
   let idx = code.indexOf(startString);
   if (idx === -1) return;
   let endIdx = code.indexOf(endString, idx + 10);
   if (endIdx === -1) endIdx = code.length;
   
   const block = code.substring(idx, endIdx);
   const lines = block.split('\n');
   console.log(`\n\n--- ${startString}`);
   console.log(lines.slice(-60).join('\n'));
};

scanTemplateEnd('invoiceTemplate === "minimalist"', 'invoiceTemplate === "detailed"');
scanTemplateEnd('invoiceTemplate === "detailed"', 'invoiceTemplate === "corporate"');
scanTemplateEnd('invoiceTemplate === "corporate"', 'invoiceTemplate === "creative"');
scanTemplateEnd('invoiceTemplate === "creative" ||', ' invoiceTemplate === "corporate"');

