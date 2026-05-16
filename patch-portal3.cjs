const fs = require('fs');
let code = fs.readFileSync('src/screens/ClientPortal.tsx', 'utf8');

const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('</div>') && lines[i+1] === '' && lines[i+2] && lines[i+2].includes('Status Card and Deliverables Grid')) {
       lines[i] = lines[i].replace('</div>', '</motion.div>');
   }
}

fs.writeFileSync('src/screens/ClientPortal.tsx', lines.join('\n'));
