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

    // Change red brand to Electric Indigo/Violet
    modified = modified.replace(/--brand-primary:\s*#[a-fA-F0-9]+;/g, '--brand-primary: #818cf8;');
    
    // Convert old red shadows to editor neon shadows
    modified = modified.replace(/rgba\(255,\s*59,\s*48/gi, 'rgba(129, 140, 248'); // 818cf8 = 129, 140, 248
    
    // Change font to Inter/JetBrains mono heavy vibe (if hardcoded)
    modified = modified.replace(/bg-\[#FF6961\]/gi, 'bg-[#a3b8cc]');
    modified = modified.replace(/text-\[#FF3B30\]/gi, 'text-[#818cf8]');
    modified = modified.replace(/bg-\[#FF3B30\]/gi, 'bg-[#818cf8]');
    modified = modified.replace(/border-\[#FF3B30\]/gi, 'border-[#818cf8]');
    
    modified = modified.replace(/border-\[#34C759\]/gi, 'border-[#34d399]'); // Neonic green
    modified = modified.replace(/text-\[#34C759\]/gi, 'text-[#34d399]'); 
    modified = modified.replace(/bg-\[#34C759\]/gi, 'bg-[#34d399]'); 
    modified = modified.replace(/rgba\(52,\s*199,\s*89/gi, 'rgba(52, 211, 153');
    
    modified = modified.replace(/text-\[#FF9500\]/gi, 'text-[#fbbf24]'); // Neon yellow
    modified = modified.replace(/bg-\[#FF9500\]/gi, 'bg-[#fbbf24]');
    modified = modified.replace(/border-\[#FF9500\]/gi, 'border-[#fbbf24]');
    
    // Fix buttons
    modified = modified.replace(/hover:bg-\[#FF6961\]/g, 'hover:bg-[#6366f1]');

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`Updated editor colors in ${file}`);
    }
});
