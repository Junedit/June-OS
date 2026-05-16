const fs = require('fs');
let src = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// 1. PDF Download logic
src = src.replace(
  /onClick=\{\(\) => \{\s*window\.print\(\);\s*\}\}/,
  `onClick={async () => {
                              const element = document.getElementById("invoice-print-area");
                              if (!element) return;
                              
                              try {
                                const html2pdf = (await import('html2pdf.js')).default;
                                const opt = {
                                  margin:       [0, 0, 0, 0],
                                  filename:     \`Invoice-\${liveInvoiceData?.invoiceNumber || 'draft'}.pdf\`,
                                  image:        { type: 'jpeg', quality: 1 },
                                  html2canvas:  { scale: 2, useCORS: true },
                                  jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
                                };
                                
                                html2pdf().set(opt).from(element).save();
                              } catch (e) {
                                console.error('Error generating PDF', e);
                                window.print();
                              }
                            }}`
);
src = src.replace(
  /<span className="hidden sm:inline">\s*Print \/ Save PDF\s*<\/span>\s*<span className="sm:hidden">PDF<\/span>/,
  '<span className="hidden sm:inline">Download PDF</span><span className="sm:hidden">PDF</span>'
);

fs.writeFileSync('src/screens/Financials.tsx', src);
