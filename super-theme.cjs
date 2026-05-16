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

    // Remove the CSS definitions so we can replace them inline or cleanly
    modified = modified.replace(/bg-black\/40 border border-white\/5 shadow-\[inset_0_1px_1px_rgba\(255,255,255,0\.05\),0_8px_32px_rgba\(0,0,0,0\.8\)\]/g, 'glass-panel');
    modified = modified.replace(/backdrop-blur-3xl saturate-150 shadow-\[inset_0_1px_1px_rgba\(255,255,255,0\.05\),0_8px_32px_rgba\(0,0,0,0\.8\)\]/g, '');

    // Make backgrounds pure pitch black or ultra dark charcoal
    modified = modified.replace(/bg-\[#0A0A0A\]/g, 'bg-[#030303]');
    modified = modified.replace(/bg-\[#1C1C1E\]/g, 'bg-[#0A0A0A]');
    modified = modified.replace(/bg-black\/80/g, 'bg-black/60');
    
    // Replace typical zinc borders with sharp white/[0.08]
    modified = modified.replace(/border-zinc-800\/50/g, 'border-white/5');
    modified = modified.replace(/border-zinc-800\/30/g, 'border-white/5');
    modified = modified.replace(/border-zinc-800/g, 'border-white/10');
    modified = modified.replace(/border-zinc-900/g, 'border-white/5');
    
    // Convert common standard bg colors to translucent overlays
    modified = modified.replace(/bg-zinc-900\/50/g, 'bg-white/5');
    modified = modified.replace(/bg-zinc-900\/30/g, 'bg-white/[0.02]');
    modified = modified.replace(/bg-zinc-800\/20/g, 'bg-white/[0.04]');
    modified = modified.replace(/bg-zinc-900/g, 'bg-[#0A0A0A]');
    modified = modified.replace(/bg-zinc-800/g, 'bg-[#141414]');

    // Text refinements
    modified = modified.replace(/text-zinc-400/g, 'text-white/60');
    modified = modified.replace(/text-zinc-500/g, 'text-white/40');
    modified = modified.replace(/text-zinc-300/g, 'text-white/80');

    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`Upgraded cinematic theme in ${file}`);
    }
});
