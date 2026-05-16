const fs = require('fs');
const src = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// elements queried
const ids = [...new Set([...src.matchAll(/getElementById\(\s*[\"'](standalone-[^\"']+)[\"']/g)].map(m => m[1]))];

// elements in DOM
const present = [...new Set([...src.matchAll(/id=[\"'](standalone-[^\"']+)[\"']/g)].map(m => m[1]))];

console.log('Missing elements:', ids.filter(id => !present.includes(id)));
console.log('Extra elements:', present.filter(id => !ids.includes(id)));
