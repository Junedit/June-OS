const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/screens/Prospector.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const replacementText = fs.readFileSync(path.join(__dirname, 'replacement.txt'), 'utf8');

const startMarker = '<div className="p-6 pl-8 flex flex-col gap-6 relative z-10">';
const endMarker = '</motion.div>\\n                );\\n                })}\\n                       </AnimatePresence>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf('</div>\\n                      </div>\\n                   </motion.div>', startIndex);

// let's try a regex approach or split approach
const prefix = content.substring(0, startIndex);
// Find the exact closing div for the map block. It is before </motion.div>
const suffixIndex = content.indexOf('</motion.div>\\n                );\\n                })}', startIndex);

if (startIndex === -1 || suffixIndex === -1) {
  console.log("Could not find markers!");
  console.log(startIndex, suffixIndex);
  process.exit(1);
}

const suffix = content.substring(suffixIndex);

const finalCode = prefix + replacementText + '\\n                   ' + suffix;

fs.writeFileSync(targetPath, finalCode, 'utf8');
console.log("Successfully replaced block.");
