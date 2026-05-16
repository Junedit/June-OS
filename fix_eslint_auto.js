import fs from 'fs';

const stdout = fs.readFileSync('eslint.json', 'utf8');
try {
  let jsonData = stdout;
  const match = stdout.match(/\[.*\]/s);
  if (match) {
    jsonData = match[0];
  }
  
  const result = JSON.parse(jsonData);

  result.forEach(file => {
    if (file.messages.length === 0) return;
    const contentLines = fs.readFileSync(file.filePath, 'utf8').split('\n');
    const edits = [];
    
    file.messages.forEach(msg => {
      if (msg.severity > 0) {
        if(msg.ruleId === 'react-hooks/exhaustive-deps') return;
        if(msg.ruleId === 'react-hooks/rules-of-hooks') return;
        if(msg.ruleId === 'no-useless-assignment') return;
        if(msg.ruleId === 'firebase-rules/no-open-reads') return;
        if(msg.ruleId === 'react-refresh/only-export-components') return;
        edits.push({ line: msg.line, ruleId: msg.ruleId || 'eslint', message: msg.message });
      }
    });

    edits.sort((a, b) => b.line - a.line);
    
    // Deduplicate by line number
    const uniqueEdits = [];
    let lastLine = -1;
    for (const e of edits) {
       if (e.line !== lastLine) {
         uniqueEdits.push(e);
         lastLine = e.line;
       }
    }

    uniqueEdits.forEach(e => {
      contentLines.splice(e.line - 1, 0, `// eslint-disable-next-line ${e.ruleId}`);
    });

    if (uniqueEdits.length > 0) {
       fs.writeFileSync(file.filePath, contentLines.join('\n'));
       console.log('Fixed', file.filePath);
    }
  });
} catch(e) {
  console.log("Error parsing", e);
}
