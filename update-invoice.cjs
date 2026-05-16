const fs = require('fs');
let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// For Branded
let brandedTotalsRegex = /<div className="flex justify-between items-center py-4 border-b border-zinc-800 print:border-gray-200">[\s\S]*?<div className=\{"p-6 rounded-b-xl/m;
let brandedTotalsReplacement = `
                               <div className="flex justify-between items-center py-4 border-b border-zinc-800 print:border-gray-200">
                                  <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Subtotal</span>
                                  <span className="font-mono font-bold text-sm text-white print:text-black">\${Number(generatedInvoiceData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                               </div>
                               {Number(generatedInvoiceData.discount) > 0 && (
                                <div className="flex justify-between items-center py-3 border-b border-zinc-800 print:border-gray-200">
                                   <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest text-[#ff0000]">Discount</span>
                                   <span className="font-mono font-bold text-sm text-[#ff0000]">-\${Number(generatedInvoiceData.discount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                               )}
                               {Number(generatedInvoiceData.taxRate) > 0 && (
                                <div className="flex justify-between items-center py-3 border-b border-zinc-800 print:border-gray-200">
                                   <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Tax (\${generatedInvoiceData.taxRate}%)</span>
                                   <span className="font-mono font-bold text-sm">+\${(Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.discount || 0)) * (Number(generatedInvoiceData.taxRate) / 100)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                               )}
                               <div className="flex justify-between items-center py-3 border-b border-zinc-800 print:border-gray-200">
                                  <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Amount Paid</span>
                                  <span className="font-mono font-bold text-sm">-\${Number(generatedInvoiceData.amountPaid || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                               </div>
                               <div className={"p-6 rounded-b-xl`;

content = content.replace(brandedTotalsRegex, brandedTotalsReplacement);


// For Minimalist
let minimalistTotalsRegex = /<div className="flex justify-between py-2 border-b border-zinc-200 text-sm">[\s\S]*?<div className="flex justify-between py-4 text-xl font-medium tracking-tight text-black">/m;
let minimalistReplacement = `<div className="flex justify-between py-2 border-b border-zinc-200 text-sm">
                                      <span className="text-zinc-600">Subtotal</span>
                                    <span>\${Number(generatedInvoiceData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                    {Number(generatedInvoiceData.discount) > 0 && (
                                    <div className="flex justify-between py-2 border-b border-zinc-200 text-sm">
                                      <span className="text-zinc-600">Discount</span>
                                      <span className="text-red-600">-\${Number(generatedInvoiceData.discount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                    )}
                                    {Number(generatedInvoiceData.taxRate) > 0 && (
                                    <div className="flex justify-between py-2 border-b border-zinc-200 text-sm">
                                      <span className="text-zinc-600">Tax (\${generatedInvoiceData.taxRate}%)</span>
                                      <span>+\${(Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.discount || 0)) * (Number(generatedInvoiceData.taxRate) / 100)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                    )}
                                    <div className="flex justify-between py-2 border-b border-zinc-200 text-sm">
                                      <span className="text-zinc-600">Amount Paid</span>
                                    <span>-\${Number(generatedInvoiceData.amountPaid || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                    <div className="flex justify-between py-4 text-xl font-medium tracking-tight text-black">`;

content = content.replace(minimalistTotalsRegex, minimalistReplacement);

// For Detailed
let detailedTotalsRegex = /<tr className="bg-zinc-50 print:bg-gray-50 border-t border-zinc-200">[\s\S]*?<tr className="bg-zinc-100 print:bg-gray-100 border-t border-zinc-200">/m;
let detailedReplacement = `<tr className="bg-zinc-50 print:bg-gray-50 border-t border-zinc-200">
                                     <td colSpan={1} className="p-4 text-right font-semibold text-zinc-500 uppercase tracking-widest text-[10px]">Subtotal</td>
                                     <td className="p-4 text-right font-medium text-base text-zinc-900">\${Number(generatedInvoiceData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                   </tr>
                                   {Number(generatedInvoiceData.discount) > 0 && (
                                   <tr className="bg-zinc-50 print:bg-gray-50 border-t border-zinc-200">
                                     <td colSpan={1} className="p-4 text-right font-semibold text-zinc-500 uppercase tracking-widest text-[10px]">Discount</td>
                                     <td className="p-4 text-right font-medium text-base text-red-600">-\${Number(generatedInvoiceData.discount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                   </tr>
                                   )}
                                   {Number(generatedInvoiceData.taxRate) > 0 && (
                                   <tr className="bg-zinc-50 print:bg-gray-50 border-t border-zinc-200">
                                     <td colSpan={1} className="p-4 text-right font-semibold text-zinc-500 uppercase tracking-widest text-[10px]">Tax (\${generatedInvoiceData.taxRate}%)</td>
                                     <td className="p-4 text-right font-medium text-base text-zinc-900">+\${(Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.discount || 0)) * (Number(generatedInvoiceData.taxRate) / 100)).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                   </tr>
                                   )}
                                   <tr className="bg-zinc-50 print:bg-gray-50 border-t border-zinc-200">
                                     <td colSpan={1} className="p-4 text-right font-semibold text-zinc-500 uppercase tracking-widest text-[10px]">Amount Paid</td>
                                     <td className="p-4 text-right font-medium text-base text-green-600">-\${Number(generatedInvoiceData.amountPaid || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                   </tr>
                                   <tr className="bg-zinc-100 print:bg-gray-100 border-t border-zinc-200">`;

content = content.replace(detailedTotalsRegex, detailedReplacement);

// Replace total maths
// Branded balance
content = content.replace(
    `\${Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
    `\${Math.max(0, (Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.discount || 0)) * (1 + Number(generatedInvoiceData.taxRate || 0) / 100)) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`
);
content = content.replace(
    `\${Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
    `\${Math.max(0, (Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.discount || 0)) * (1 + Number(generatedInvoiceData.taxRate || 0) / 100)) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`
);
content = content.replace(
    `\${Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
    `\${Math.max(0, (Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.discount || 0)) * (1 + Number(generatedInvoiceData.taxRate || 0) / 100)) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`
);
content = content.replace(
    `\${Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
    `\${Math.max(0, (Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.discount || 0)) * (1 + Number(generatedInvoiceData.taxRate || 0) / 100)) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`
);
content = content.replace(
    `\${Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
    `\${Math.max(0, (Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.discount || 0)) * (1 + Number(generatedInvoiceData.taxRate || 0) / 100)) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`
);
content = content.replace(
    `\${Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
    `\${Math.max(0, (Math.max(0, Number(generatedInvoiceData.amount) - Number(generatedInvoiceData.discount || 0)) * (1 + Number(generatedInvoiceData.taxRate || 0) / 100)) - Number(generatedInvoiceData.amountPaid || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}`
);


fs.writeFileSync('src/screens/Financials.tsx', content);
console.log('done');
