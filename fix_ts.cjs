const fs = require('fs');
let c = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

c = c.replace(
  `const el = document.getElementById('standalone-amountPaid');`,
  `const el = document.getElementById('standalone-amountPaid') as HTMLInputElement;`
);

c = c.replace(
  `const el = document.getElementById('standalone-amountPaid');`,
  `const el = document.getElementById('standalone-amountPaid') as HTMLInputElement;`
);

c = c.replace(
  `const el = document.getElementById('standalone-amountPaid');`,
  `const el = document.getElementById('standalone-amountPaid') as HTMLInputElement;`
);

c = c.replace(
  `const amt = parseFloat(document.getElementById('standalone-amount').value || 0);`,
  `const amt = parseFloat((document.getElementById('standalone-amount') as HTMLInputElement).value || "0");`
);

c = c.replace(
  `const amt = document.getElementById('standalone-amount').value || 0;`,
  `const amt = (document.getElementById('standalone-amount') as HTMLInputElement).value || "0";`
);

fs.writeFileSync('src/screens/Financials.tsx', c);
