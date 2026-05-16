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

    // Upgrading standard headers to super premium gradients
    modified = modified.replace(/text-white text-3xl/g, 'bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40 text-3xl');
    modified = modified.replace(/text-white text-2xl/g, 'bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40 text-2xl');
    modified = modified.replace(/text-[#F5F5F7] text-3xl/g, 'bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40 text-3xl');
    
    // Upgrading standard inputs and cards
    modified = modified.replace(/bg-[#1A1A1A]/g, 'bg-[#000000]/60');
    modified = modified.replace(/bg-[#151515]/g, 'bg-[#050505]/80');
    modified = modified.replace(/rounded-md/g, 'rounded-2xl');

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`God-level text upgrade applied: ${file}`);
    }
});
