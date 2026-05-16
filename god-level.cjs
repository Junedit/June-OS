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

    // Upgrading typography colors for premium subdued look
    modified = modified.replace(/text-zinc-400/g, 'text-white/40');
    modified = modified.replace(/text-zinc-500/g, 'text-white/30');
    modified = modified.replace(/text-gray-400/g, 'text-white/40');
    modified = modified.replace(/text-gray-500/g, 'text-white/30');
    modified = modified.replace(/text-zinc-300/g, 'text-white/60');
    
    // Upgrading borders - find them globally to make it consistently premium
    modified = modified.replace(/border-zinc-800/g, 'border-white/[0.04]');
    modified = modified.replace(/border-zinc-700/g, 'border-white/[0.06]');
    
    // Convert generic shapes to luxurious roundings
    modified = modified.replace(/rounded-xl/g, 'rounded-2xl');
    modified = modified.replace(/rounded-md/g, 'rounded-xl');
    modified = modified.replace(/rounded-lg/g, 'rounded-2xl');

    // Upgrade tracking
    modified = modified.replace(/tracking-widest/g, 'tracking-[0.2em]');
    modified = modified.replace(/tracking-wider/g, 'tracking-widest');

    // Make Inputs God-Level
    modified = modified.replace(/bg-black border border-white\/\[0\.04\]/g, 'bg-[#000000]/40 border border-white/[0.05] shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]');

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`God-level upgrade applied: ${file}`);
    }
});
