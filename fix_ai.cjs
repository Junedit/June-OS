const fs = require('fs');
let content = fs.readFileSync('src/services/ai.ts', 'utf8');

content = content.replace("  }\n}\n    }\n  }\n}", "  }\n}");
fs.writeFileSync('src/services/ai.ts', content);
