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
            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/hover:bg-red-700/g, 'hover:bg-[#FF6961]');
    content = content.replace(/hover:bg-red-600/g, 'hover:bg-[#FF6961]');
    content = content.replace(/bg-emerald-950/g, 'bg-[#34C759]/20');
    content = content.replace(/bg-red-950/g, 'bg-[#FF3B30]/20');

    if (content !== original) {
        fs.writeFileSync(file, content);
    }
});
