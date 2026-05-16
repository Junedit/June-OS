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

    // Standardize deep blacks
    modified = modified.replace(/bg-\[#050505\]/g, 'bg-[#0A0A0A]');
    modified = modified.replace(/bg-\[#111\]/g, 'bg-[#141414]');
    modified = modified.replace(/bg-\[#111111\]/g, 'bg-[#141414]');
    modified = modified.replace(/bg-\[#151515\]/g, 'bg-[#1C1C1E]');
    modified = modified.replace(/bg-\[#1a1a1a\]/g, 'bg-[#1C1C1E]');
    modified = modified.replace(/bg-\[#181818\]/g, 'bg-[#1C1C1E]');

    // Standardize borders to be super crisp
    modified = modified.replace(/border-white\/\[0\.02\]/g, 'border-white/5');
    modified = modified.replace(/border-white\/\[0\.04\]/g, 'border-white/5');
    modified = modified.replace(/border-white\/\[0\.05\]/g, 'border-white/5');
    modified = modified.replace(/border-white\/\[0\.06\]/g, 'border-white/10');
    modified = modified.replace(/border-white\/\[0\.08\]/g, 'border-white/10');

    // Make text slightly crisper
    modified = modified.replace(/text-zinc-500/g, 'text-zinc-400'); // Higher contrast for readability

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`Updated theme in ${file}`);
    }
});
