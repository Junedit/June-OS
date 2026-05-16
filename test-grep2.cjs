const fs = require('fs');
const code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const scanTemplateEnd = (name) => {
   let idx = code.indexOf(`invoiceTemplate === "${name}" && (`);
   if (idx === -1) idx = code.indexOf(`invoiceTemplate === '${name}' && (`);
   
   if (idx === -1) {
     let comb = `(invoiceTemplate === "creative" || invoiceTemplate === "corporate") && (`;
     idx = code.indexOf(comb);
   }

   if (idx === -1) return;
   
   let endIdx = code.indexOf(`invoiceTemplate ===`, idx + 100);
   if (endIdx === -1) endIdx = code.indexOf(`(invoiceTemplate ===`, idx + 100);
   if (endIdx === -1) endIdx = code.lastIndexOf('</AnimatePresence>');
   
   const block = code.substring(idx, endIdx);
   const lines = block.split('\n');
   console.log(`\n\n--- ${name} ---`);
   console.log(lines.slice(-50).join('\n'));
};

scanTemplateEnd('branded');
scanTemplateEnd('minimalist');
scanTemplateEnd('detailed');
scanTemplateEnd('corporate');
scanTemplateEnd('creative');
