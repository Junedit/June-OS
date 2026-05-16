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

    modified = modified.replace(/from-green-500 via-yellow-500 to-red-500/g, 'from-[#34C759] via-[#FFCC00] to-[#FF3B30]');
    modified = modified.replace(/text-green-500/g, 'text-[#34C759]');
    modified = modified.replace(/border-green-500/g, 'border-[#34C759]');
    modified = modified.replace(/bg-green-500/g, 'bg-[#34C759]');
    modified = modified.replace(/text-yellow-500/g, 'text-[#FFCC00]');
    modified = modified.replace(/text-orange-500/g, 'text-[#FF9500]');
    modified = modified.replace(/text-amber-500/g, 'text-[#FF9500]');
    modified = modified.replace(/bg-amber-500/g, 'bg-[#FF9500]');
    modified = modified.replace(/border-amber-500/g, 'border-[#FF9500]');
    modified = modified.replace(/text-red-500/g, 'text-[#FF3B30]');
    modified = modified.replace(/text-purple-500/g, 'text-[#AF52DE]');
    modified = modified.replace(/text-blue-500/g, 'text-[#007AFF]');

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`Updated gradients/colors in ${file}`);
    }
});
