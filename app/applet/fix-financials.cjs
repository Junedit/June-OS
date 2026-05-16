const fs = require('fs');
const targetPath = 'src/screens/Financials.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// Add state selectedLeadIdForInvoice
content = content.replace(
  'const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");',
  'const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");\n  const [selectedLeadIdForInvoice, setSelectedLeadIdForInvoice] = useState<string | null>(null);'
);

// Update onChange block
content = content.replace(
  /const leadId = e\.target\.value;\s*if \(\!leadId\) return;/g,
  'const leadId = e.target.value;\n                      setSelectedLeadIdForInvoice(leadId || null);\n                      if (!leadId) return;'
);

// Add leadId to payload
content = content.replace(
  'template: invoiceTemplate || "branded",',
  'template: invoiceTemplate || "branded",\n                          leadId: selectedLeadIdForInvoice,'
);

fs.writeFileSync(targetPath, content, 'utf8');
