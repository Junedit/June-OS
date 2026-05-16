const fs = require('fs');

const content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');
const lines = content.split('\n');

const cleanLines = [
  ...lines.slice(0, 14),
  ...lines.slice(3399) // 3399 is index for line 3400 (export default function Financials)
];

const cleanContent = cleanLines.join('\n');
fs.writeFileSync('src/screens/Financials.tsx', cleanContent);
console.log('Restored clean Financials.tsx');
