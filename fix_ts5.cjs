const fs = require('fs');

let src = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

src = src.replace(
  /const opt = \{/,
  `const opt: any = {`
);

fs.writeFileSync('src/screens/Financials.tsx', src);
