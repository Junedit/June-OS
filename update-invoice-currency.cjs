const fs = require('fs');

let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// Add getCurrencySymbol above export default function Financials()
if (!content.includes('export const getCurrencySymbol')) {
  const insertStr = `
export const getCurrencySymbol = (currency?: string) => {
  switch(currency) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'CAD': return 'CA$';
    case 'AUD': return 'A$';
    case 'JPY': return '¥';
    case 'INR': return '₹';
    case 'USD':
    default: return '$';
  }
};
`;
  content = content.replace('export default function Financials() {', insertStr + '\nexport default function Financials() {');
}

// Add the currency field into standalone invoice form.
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

// Update the invoice payload gathering to include currency.
if (!content.includes("const currency = (document.getElementById('standalone-currency')")) {
  content = content.replace(
    /const clientPaymentLink = \(document\.getElementById\('standalone-clientPaymentLink'\) as HTMLInputElement\)\?\.value;/, 
    `const clientPaymentLink = (document.getElementById('standalone-clientPaymentLink') as HTMLInputElement)?.value;\n                       const currency = (document.getElementById('standalone-currency') as HTMLSelectElement)?.value || 'USD';`
  );
  
  content = content.replace(
    /template: invoiceTemplate \|\| 'branded',/, 
    `template: invoiceTemplate || 'branded',\n                            currency,`
  );
}

// Update rendering in invoice list.
// Find: ${Number(inv.amount || 0).toLocaleString()} <span className="text-xs text-zinc-600">(${Number(inv.amountPaid || 0).toLocaleString()} paid)
content = content.replace(
  /\$\{Number\(inv\.amount \|\| 0\)\.toLocaleString\(\)\} <span className="text-xs text-zinc-600">\(\$\{Number\(inv\.amountPaid \|\| 0\)\.toLocaleString\(\)} paid\)/g,
  `{getCurrencySymbol(inv.currency)}{Number(inv.amount || 0).toLocaleString()} <span className="text-xs text-zinc-600">({getCurrencySymbol(inv.currency)}{Number(inv.amountPaid || 0).toLocaleString()} paid)`
);

// We want to replace all hardcoded '$' that prefix `{Number(generatedInvoiceData...)}` or `{Math.max(0, ...)}` with `{getCurrencySymbol(generatedInvoiceData.currency)}`
content = content.replace(/\$\{Number\(generatedInvoiceData\./g, '{getCurrencySymbol(generatedInvoiceData.currency)}{Number(generatedInvoiceData.');
content = content.replace(/-\$\{Number\(generatedInvoiceData\./g, '-{getCurrencySymbol(generatedInvoiceData.currency)}{Number(generatedInvoiceData.');
content = content.replace(/\+\$\{/g, '+{getCurrencySymbol(generatedInvoiceData.currency)}{'); // For Tax 
content = content.replace(/\$\{Math\.max/g, '{getCurrencySymbol(generatedInvoiceData.currency)}{Math.max');

fs.writeFileSync('src/screens/Financials.tsx', content);
console.log('done currency replacements');
