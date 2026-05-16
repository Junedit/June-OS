const fs = require('fs');
let code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

code = code.replace(
  'const [livePreviewData, setLivePreviewData] = useState<any>({ amount: 0, invoiceNumber: "INV-001", welcomeMessage: "Thank you for choosing us for this project!", additionalNotes: "We appreciate your business!" });',
  'const [livePreviewData, setLivePreviewData] = useState<any>({ amount: 0, invoiceNumber: "INV-001", terms: "Payment is due within 30 days. Late payments are subject to a 1.5% monthly fee. Please make checks payable to Junedit Design OR pay online via the attached links.", welcomeMessage: "Thank you for choosing us for this project!", additionalNotes: "We appreciate your business!" });'
);

code = code.replace(
  'id="standalone-terms"',
  'id="standalone-terms"\n                      defaultValue="Payment is due within 30 days. Late payments are subject to a 1.5% monthly fee. Please make checks payable to Junedit Design OR pay online via the attached links."'
);

fs.writeFileSync('src/screens/Financials.tsx', code);
console.log("Patched terms correctly.");
