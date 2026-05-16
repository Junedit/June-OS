const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
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

    // Convert everything back to solid text-white to fix missing icons and weird clipping issues
    modified = modified.replace(/bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white\/40/g, 'text-zinc-100');

    // Remove duplicates
    modified = modified.replace(/text-zinc-100 text-3xl/g, 'text-zinc-100 text-3xl');

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`Reverted text gradients in ${file}`);
    }
});
