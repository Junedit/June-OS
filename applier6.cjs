const fs = require('fs');
const path = require('path');

const targetPath = path.join(process.cwd(), 'src/screens/Prospector.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const replacementText = fs.readFileSync(path.join(process.cwd(), 'app/applet/replacement.txt'), 'utf8');

const startMarker = '<div className="p-6 pl-8 flex flex-col gap-6 relative z-10">';
const startIndex = content.indexOf(startMarker);

const animatePresenceIndex = content.indexOf('</AnimatePresence>');
// We want to slice right before the </motion.div> that comes BEFORE </AnimatePresence>
// So let's back up to find the motion.div
const suffixStartIndex = content.lastIndexOf('</motion.div>', animatePresenceIndex);

if (startIndex === -1 || suffixStartIndex === -1 || suffixStartIndex <= startIndex) {
  console.log("Could not find markers!");
  process.exit(1);
}

const prefix = content.substring(0, startIndex);
const suffix = content.substring(suffixStartIndex);

const finalCode = prefix + replacementText + '\\n                   ' + suffix;

fs.writeFileSync(targetPath, finalCode, 'utf8');
console.log("Successfully replaced block.");
