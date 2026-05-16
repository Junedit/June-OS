const fs = require('fs');

let src = fs.readFileSync('src/screens/Financials_modified.tsx', 'utf8');

// The Standalone Invoicing section
const standaloneStart = src.indexOf('<section className="bg-black border border-zinc-900 rounded-xl p-2 relative">');
const pendingDealsStart = src.indexOf('<section className="bg-black border border-zinc-900 rounded-xl p-2">\n              <div className="flex justify-between items-center p-4">\n                <h3 className="text-lg font-headline font-bold text-white">\n                  Pending Deals');

if (standaloneStart === -1 || pendingDealsStart === -1) {
  console.error("Could not find sections");
  process.exit(1);
}

// Slice out the Standalone Invoicing section
const standaloneSectionContent = src.substring(standaloneStart, pendingDealsStart);

// We need to split standaloneSectionContent into the form part and the preview part.
// The form part ends at `</form>`
const formEnd = standaloneSectionContent.indexOf('</form>') + '</form>'.length;
const formPartSource = standaloneSectionContent.substring(0, formEnd);
// The preview part starts at `<AnimatePresence>` (wait, we changed it to `{/* Split Screen Preview */}`)
const previewStart = standaloneSectionContent.indexOf('{/* Split Screen Preview */}');
const previewEnd = standaloneSectionContent.indexOf('</section>'); // end of the section

const previewPartSource = standaloneSectionContent.substring(previewStart, previewEnd);

// Modify form part to remove outer section mapping and replace it
const formPartMod = formPartSource.replace(
  /<section className="bg-black border border-zinc-900 rounded-xl p-2 relative">/,
  ''
);

const newStandaloneSection = `
        {/* Split Screen Generator */}
        <section className="bg-black border border-zinc-900 rounded-xl relative overflow-hidden flex flex-col xl:flex-row shadow-2xl">
           <div className="w-full xl:w-[45%] flex-shrink-0 bg-black overflow-y-auto max-h-[1000px] no-scrollbar">
              ${formPartMod}
           </div>
           <div className="w-full xl:w-[55%] bg-[#0a0a0a] border-t xl:border-t-0 xl:border-l border-zinc-900 overflow-y-auto max-h-[1000px]">
              ${previewPartSource}
           </div>
        </section>
`;

// Now rebuild the source
const beforeStandalone = src.substring(0, standaloneStart);
const afterStandalone = src.substring(pendingDealsStart);

// 'beforeStandalone' has \`        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">\n          <div className="lg:col-span-2 space-y-8">\` right before standaloneStart
// We want to insert the newStandaloneSection BEFORE the \`<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">\`
const gridStart = beforeStandalone.lastIndexOf('<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">');

if (gridStart === -1) {
    console.log("Could not find gridStart!");
    process.exit(1);
}

let finalSrc = 
  beforeStandalone.substring(0, gridStart) +
  newStandaloneSection +
  '\\n        ' +
  beforeStandalone.substring(gridStart) +
  afterStandalone;

// One final thing: Update "Generate" button to not say generating and just say "Save as Record" or something
// And it should not wrap the preview inside fixed backdrop anymore.
// We already replaced it via regex in refactor2.cjs

fs.writeFileSync('src/screens/Financials.tsx', finalSrc);
console.log("Done");
