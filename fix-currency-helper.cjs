const fs = require('fs');

let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

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

fs.writeFileSync('src/screens/Financials.tsx', content);
console.log('Added missing function getCurrencySymbol');
