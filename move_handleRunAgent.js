const fs = require('fs');

let code = fs.readFileSync('src/screens/Prospector.tsx', 'utf8');

// Find handleRunAgent start
const funcStartMatch = code.match(/\n\s*\/\/ eslint-disable-next-line react-hooks\/purity\n\s*async function handleRunAgent\(/);
if (!funcStartMatch) {
  console.log("Could not find handleRunAgent start");
  process.exit(1);
}
const startIndex = funcStartMatch.index;

// Find handleRunAgent end
const funcEndRegex = /\n  };\n  return \(/;
const funcEndMatch = code.match(funcEndRegex);
if (!funcEndMatch) {
  console.log("Could not find handleRunAgent end");
  process.exit(1);
}
const endIndex = funcEndMatch.index + 5; // right after "  };\n"

const funcCode = code.substring(startIndex, endIndex);
console.log("Extracted chunk length:", funcCode.length);

code = code.substring(0, startIndex) + "\n" + code.substring(endIndex);

// Find useEffect that uses it
const searchIdx = code.indexOf('useEffect(() => {\n    if (autopilotOn && user) {');
if (searchIdx === -1) {
  console.log("Could not find useEffect");
  process.exit(1);
}

code = code.substring(0, searchIdx) + funcCode + "\n\n" + code.substring(searchIdx);

fs.writeFileSync('src/screens/Prospector.tsx', code);
console.log("Moved handleRunAgent above useEffect");
