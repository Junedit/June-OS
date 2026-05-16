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

    // Remove harsh borders and replace with subtle ones
    modified = modified.replace(/border-\[\#FF3B30\]\/20/g, 'border-white/[0.04]');
    modified = modified.replace(/border-\[\#FF3B30\]\/10/g, 'border-white/[0.02]');
    modified = modified.replace(/bg-black/g, 'bg-[#000000]');
    modified = modified.replace(/bg-\[\#0A0A0A\]/g, 'bg-[#000000]');
    modified = modified.replace(/bg-white\/\[0\.04\]/g, 'bg-white/[0.02]');
    
    // Elevate buttons and elements that were just basic
    modified = modified.replace(/bg-\[var\(--brand-primary\)\] text-white hover:bg-\[\#FF6961\]/g, 'bg-[#FF3B30] text-[#000000] font-bold hover:bg-[#FF453A]');
    modified = modified.replace(/text-4xl font-headline/g, 'text-4xl font-body tracking-tight');
    modified = modified.replace(/text-3xl font-headline/g, 'text-3xl font-body tracking-tight');
    modified = modified.replace(/text-2xl font-headline/g, 'text-2xl font-body tracking-tight');

    // Ensure layout margins are not crunched
    modified = modified.replace(/p-8/g, 'p-10');
    modified = modified.replace(/p-6/g, 'p-8');
    modified = modified.replace(/rounded-xl/g, 'rounded-2xl');
    modified = modified.replace(/rounded-lg/g, 'rounded-xl');

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`Upgraded premium layout in ${file}`);
    }
});
