const fs = require('fs');
let c = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

c = c.replace(
  `if (el) el.value = 0;`,
  `if (el) el.value = "0";`
);

fs.writeFileSync('src/screens/Financials.tsx', c);
