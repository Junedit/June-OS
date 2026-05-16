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

    // Red/Primary shadows
    modified = modified.replace(/bg-\[var\(--brand-primary\)\].*?shadow-\[0_4px_24px_rgba\(255,255,255,0\.15\)\]/g, (match) => {
        return match.replace('rgba(255,255,255,0.15)', 'rgba(255,59,48,0.3)');
    });
    modified = modified.replace(/bg-\[#FF3B30\].*?shadow-\[0_4px_24px_rgba\(255,255,255,0\.15\)\]/gi, (match) => {
        return match.replace('rgba(255,255,255,0.15)', 'rgba(255,59,48,0.3)');
    });

    // Green shadows
    modified = modified.replace(/bg-\[#34C759\].*?shadow-\[0_4px_24px_rgba\(255,255,255,0\.15\)\]/gi, (match) => {
        return match.replace('rgba(255,255,255,0.15)', 'rgba(52,199,89,0.3)');
    });

    // Orange/Yellow shadows
    modified = modified.replace(/bg-\[#FF9500\].*?shadow-\[0_4px_24px_rgba\(255,255,255,0\.15\)\]/gi, (match) => {
        return match.replace('rgba(255,255,255,0.15)', 'rgba(255,149,0,0.3)');
    });
    modified = modified.replace(/bg-\[#FFCC00\].*?shadow-\[0_4px_24px_rgba\(255,255,255,0\.15\)\]/gi, (match) => {
        return match.replace('rgba(255,255,255,0.15)', 'rgba(255,204,0,0.3)');
    });

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`Matched brand shadows in ${file}`);
    }
});
