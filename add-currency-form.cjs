const fs = require('fs');

let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const taxRateRegex = /<div>\s*<label className="text-\[10px\] uppercase font-mono text-zinc-500 tracking-widest mb-1\.5 block text-white\/50">Tax Rate \(%\)<\/label>/;

if (!content.includes('id="standalone-currency"')) {
  const currencyHTML = `                     <div>
                       <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">Currency</label>
                       <select id="standalone-currency" className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#ff0000] transition-colors font-mono">
                         <option value="USD">USD ($)</option>
                         <option value="EUR">EUR (€)</option>
                         <option value="GBP">GBP (£)</option>
                         <option value="CAD">CAD (CA$)</option>
                         <option value="AUD">AUD (A$)</option>
                         <option value="JPY">JPY (¥)</option>
                         <option value="INR">INR (₹)</option>
                       </select>
                     </div>
`;
  content = content.replace(taxRateRegex, currencyHTML + `                     <div>\n                       <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">Tax Rate (%)</label>`);
}

// Add to payload logic
const clientLinkRegex = /const clientPaymentLink = \(document\.getElementById\('standalone-clientPaymentLink'\) as HTMLInputElement\)\?\.value;/;
if (!content.includes("document.getElementById('standalone-currency')")) {
  content = content.replace(
    clientLinkRegex, 
    `const clientPaymentLink = (document.getElementById('standalone-clientPaymentLink') as HTMLInputElement)?.value;\n                       const currency = (document.getElementById('standalone-currency') as HTMLSelectElement)?.value || 'USD';`
  );
  
  content = content.replace(
    /template: invoiceTemplate \|\| 'branded',/, 
    `template: invoiceTemplate || 'branded',\n                            currency,`
  );
}

fs.writeFileSync('src/screens/Financials.tsx', content);
console.log('Added currency to form successfully!');
