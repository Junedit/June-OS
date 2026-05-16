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

    // Remove harsh solid backgrounds so the ambient background shines through
    modified = modified.replace(/bg-\[\#030303\]/g, 'bg-transparent');
    modified = modified.replace(/bg-black/g, 'bg-transparent');
    
    // Smooth hard headers
    modified = modified.replace(/bg-\[\#000000\]\/40 backdrop-blur-\[40px\] saturate-\[1\.8\]/g, 'bg-[#000000]/60 backdrop-blur-[80px] saturate-[2.0]');
    
    // Elevate titles
    modified = modified.replace(/text-zinc-100/g, 'bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40');
    
    // Change standard text to uppercase tracking-wide for absolute premium look
    modified = modified.replace(/text-zinc-500/g, 'text-white/40 font-mono tracking-widest uppercase');

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`God-level layout cleanup applied: ${file}`);
    }
});
