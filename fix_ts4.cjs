const fs = require('fs');

let src = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

src = src.replace(
  /image:\s*\{\s*type:\s*'jpeg',\s*quality:\s*1\s*\}/,
  `image:        { type: 'jpeg' as const, quality: 1 }`
);

fs.writeFileSync('src/screens/Financials.tsx', src);
