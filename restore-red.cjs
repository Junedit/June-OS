const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(fullPath));
        } else { 
            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fixing [white] back to [var(--color-red)]
    content = content.replace(/\[white\]/g, '[var(--color-red)]');

    // Restore Buttons
    content = content.replace(/bg-white text-black hover:bg-\[var\(--color-red\)\]/g, 'bg-[var(--color-red)] text-white hover:bg-red-700');
    content = content.replace(/bg-white hover:bg-zinc-200 text-black/g, 'bg-[var(--color-red)] hover:bg-red-700 text-white');
    content = content.replace(/bg-white hover:text-black/g, 'bg-[var(--color-red)] hover:text-white');
    content = content.replace(/hover:bg-white text-black hover:text-white/g, 'hover:bg-[var(--color-red)] hover:text-white');
    content = content.replace(/bg-white text-black/g, 'bg-[var(--color-red)] text-white');
    
    // Fix shadowing
    content = content.replace(/shadow-\[0_4px_24px_rgba\(255,255,255,0\.05\)\]/g, 'shadow-[0_4px_24px_rgba(217,4,41,0.15)]');
    content = content.replace(/shadow-\[0_0_20px_rgba\(255,255,255,0\.1\)\]/g, 'shadow-[0_0_20px_rgba(217,4,41,0.3)]');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log("Restored red in", file);
    }
});
