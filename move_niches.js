import fs from 'fs';

let code = fs.readFileSync('src/screens/Prospector.tsx', 'utf8');

const regex = /\n  const YOUTUBE_NICHES = \[\s*[\s\S]*?\];\n/;
const match = code.match(regex);
if(match) {
   code = code.replace(match[0], '');
   
   // Insert it above Prospector function
   const prospectorIdx = code.indexOf('export default function Prospector() {');
   code = code.substring(0, prospectorIdx) + "\n" + match[0].trim() + "\n\n" + code.substring(prospectorIdx);
   fs.writeFileSync('src/screens/Prospector.tsx', code);
   console.log("Moved YOUTUBE_NICHES out");
}
