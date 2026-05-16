const fs = require('fs');
const text = fs.readFileSync('src/screens/Financials.tsx', 'utf8');
const lines = text.split('\n');
let count = 0;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('text-center')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
    count++;
    if(count > 20) break;
  }
}
