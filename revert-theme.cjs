const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let original = fs.readFileSync(file, 'utf8');
    let modified = original;

    // Sidebar reverts
    modified = modified.replace(/bg-gradient-to-br from-\[#818cf8\] to-\[#c084fc\]/g, 'bg-gradient-to-br from-white via-zinc-200 to-zinc-400');
    modified = modified.replace(/text-black font-headline font-bold text-lg shadow-\[0_4px_24px_rgba\(129,140,248,0\.4\)\] group-hover:shadow-\[0_8px_32px_rgba\(192,132,252,0\.6\)\]/g, 'text-black font-headline font-bold text-lg shadow-[0_4px_24px_rgba(255,255,255,0.15)] group-hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)]');
    modified = modified.replace(/bg-gradient-to-r from-white to-\[#a3b8cc\]/g, 'bg-gradient-to-r from-white to-zinc-500');
    modified = modified.replace(/isActive \? 'bg-\[#818cf8\]\/20 text-\[#818cf8\] shadow-\[0_0_20px_rgba\(129,140,248,0\.2\)\] border border-\[#818cf8\]\/30' : 'text-white\/40 hover:text-white hover:bg-white\/5 border border-transparent'/g, "isActive ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'");
    modified = modified.replace(/isActive \? "bg-\[#818cf8\]\\\/20 text-\[#818cf8\] shadow-\\[0_0_20px_rgba\\(129,140,248,0\\.2\\)\\] border border-\\[#818cf8\\]\\\/30" : "text-white\\\/40 hover:text-white hover:bg-white\\\/5 border border-transparent"/g, "isActive ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'");

    // Undo editor colors
    modified = modified.replace(/--brand-primary:\s*#818cf8;/g, '--brand-primary: #FF3B30;');
    modified = modified.replace(/rgba\(\s*129,\s*140,\s*248/gi, 'rgba(255, 59, 48'); 
    modified = modified.replace(/bg-\[#a3b8cc\]/gi, 'bg-[#FF6961]');
    modified = modified.replace(/text-\[#818cf8\]/gi, 'text-[#FF3B30]');
    modified = modified.replace(/bg-\[#818cf8\]/gi, 'bg-[#FF3B30]');
    modified = modified.replace(/border-\[#818cf8\]/gi, 'border-[#FF3B30]');

    modified = modified.replace(/border-\[#34d399\]/gi, 'border-[#34C759]');
    modified = modified.replace(/text-\[#34d399\]/gi, 'text-[#34C759]'); 
    modified = modified.replace(/bg-\[#34d399\]/gi, 'bg-[#34C759]'); 
    modified = modified.replace(/rgba\(\s*52,\s*211,\s*153/gi, 'rgba(52, 199, 89');
    
    modified = modified.replace(/text-\[#fbbf24\]/gi, 'text-[#FF9500]');
    modified = modified.replace(/bg-\[#fbbf24\]/gi, 'bg-[#FF9500]');
    modified = modified.replace(/border-\[#fbbf24\]/gi, 'border-[#FF9500]');
    
    // Fix buttons
    modified = modified.replace(/hover:bg-\[#6366f1\]/g, 'hover:bg-[#FF6961]');

    // Let's also restore backgrounds from super-theme.cjs loosely using a generic back approach if possible
    // or just rely on CSS overrides
    
    // Undo App.tsx bg
    modified = modified.replace(/bg-\[#0ea5e9\] rounded-\[45%\] blur-\[150px\]/g, 'bg-[var(--brand-primary)] rounded-full blur-[150px]');
    modified = modified.replace(/bg-\[#a855f7\] rounded-full blur-\[180px\]/g, 'bg-white rounded-full blur-[160px]');
    modified = modified.replace(/bg-\[#818cf8\] rounded-\[40%\] blur-\[160px\]/g, 'bg-white rounded-full blur-[160px]');

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`Reverted theme in ${file}`);
    }
});
