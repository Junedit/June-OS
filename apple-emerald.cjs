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

    content = content.replace(/text-emerald-400/g, 'text-[#34C759]');
    content = content.replace(/text-emerald-500/g, 'text-[#34C759]');
    content = content.replace(/text-emerald-600/g, 'text-[#34C759]');
    content = content.replace(/text-emerald-700/g, 'text-[#34C759]');
    
    content = content.replace(/border-emerald-500\/20/g, 'border-[#34C759]/20');
    content = content.replace(/border-emerald-500\/10/g, 'border-[#34C759]/10');
    content = content.replace(/border-emerald-500/g, 'border-[#34C759]');
    content = content.replace(/border-emerald-400/g, 'border-[#34C759]');
    
    content = content.replace(/bg-emerald-500\/10/g, 'bg-[#34C759]/10');
    content = content.replace(/bg-emerald-500\/20/g, 'bg-[#34C759]/20');
    content = content.replace(/bg-emerald-500\/5/g, 'bg-[#34C759]/5');
    content = content.replace(/bg-emerald-500/g, 'bg-[#34C759]');

    content = content.replace(/from-emerald-500\/5/g, 'from-[#34C759]/5');
    content = content.replace(/from-emerald-500/g, 'from-[#34C759]');
    
    content = content.replace(/rgba\(16,185,129,/g, 'rgba(52,199,89,');

    if (content !== original) {
        fs.writeFileSync(file, content);
    }
});
