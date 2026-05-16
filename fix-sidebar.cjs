const fs = require('fs');

let file = './src/components/Sidebar.tsx';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/bg-gradient-to-br from-white via-zinc-200 to-zinc-400/g, 'bg-gradient-to-br from-[#818cf8] to-[#c084fc]');
    content = content.replace(/text-black font-headline font-bold text-lg shadow-\[0_4px_24px_rgba\(255,255,255,0\.15\)\] group-hover:shadow-\[0_8px_32px_rgba\(255,255,255,0\.25\)\]/g, 'text-black font-headline font-bold text-lg shadow-[0_4px_24px_rgba(129,140,248,0.4)] group-hover:shadow-[0_8px_32px_rgba(192,132,252,0.6)]');
    content = content.replace(/bg-gradient-to-r from-white to-zinc-500/g, 'bg-gradient-to-r from-white to-[#a3b8cc]');
    
    // Make active sidebar link more neon
    content = content.replace(/isActive \? 'bg-white\/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white\/5'/g, "isActive ? 'bg-[#818cf8]/20 text-[#818cf8] shadow-[0_0_20px_rgba(129,140,248,0.2)] border border-[#818cf8]/30' : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'");
    
    fs.writeFileSync(file, content);
    console.log("Updated sidebar");
}
