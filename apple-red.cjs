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

    content = content.replace(/text-red-400/g, 'text-[#FF6961]');
    content = content.replace(/text-red-500/g, 'text-[#FF3B30]');
    content = content.replace(/text-red-600/g, 'text-[#D70015]');
    content = content.replace(/text-red-700/g, 'text-[#990000]');

    content = content.replace(/bg-red-400\/10/g, 'bg-[#FF6961]/10');
    content = content.replace(/bg-red-500\/10/g, 'bg-[#FF3B30]/10');
    content = content.replace(/bg-red-500\/20/g, 'bg-[#FF3B30]/20');
    content = content.replace(/bg-red-500\/5/g, 'bg-[#FF3B30]/5');
    content = content.replace(/bg-red-500/g, 'bg-[#FF3B30]');

    content = content.replace(/border-red-400\/20/g, 'border-[#FF6961]/20');
    content = content.replace(/border-red-500\/20/g, 'border-[#FF3B30]/20');
    content = content.replace(/border-red-500\/10/g, 'border-[#FF3B30]/10');
    content = content.replace(/border-red-500/g, 'border-[#FF3B30]');
    
    content = content.replace(/from-red-500\/5/g, 'from-[#FF3B30]/5');
    content = content.replace(/from-red-500/g, 'from-[#FF3B30]');

    content = content.replace(/text-\[\#FF3B30\] mb-2 font-black">(\s*)OPERATIONAL BLEED/g, 'text-[#FF3B30] mb-2 font-black drop-shadow-[0_4px_24px_rgba(255,59,48,0.15)]">$1OPERATIONAL BLEED');


    if (content !== original) {
        fs.writeFileSync(file, content);
    }
});
