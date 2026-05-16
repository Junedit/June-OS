const fs = require('fs');
const src = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const startIdx = src.indexOf('<section className="bg-black border border-zinc-900 rounded-xl p-2 relative">');
const endIdx = src.indexOf('<section className="bg-black border border-zinc-900 rounded-xl p-2">', startIdx);
if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find bounds");
    process.exit(1);
}

console.log("Found bounds", startIdx, endIdx);
