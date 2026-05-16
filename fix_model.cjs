const fs = require('fs');
let content = fs.readFileSync('src/services/ai.ts', 'utf8');

content = content.replace("claude-3-7-sonnet-latest", "claude-3-7-sonnet-20250219");
fs.writeFileSync('src/services/ai.ts', content);
