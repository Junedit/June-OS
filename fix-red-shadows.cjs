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

    // Reset crazy red shadows to neutral glass shadows
    content = content.replace(/rgba\(255,0,0,([0-9.]+)\)/g, 'rgba(255,255,255,$1)');
    content = content.replace(/rgba\(255, 0, 0, ([0-9.]+)\)/g, 'rgba(255,255,255,$1)');
    content = content.replace(/rgba\(255,59,48,([0-9.]+)\)/g, 'rgba(255,255,255,$1)');
    content = content.replace(/rgba\(255, 59, 48, ([0-9.]+)\)/g, 'rgba(255,255,255,$1)');

    if (content !== original) {
        fs.writeFileSync(file, content);
    }
});
