const fs = require('fs');
const path = require('path');

const targetPath = path.join(process.cwd(), 'src/screens/Prospector.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const replacementText = fs.readFileSync(path.join(process.cwd(), 'replacement.txt'), 'utf8');

const startMarker = '<div className="p-6 pl-8 flex flex-col gap-6 relative z-10">';
const startIndex = content.indexOf(startMarker);
const suffixIndex = content.indexOf('</motion.div>\\n                );\\n                })}', startIndex);

if (startIndex === -1 || suffixIndex === -1) {
  console.log("Could not find markers!");
  console.log(startIndex, suffixIndex);
  process.exit(1);
}

const prefix = content.substring(0, startIndex);
const suffix = content.substring(suffixIndex);

const finalCode = prefix + replacementText + '\\n                   ' + suffix;

fs.writeFileSync(targetPath, finalCode, 'utf8');
console.log("Successfully replaced block.");
