const fs = require('fs');

let src = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// 1. Define states
if (!src.includes('const [liveInvoiceData')) {
  src = src.replace(
    /const \[generatedInvoiceData,\s*setGeneratedInvoiceData\]\s*=\s*useState<any>\(null\);/g,
    `const [generatedInvoiceData, setGeneratedInvoiceData] = useState<any>(null);\n  const [liveInvoiceData, setLiveInvoiceData] = useState<any>({ amount: 0, invoiceNumber: "INV-001" });\n  const [brandColor, setBrandColor] = useState("#ff0000");`
  );
}

// 2. Add Brand Color Picker
if (!src.includes('id="standalone-brandColor"')) {
  const colorPickerHtml = `
                  <div>
                    <label className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mb-1.5 block text-white/50">
                      Brand Color
                    </label>
                    <div className="flex gap-2">
                       <input
                         type="color"
                         value={brandColor}
                         onChange={(e) => setBrandColor(e.target.value)}
                         className="h-[38px] w-12 bg-transparent border border-zinc-800 rounded cursor-pointer shrink-0"
                       />
                       <input
                         type="text"
                         id="standalone-brandColor"
                         value={brandColor}
                         onChange={(e) => setBrandColor(e.target.value)}
                         className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-white transition-colors font-mono uppercase"
                       />
                    </div>
                  </div>
`;
  src = src.replace(
    /(<div>\s*<label className="text-\[10px\] uppercase font-mono text-zinc-500 tracking-widest mb-1\.5 block text-white\/50">\s*Client Email \(Optional\))/,
    colorPickerHtml + "$1"
  );
}

// 3. Collect Values function
const getFieldsStr = `
  const updateLivePreview = () => {
    const getVal = (id) => (document.getElementById(id))?.value;
    const inv = {
      invoiceNumber: getVal("standalone-invoice") || "INV-000",
      email: getVal("standalone-email"),
      clientName: getVal("standalone-clientName") || "Client Name",
      amount: getVal("standalone-amount") || 0,
      amountPaid: getVal("standalone-amountPaid") || 0,
      desc: getVal("standalone-desc") || "Project Scope",
      format: getVal("standalone-format"),
      revisions: getVal("standalone-revisions"),
      dueDate: getVal("standalone-dueDate"),
      terms: getVal("standalone-terms"),
      taxRate: getVal("standalone-taxRate") ? Number(getVal("standalone-taxRate")) : 0,
      discount: getVal("standalone-discount") ? Number(getVal("standalone-discount")) : 0,
      clientAddress: getVal("standalone-clientAddress"),
      senderName: getVal("standalone-senderName"),
      senderAddress: getVal("standalone-senderAddress"),
      logoUrl: getVal("standalone-logoUrl"),
      additionalNotes: getVal("standalone-additionalNotes"),
      recurringSchedule: getVal("standalone-recurringSchedule") || "none",
      currency: getVal("standalone-currency") || "USD",
      brandColor: brandColor
    };
    setLiveInvoiceData(inv);
  };
`;

