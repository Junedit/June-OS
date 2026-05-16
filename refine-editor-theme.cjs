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

    // We'll standardize all background elements to true obsidian with ultra-fine borders.
    // Clean up older classes
    modified = modified.replace(/bg-\[#0A0A0A\]/g, 'bg-[#000000]');
    modified = modified.replace(/bg-[#080808]/g, 'bg-[#000000]');
    modified = modified.replace(/bg-white\/\[0\.04\]/g, 'bg-white/[0.02]');
    modified = modified.replace(/border-white\/10/g, 'border-white/[0.04]');
    modified = modified.replace(/border-white\/5/g, 'border-white/[0.02]');
    
    // Fix buttons inside components not using linear-button
    modified = modified.replace(/bg-\[var\(--brand-primary\)\] text-white hover:bg-\[#FF6961\]/g, 'bg-[#FF3B30] text-black hover:bg-[#FF453A]');
    modified = modified.replace(/bg-\[var\(--brand-primary\)\] text-white border-transparent/g, 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20 hover:bg-[#FF3B30]/20');
    
    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`Refined styling in ${file}`);
    }
});
