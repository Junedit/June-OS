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

    content = content.replace(/#10b981/g, '#34C759');
    content = content.replace(/#3b82f6/g, '#007AFF');
    content = content.replace(/#3B82F6/g, '#007AFF');
    content = content.replace(/#EA0000/g, '#FF3B30');

    if (content !== original) {
        fs.writeFileSync(file, content);
    }
});
