const fs = require('fs');
let code = fs.readFileSync('src/screens/LeadsDashboard.tsx', 'utf8');

code = code.split('\\n').join('\n');
fs.writeFileSync('src/screens/LeadsDashboard.tsx', code);
