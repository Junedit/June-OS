const fs = require('fs');

['src/screens/ProjectsBoard.tsx', 'src/screens/LeadsDashboard.tsx', 'src/screens/ClientPortal.tsx'].forEach(file => {
    if (!fs.existsSync(file)) return;
    let original = fs.readFileSync(file, 'utf8');
    let content = original;
    
    // soften borders
    content = content.replace(/!border-white\/20/g, '!border-white/[0.08]');
    content = content.replace(/border-white\/20/g, 'border-white/[0.08]');
    content = content.replace(/border-white\/30/g, 'border-white/[0.12]');
    
    // fix intense glows
    content = content.replace(/shadow-\[0_4px_24px_rgba\(255,255,255,0\.15\)\]/g, 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]');
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log("Updated", file);
    }
});
