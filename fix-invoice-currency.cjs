const fs = require('fs');

let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// Fix the incorrect replacement at line 257 (Lifetime Profit)
content = content.replace('{getCurrencySymbol(generatedInvoiceData.currency)}{Math.max(0, totalRevenue - totalExpenses).toLocaleString()}', '${Math.max(0, totalRevenue - totalExpenses).toLocaleString()}');

// Wait, let's double check if generatedInvoiceData? is needed to avoid ReferenceError when generatedInvoiceData is null.
// In the modal, we are doing {generatedInvoiceData && ...} so generatedInvoiceData won't be null inside the modal.
// But we should use generatedInvoiceData?.currency just in case to avoid any potential crashes.
content = content.replace(/generatedInvoiceData\.currency/g, 'generatedInvoiceData?.currency');

fs.writeFileSync('src/screens/Financials.tsx', content);
console.log('Fixed line 257 and optional chaining');
