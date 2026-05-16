const fs = require('fs');
let code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// Branded
code = code.replace(
  /<div className="inline-block flex flex-col items-start md:items-end">\s*<div className="h-16 w-32 border-b-2 border-\[var\(--brandColor\)\] opacity-50 mb-2 transform -skew-x-12"><\/div>\s*<p className="text-xs font-bold font-mono text-zinc-500 print:text-gray-500 uppercase tracking-widest">\s*Authorized Signatory\s*<\/p>\s*<p className="text-6xl pt-2 opacity-90 text-zinc-200 mt-2" style=\{\{ fontFamily: '"Caveat", cursive', transform: 'rotate\(-5deg\)' \}\}>\{previewData.senderName \|\| "JUNEDIT"\}<\/p>\s*<\/div>/g,
  `<div className="inline-block flex flex-col items-end">
                                    <p className="text-5xl text-zinc-200 -mb-2 pr-6" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-4deg)' }}>{previewData.senderName || "JUNEDIT"}</p>
                                    <div className="h-px w-48 bg-zinc-700 mb-2"></div>
                                    <p className="text-[10px] font-bold font-mono text-zinc-500 print:text-gray-500 uppercase tracking-widest">
                                      Authorized Signatory
                                    </p>
                                  </div>`
);

// Minimalist
code = code.replace(
  /<div className="mt-12 flex flex-col items-end print:items-start md:items-end w-full">\s*<div className="h-6 w-56 border-b-2 border-zinc-300 mb-2 opacity-60"><\/div>\s*<p className="text-\[10px\] font-bold text-zinc-500 uppercase tracking-widest mb-1">Authorized Signatory<\/p>\s*<p className="text-6xl pt-2 text-zinc-800" style=\{\{ fontFamily: '"Caveat", cursive', transform: 'rotate\(-5deg\)' \}\}>\s*\{previewData.senderName \|\| "JUNEDIT"\}\s*<\/p>\s*<\/div>/g,
  `<div className="mt-12 flex flex-col items-end w-full">
                                      <p className="text-5xl text-zinc-800 -mb-2 pr-6" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-4deg)' }}>
                                        {previewData.senderName || "JUNEDIT"}
                                      </p>
                                      <div className="h-px w-48 bg-zinc-300 mb-2"></div>
                                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Authorized Signatory</p>
                                  </div>`
);

// Detailed
code = code.replace(
  /<div className="mt-12 flex flex-col items-end w-full">\s*<div className="h-6 w-56 border-b-2 border-zinc-300 mb-2 opacity-60"><\/div>\s*<p className="text-\[10px\] font-bold text-zinc-500 uppercase tracking-widest mb-1">Authorized Signatory<\/p>\s*<p className="text-6xl pt-2 text-zinc-800" style=\{\{ fontFamily: '"Caveat", cursive', transform: 'rotate\(-5deg\)' \}\}>\s*\{previewData\.senderName \|\| "JUNEDIT"\}\s*<\/p>\s*<\/div>/g,
  `<div className="mt-12 flex flex-col items-end w-full">
                                    <p className="text-5xl text-zinc-800 -mb-2 pr-6" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-4deg)' }}>
                                      {previewData.senderName || "JUNEDIT"}
                                    </p>
                                    <div className="h-px w-48 bg-zinc-300 mb-2"></div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Authorized Signatory</p>
                                </div>`
);

// Corporate
code = code.replace(
  /<div className="mt-12 flex flex-col items-end pb-8">\s*<div className="h-6 w-56 border-b-2 border-slate-300 mb-2 opacity-60"><\/div>\s*<p className="text-\[10px\] font-bold text-slate-500 uppercase tracking-widest mb-1">Authorized Signatory<\/p>\s*<p className="text-6xl pt-2 text-slate-800" style=\{\{ fontFamily: '"Caveat", cursive', transform: 'rotate\(-5deg\)' \}\}>\s*\{previewData\.senderName \|\| "JUNEDIT"\}\s*<\/p>\s*<\/div>/g,
  `<div className="mt-12 flex flex-col items-end pb-8">
                                    <p className="text-5xl text-slate-800 -mb-2 pr-6" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-4deg)' }}>
                                      {previewData.senderName || "JUNEDIT"}
                                    </p>
                                    <div className="h-px w-48 bg-slate-300 mb-2"></div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Authorized Signatory</p>
                                </div>`
);

// Creative
code = code.replace(
  /<div className="mt-12 mb-4 px-12 md:px-16 flex flex-col items-end">\s*<div className="h-6 w-56 border-b-2 border-stone-300 mb-2 opacity-60 transform -skew-x-12"><\/div>\s*<p className="text-\[10px\] font-bold text-stone-500 uppercase tracking-widest mb-1 font-mono">Authorized Signatory<\/p>\s*<p className="text-6xl pt-2 text-stone-800" style=\{\{ fontFamily: '"Caveat", cursive', transform: 'rotate\(-5deg\)' \}\}>\s*\{previewData\.senderName \|\| "JUNEDIT"\}\s*<\/p>\s*<\/div>/g,
  `<div className="mt-12 mb-4 px-12 md:px-16 flex flex-col items-end">
                                    <p className="text-5xl text-stone-800 -mb-2 pr-6" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-4deg)' }}>
                                      {previewData.senderName || "JUNEDIT"}
                                    </p>
                                    <div className="h-px w-48 bg-stone-300 mb-2"></div>
                                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 font-mono">Authorized Signatory</p>
                                </div>`
);

fs.writeFileSync('src/screens/Financials.tsx', code);
console.log("Replaced successfully!");
