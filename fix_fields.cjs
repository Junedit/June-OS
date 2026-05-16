const fs = require('fs');
let c = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

c = c.replace(
  `const amount = (document.getElementById('standalone-amount') as HTMLInputElement)?.value;
                       const desc = (document.getElementById('standalone-desc') as HTMLInputElement)?.value;`,
  `const amount = (document.getElementById('standalone-amount') as HTMLInputElement)?.value;
                       const amountPaid = (document.getElementById('standalone-amountPaid') as HTMLInputElement)?.value;
                       const desc = (document.getElementById('standalone-desc') as HTMLInputElement)?.value;`
);

c = c.replace(
  `setGeneratedInvoiceData({
                             invoiceNumber, email, amount, desc, clientName, format, revisions, dueDate, terms, paymentLinks
                           });`,
  `setGeneratedInvoiceData({
                             invoiceNumber, email, amount, amountPaid, desc, clientName, format, revisions, dueDate, terms, paymentLinks
                           });`
);

c = c.replace(
  `<h2 className="font-black text-2xl tracking-tight uppercase mb-1">JUNEDIT STUDIO</h2>
                             <p className="text-gray-600 font-mono">{user?.email || 'studio@junedit.com'}</p>
                             <p className="text-gray-400 font-mono mt-1">Los Angeles, CA</p>`,
  `<h2 className="font-black text-3xl tracking-tighter uppercase text-[#ff0000]">JUNEDIT</h2>
                             <p className="text-gray-900 font-bold font-mono text-[10px] tracking-widest mt-1">DIRECTOR & EDITOR</p>
                             <p className="text-gray-500 font-mono mt-1">hello@junedit.com</p>
                             <p className="text-gray-400 font-mono mt-0.5">Los Angeles, CA</p>`
);

fs.writeFileSync('src/screens/Financials.tsx', c);
