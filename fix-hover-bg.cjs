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

    // Fix the "white tape" issue where bg-clip-text is conditionally applied but text-transparent is NOT conditionally applied
    modified = modified.replace(/group-hover:bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white\/40/g, 'group-hover:text-white');
    modified = modified.replace(/hover:bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white\/40/g, 'hover:text-white');

    // For Sidebar specifically, remove the bg-clip-text from Icons, etc.
    // In src/components/Sidebar.tsx, there's `isActive ? '... bg-clip-text text-transparent...' : ''`
    // We can just use a more generic text-white for Active states in Sidebar
    modified = modified.replace(/isActive \? 'scale-110 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white\/40' : 'group-hover:scale-110 group-hover:text-white\/80'/g, `isActive ? 'scale-110 text-white drop-shadow-[0_0_10px_rgba(255,59,48,0.8)]' : 'group-hover:scale-110 group-hover:text-white/80'`);
    modified = modified.replace(/isActive \? 'bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white\/40' : 'text-zinc-600 hover:text-white'/g, `isActive ? 'text-white drop-shadow-[0_0_10px_rgba(255,59,48,0.8)]' : 'text-zinc-600 hover:text-white'`);

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`Fixed in ${file}`);
    }
});
