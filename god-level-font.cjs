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

    // Convert font-headline to a more refined font-body tracking-tight
    modified = modified.replace(/font-headline/g, 'font-body tracking-tight');
    
    // Some titles have tracking-tighter, let's change to tracking-tight
    modified = modified.replace(/tracking-tighter/g, 'tracking-[0.02em]');

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`God-level text class cleanup applied: ${file}`);
    }
});
