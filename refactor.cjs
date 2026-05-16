const fs = require('fs');

let src = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// 1. Add new state for livePreviewData and brandColor
if (!src.includes('const [livePreviewData')) {
  src = src.replace(
    /const \[generatedInvoiceData,\s*setGeneratedInvoiceData\]\s*=\s*useState<any>\(null\);/g,
    `const [generatedInvoiceData, setGeneratedInvoiceData] = useState<any>(null);\n  const [livePreviewData, setLivePreviewData] = useState<any>({});\n  const [brandColor, setBrandColor] = useState("#ff0000");`
  );
}

// 2. Change the standalone invoice section to be split-screen
// We need to find the <form id="standalone-invoice-form" ...> and wrap it and the preview.
// First, let's update the onChange of the form to sync livePreviewData
const getFieldsStr = `
                      const getFormValues = () => ({
                        invoiceNumber: (document.getElementById("standalone-invoice") as HTMLInputElement)?.value,
                        email: (document.getElementById("standalone-email") as HTMLInputElement)?.value,
                        clientName: (document.getElementById("standalone-clientName") as HTMLInputElement)?.value,
                        amount: (document.getElementById("standalone-amount") as HTMLInputElement)?.value,
                        amountPaid: (document.getElementById("standalone-amountPaid") as HTMLInputElement)?.value,
                        desc: (document.getElementById("standalone-desc") as HTMLInputElement)?.value,
                        format: (document.getElementById("standalone-format") as HTMLInputElement)?.value,
                        revisions: (document.getElementById("standalone-revisions") as HTMLInputElement)?.value,
                        dueDate: (document.getElementById("standalone-dueDate") as HTMLInputElement)?.value,
                        terms: (document.getElementById("standalone-terms") as HTMLTextAreaElement)?.value,
                        taxRate: (document.getElementById("standalone-taxRate") as HTMLInputElement)?.value,
                        discount: (document.getElementById("standalone-discount") as HTMLInputElement)?.value,
                        clientAddress: (document.getElementById("standalone-clientAddress") as HTMLInputElement)?.value,
                        senderName: (document.getElementById("standalone-senderName") as HTMLInputElement)?.value,
                        senderAddress: (document.getElementById("standalone-senderAddress") as HTMLInputElement)?.value,
                        logoUrl: (document.getElementById("standalone-logoUrl") as HTMLInputElement)?.value,
                        additionalNotes: (document.getElementById("standalone-additionalNotes") as HTMLTextAreaElement)?.value,
                        recurringSchedule: (document.getElementById("standalone-recurringSchedule") as HTMLSelectElement)?.value || "none",
                        currency: (document.getElementById("standalone-currency") as HTMLSelectElement)?.value || "USD",
                      });
`;

src = src.replace(
  /onChange=\{\(e\) =>\s*setIsStandaloneFormValid\(e\.currentTarget\.checkValidity\(\)\)\s*\}/,
  `onChange={(e) => {
      setIsStandaloneFormValid(e.currentTarget.checkValidity());
      setLivePreviewData(${getFieldsStr}.getFormValues());
  }}`
);

// 3. Add brandColor picker to the form
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
                         className="h-9 w-9 bg-transparent border border-zinc-800 rounded cursor-pointer"
                       />
                       <input
                         type="text"
                         value={brandColor}
                         onChange={(e) => setBrandColor(e.target.value)}
                         className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-white transition-colors font-mono uppercase"
                       />
                    </div>
                  </div>
`;

if (!src.includes('Brand Color')) {
  // insert before Client Email
  src = src.replace(
    /<div>\s*<label className="text-\[10px\] uppercase font-mono text-zinc-500 tracking-widest mb-1\.5 block text-white\/50">\s*Client Email \(Optional\)/,
    match => colorPickerHtml + match
  );
}

// 4. Update the "generate" button to be "Save & Send" and we don't open the modal anymore, we just save it.
// The user says "split-screen view where the invoice visually updates in real-time... Download as PDF... Brand Color Picker... Digital Signature".
// If the preview is split-screen, we need to extract the preview HTML and render it next to the form.
fs.writeFileSync('src/screens/Financials_tmp.tsx', src);
