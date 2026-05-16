const fs = require('fs');

let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const html2PDFLogic = `                            onClick={async () => {
                              const element = document.getElementById("invoice-print-area");
                              if (!element) return;
                              
                              try {
                                // Add a subtle loading state for UI (optional, fast enough not to need it heavily)
                                const html2pdf = (await import('html2pdf.js')).default;
                                const opt = {
                                  margin:       [0, 0, 0, 0],
                                  filename:     \`Invoice-\${generatedInvoiceData.invoiceNumber}.pdf\`,
                                  image:        { type: 'jpeg', quality: 1 },
                                  html2canvas:  { scale: 2, useCORS: true },
                                  jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
                                };
                                
                                html2pdf().set(opt).from(element).save();
                              } catch (e) {
                                console.error('Error generating PDF', e);
                                // Fallback to print
                                window.print();
                              }
                            }}`;

content = content.replace(/onClick=\{\(\) => \{\s*const printContents = document\.getElementById\([\s\S]*?window\.location\.reload\(\);\s*\}\s*\}\}/, html2PDFLogic);
content = content.replace(/<span className="hidden sm:inline">\s*Print\s*<\/span>\s*<span className="sm:hidden">Print<\/span>/, 
  '<span className="hidden sm:inline">Download PDF</span><span className="sm:hidden">PDF</span>');

fs.writeFileSync('src/screens/Financials.tsx', content);
