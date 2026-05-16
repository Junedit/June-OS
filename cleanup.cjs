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
            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let original = fs.readFileSync(file, 'utf8');
    let modified = original;

    // Upgrade inputs
    modified = modified.replace(/bg-\[#111\] border border-white\/\[0\.04\] p-3 rounded-lg text-xs/g, 'bg-black/50 border border-white/10 p-3 rounded-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-xs ring-0 focus:ring-1 focus:ring-white/20');
    
    modified = modified.replace(/bg-\[#111\] border border-white\/\[0\.04\]/g, 'bg-white/[0.02] border border-white/[0.05] rounded-2xl');
    modified = modified.replace(/bg-\[#0a0a0a\] border border-white\/\[0\.04\] shadow-2xl rounded-2xl/g, 'glass-panel rounded-2xl');
    modified = modified.replace(/bg-\[#0a0a0a\] border border-white\/\[0\.04\] shadow-\[0_20px_60px_-15px_rgba\(0,0,0,0\.8\)\]/g, 'glass-panel shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]');

    // Upgrade buttons
    modified = modified.replace(/shadow-\[0_0_20px_rgba\(255,255,255,0\.3\)\]/g, 'shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0');

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`Updated ${file}`);
    }
});
