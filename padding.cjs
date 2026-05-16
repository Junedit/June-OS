const fs = require('fs');
let code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// Minimalist
code = code.replace(
  '<div className="mt-12 flex flex-col items-end w-full">',
  '<div className="mt-12 flex flex-col items-end w-full px-12">'
);

// Detailed
code = code.replace(
  '<div className="mt-12 flex flex-col items-end w-full">', // Note: string replace only does first occurrence
  '<div className="mt-12 flex flex-col items-end w-full px-8 md:px-12">'
);

// Corporate
code = code.replace(
  '<div className="mt-12 flex flex-col items-end pb-8">',
  '<div className="mt-12 flex flex-col items-end pb-8 px-12 md:px-16">'
);

fs.writeFileSync('src/screens/Financials.tsx', code);
console.log("Added padding.");
