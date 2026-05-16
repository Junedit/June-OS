const fs = require('fs');
let code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const newTerms = "Payment is due within 30 days of the invoice date.\\nLate payments are subject to a 1.5% monthly fee.\\nPlease make checks payable to Junedit Design OR pay online via the attached links.";

// Replace in state
code = code.replace(
  'terms: "Payment is due within 30 days. Late payments are subject to a 1.5% monthly fee. Please make checks payable to Junedit Design OR pay online via the attached links."',
  `terms: "${newTerms}"`
);

// Replace in defaultValue
code = code.replace(
  'defaultValue="Payment is due within 30 days. Late payments are subject to a 1.5% monthly fee. Please make checks payable to Junedit Design OR pay online via the attached links."',
  `defaultValue={"${newTerms}"}`
);

fs.writeFileSync('src/screens/Financials.tsx', code);
console.log("Terms default value formatted.");
