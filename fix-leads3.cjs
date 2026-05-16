const fs = require('fs');
let src = fs.readFileSync('src/screens/LeadsDashboard.tsx', 'utf8');

src = src.replace('  masterFileUrl?: string;\n  id: string;', '  masterFileUrl?: string;\n  reviewVideoUrl?: string;\n  id: string;');

fs.writeFileSync('src/screens/LeadsDashboard.tsx', src);
