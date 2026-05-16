const fs = require('fs');

let src = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

src = src.replace(
  /const getVal = \(id\) => \(document\.getElementById\(id\)\)\?\.value;/,
  `const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value;`
);

src = src.replace(
  /margin:\s*\[0, 0, 0, 0\],/,
  `margin:       [0, 0, 0, 0] as any,`
);

src = src.replace(
  /const getVal = \(id\) => \(document\.getElementById\(id\)\)\?\.value;/,
  `const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value;`
);

fs.writeFileSync('src/screens/Financials.tsx', src);