if (!src.includes('updateLivePreview')) {
  src = src.replace(/return \(\s*<div className="flex-1 flex flex-col relative w-full bg-surface">/, getFieldsStr + '\n  return (\n    <div className="flex-1 flex flex-col relative w-full bg-surface">');
}

// Add onChange to form
src = src.replace(
  /onChange=\{\(e\) =>\s*setIsStandaloneFormValid\(e\.currentTarget\.checkValidity\(\)\)\s*\}/,
  `onChange={(e) => {\n                  setIsStandaloneFormValid(e.currentTarget.checkValidity());\n                  updateLivePreview();\n                }}`
);

// We want to replace generatedInvoiceData INSIDE the preview area with (liveInvoiceData || generatedInvoiceData) 
// but ONLY inside the AnimatePresence block representing the invoice.
// Actually, it's easier to just do a global replace of generatedInvoiceData with (liveInvoiceData || generatedInvoiceData) 
// BUT we don't want to replace `setGeneratedInvoiceData` or `generatedInvoiceData.id` logic or `generatedInvoiceData &&` checks.
// It's safer to map variables explicitly or use a `const previewData = generatedInvoiceData || liveInvoiceData;`
src = src.replace(
  /<AnimatePresence>/,
  `{/* Split Screen Preview */}\n              {(() => {\nconst previewData = generatedInvoiceData || liveInvoiceData || {};\nreturn (<AnimatePresence>`
);
src = src.replace(
  /<\/AnimatePresence>/,
  `</AnimatePresence>);\n})()}`
);

// Let's replace 'generatedInvoiceData' with 'previewData' inside the modal content
// Bounds for the modal content:
const modalStart = src.indexOf('{/* Split Screen Preview */}');
const modalEnd = src.indexOf('</AnimatePresence>);', modalStart) + '</AnimatePresence>);'.length + 6;

if (modalStart !== -1 && modalEnd !== -1) {
  let before = src.substring(0, modalStart);
  let modalStr = src.substring(modalStart, modalEnd);
  let after = src.substring(modalEnd);

  // Instead of fixed string replacement, use regex to replace safe references
  modalStr = modalStr.replace(/generatedInvoiceData\.amount/g, 'previewData.amount');
  modalStr = modalStr.replace(/generatedInvoiceData\.discount/g, 'previewData.discount');
  modalStr = modalStr.replace(/generatedInvoiceData\.taxRate/g, 'previewData.taxRate');
  modalStr = modalStr.replace(/generatedInvoiceData\?/g, 'previewData?');
  modalStr = modalStr.replace(/generatedInvoiceData\.invoiceNumber/g, 'previewData.invoiceNumber');
  modalStr = modalStr.replace(/generatedInvoiceData\.clientName/g, 'previewData.clientName');
  modalStr = modalStr.replace(/generatedInvoiceData\.email/g, 'previewData.email');
  modalStr = modalStr.replace(/generatedInvoiceData\.clientAddress/g, 'previewData.clientAddress');
  modalStr = modalStr.replace(/generatedInvoiceData\.dueDate/g, 'previewData.dueDate');
  modalStr = modalStr.replace(/generatedInvoiceData\.paymentLinks/g, 'previewData.paymentLinks');
  modalStr = modalStr.replace(/generatedInvoiceData\.senderName/g, 'previewData.senderName');
  modalStr = modalStr.replace(/generatedInvoiceData\.senderAddress/g, 'previewData.senderAddress');
  modalStr = modalStr.replace(/generatedInvoiceData\.logoUrl/g, 'previewData.logoUrl');
  modalStr = modalStr.replace(/generatedInvoiceData\.currency/g, 'previewData.currency');
  modalStr = modalStr.replace(/generatedInvoiceData\.format/g, 'previewData.format');
  modalStr = modalStr.replace(/generatedInvoiceData\.revisions/g, 'previewData.revisions');
  modalStr = modalStr.replace(/generatedInvoiceData\.terms/g, 'previewData.terms');
  modalStr = modalStr.replace(/generatedInvoiceData\.additionalNotes/g, 'previewData.additionalNotes');
  modalStr = modalStr.replace(/generatedInvoiceData\.amountPaid/g, 'previewData.amountPaid');
  modalStr = modalStr.replace(/generatedInvoiceData\.desc/g, 'previewData.desc');
  // keep generatedInvoiceData.id intact for update commands, or replace the specific update calls:
  // e.g. updateDoc(doc(db, "invoices", generatedInvoiceData.id) -> this is fine since it's checking if generatedInvoiceData exists.
  
  // Also, replace the fixed #ff0000 with brandColor variable
  modalStr = modalStr.replace(/bg-\[#ff0000\]/g, 'bg-[var(--brandColor)]');
  modalStr = modalStr.replace(/text-\[#ff0000\]/g, 'text-[var(--brandColor)]');
  modalStr = modalStr.replace(/border-\[#ff0000\]/g, 'border-[var(--brandColor)]');
  modalStr = modalStr.replace(/shadow-\[#ff0000\]/g, 'shadow-[var(--brandColor)]');
  
  // Inject the CSS variable into the styles of the preview container
  modalStr = modalStr.replace(
    /id="invoice-print-area"/,
    `id="invoice-print-area"\n                          style={{ '--brandColor': brandColor || '#ff0000' } as any}`
  );
  
  // To make it layout beside the form, we remove the fixed backdrop "fixed inset-0 ..."
  // We can just render the `<div className="bg-[#0f0f0f] border ...">` inline
  modalStr = modalStr.replace(
    /className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black\/80 backdrop-blur-sm print:p-0 print:bg-white print:block"/g,
    `className="h-full print:block"`
  );
  
  modalStr = modalStr.replace(
    /className="bg-\[#0f0f0f\] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-\[90vh\] flex flex-col shadow-2xl overflow-hidden print:w-full print:h-auto print:max-h-none print:border-none print:shadow-none print:rounded-none"/,
    `className="bg-[#0f0f0f] h-full rounded-2xl w-full flex flex-col overflow-hidden print:w-full print:h-auto print:max-h-none print:border-none print:shadow-none print:rounded-none border-l border-zinc-800"`
  );

  // Disable the AnimatePresence modal condition
  modalStr = modalStr.replace(/\{generatedInvoiceData && \(/g, '{true && (');

  src = before + modalStr + after;
}

// 5. Add digital signature block
// Let's find "Thank you for your business" or "paymentLinks" section and append signature.
const signatureStr = `
                                  <div className="mt-12 flex justify-between items-end border-t border-zinc-200 print:border-gray-200 pt-8 lg:px-4">
                                    <div className="w-1/2">
                                      <p className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest mb-10">Authorized Signature</p>
                                      <div style={{ fontFamily: "cursive, 'Brush Script MT', 'Great Vibes', 'Rouge Script'" }} className="text-4xl text-[var(--brandColor)] transform -rotate-3 mb-2 opacity-90 inline-block">
                                        {previewData.senderName || "JUNEDIT"}
                                      </div>
                                      <div className="w-48 border-b-2 border-zinc-300 print:border-black mb-2"></div>
                                      <p className="text-xs font-mono font-bold text-zinc-700 print:text-black uppercase">{previewData.senderName || 'Authorized Signatory'}</p>
                                      <p className="text-[10px] font-mono text-zinc-500 mt-1">{new Date().toLocaleDateString()}</p>
                                    </div>
                                  </div>
`;
// Insert signature at the end of the branded template
src = src.replace(
  /(\n\s*<\/div>\n\s*\{invoiceTemplate === "minimalist" && \()/g,
  signatureStr + "$1"
);

// We must also restructure the layout!
// Standalone Invoicing is currently in <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// Let's use a regex to pull the <section className="... Standalone Invoicing ..."> out of the grid and place it as a full width grid.

fs.writeFileSync('src/screens/Financials_modified.tsx', src);
