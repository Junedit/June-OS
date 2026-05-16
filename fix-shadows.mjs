import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(fullPath));
        } else { 
            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix gold shadows to red shadows
    content = content.replace(/rgba\(212,184,134,([^)]+)\)/g, 'rgba(217,4,41,$1)');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log("Fixed shadow in", file);
    }
});
