const fs = require('fs');
let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const fieldsGatherer = `                      const clientName = (document.getElementById("standalone-clientName") as HTMLInputElement)?.value;
                      const clientAddress = (document.getElementById("standalone-clientAddress") as HTMLTextAreaElement)?.value;
                      const senderName = (document.getElementById("standalone-senderName") as HTMLInputElement)?.value;
                      const senderAddress = (document.getElementById("standalone-senderAddress") as HTMLTextAreaElement)?.value;
                      const logoUrl = (document.getElementById("standalone-logoUrl") as HTMLInputElement)?.value;
                      const notes = (document.getElementById("standalone-notes") as HTMLTextAreaElement)?.value;`;

// Replace finding `const clientName = ...` up to its closing brace (just matching clientName definition which is single line or multi-line depending on Prettier)
// Since Prettier ran, it might be split up.

content = content.replace(/const clientName =\s+\(\s*document\.getElementById\(\s*"standalone-clientName",?\s*\)\s*as HTMLInputElement\s*\)\?\.value;/, fieldsGatherer);

content = content.replace(/clientName,\s*format,/, 'clientName,\n                          clientAddress,\n                          senderName,\n                          senderAddress,\n                          logoUrl,\n                          notes,\n                          format,');

fs.writeFileSync('src/screens/Financials.tsx', content);
