const fs = require('fs');
// Let's use git checkout or something else? Wait, no git. Let's just fix line 351!
const code = fs.readFileSync('src/screens/LeadsDashboard.tsx', 'utf8');

// I will output line 350 to 360 to console to see what it is.
console.log(code.split('\\n').slice(345, 355).join('\\n'));
