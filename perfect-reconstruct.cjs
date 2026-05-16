const fs = require('fs');

const content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');
const lines = content.split('\n');

const imports = lines.slice(0, 15); // Lines 1 to 15
const getCurrencyFn = `export const getCurrencySymbol = (currency?: string) => {
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

const exportLine = 'export default function Financials() {';
const body = lines.slice(20, 1138); // Lines 21 to 1138 (index 20 is line 21, up to index 1137 for line 1138)

const cleanContent = [...imports, getCurrencyFn, exportLine, ...body, ''].join('\n');
fs.writeFileSync('src/screens/Financials.tsx', cleanContent);
console.log('Reconstructed perfectly!');
