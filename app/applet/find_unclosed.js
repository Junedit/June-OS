const fs = require('fs');

const content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const regex = /<\/?(form|div|section|label|span|button|input|textarea|select|option)[^>]*>/g;

let stack = [];
let match;

while ((match = regex.exec(content)) !== null) {
  const lineNo = content.substring(0, match.index).split('\n').length;
  if (lineNo < 730 || lineNo > 1095) continue;
  
  const tagStr = match[0];
  const isSelfClosing = tagStr.endsWith('/>') || tagStr.includes('<input') || tagStr.includes('<img');
  if (isSelfClosing) continue;
  
  const matchTag = tagStr.match(/<\/?([a-zA-Z0-9]+)/);
  if (!matchTag) continue;
  const tagName = matchTag[1];
  
  if (tagStr.startsWith('</')) {
    if (stack.length === 0) {
      console.log(`Unmatched closing tag at line ${lineNo}: ${tagStr}`);
    } else {
      const top = stack.pop();
      if (top.tagName !== tagName) {
         console.log(`Mismatch at line ${lineNo}: trying to close ${tagName} but top of stack is ${top.tagName} from line ${top.lineNo}`);
         break;
      }
    }
  } else {
    stack.push({ tagName, lineNo, str: tagStr });
  }
}
if (stack.length > 0) {
  console.log("Unclosed tags left in stack:");
  console.log(stack.map(s => `${s.tagName} at ${s.lineNo}`).join(', '));
}
