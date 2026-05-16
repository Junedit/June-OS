const fs = require('fs');

const files = [
    'src/screens/PublicContractView.tsx',
    'src/screens/Contracts.tsx',
    'src/screens/Financials.tsx',
    'src/screens/Outreach.tsx',
    'src/screens/LeadsDashboard.tsx',
    'src/screens/Trends.tsx'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let original = fs.readFileSync(file, 'utf8');
    let content = original;
    
    // Fix pure blues and bright backgrounds
    content = content.replace(/hover:bg-blue-700/g, 'hover:bg-[#FF6961]');
    content = content.replace(/bg-blue-50 /g, 'bg-[#1C1C1E] ');
    content = content.replace(/border-blue-200/g, 'border-white/10');
    content = content.replace(/bg-blue-100/g, 'bg-[#252525]');
    content = content.replace(/text-zinc-300 rounded-full flex items-center justify-center/g, 'text-zinc-300 rounded-full flex items-center justify-center border border-white/10');

    // Remove odd purples and indigos from LeadsDashboard
    content = content.replace(/bg-purple-950\/10/g, 'bg-[#AF52DE]/10');
    content = content.replace(/bg-purple-950/g, 'bg-[#AF52DE]/20');
    content = content.replace(/bg-blue-950\/10/g, 'bg-[#007AFF]/10');
    content = content.replace(/bg-blue-950\/20/g, 'bg-[#007AFF]/10');
    content = content.replace(/bg-pink-950\/10/g, 'bg-[#FF2D55]/10');
    content = content.replace(/bg-indigo-950\/10/g, 'bg-[#5E5CE6]/10');
    
    // Outreach colors
    content = content.replace(/text-blue-400 mt-2 font-mono uppercase tracking-widest bg-blue-500\/10/g, 'text-[#007AFF] mt-2 font-mono uppercase tracking-widest bg-[#007AFF]/10');
    content = content.replace(/text-purple-400 mt-2 font-mono uppercase tracking-widest bg-purple-500\/10/g, 'text-[#AF52DE] mt-2 font-mono uppercase tracking-widest bg-[#AF52DE]/10');
    
    // Fix Financials blue box
    content = content.replace(/bg-blue-100 flex items-center/g, 'bg-[#1C1C1E] border border-white/5 flex items-center');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log("Cleaned tailwind generic colors from", file);
    }
});
