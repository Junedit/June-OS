const fs = require('fs');
const path = require('path');

const targetPath = path.join(process.cwd(), 'src/screens/LeadsDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const matrixStart = content.indexOf('{/* Global Matrix and Predictive Win Score */}');
const pipelineStart = content.indexOf('{viewMode === "pipeline" ? ('.replace(/"/g, "'"));

if (matrixStart === -1 || pipelineStart === -1) {
    console.error("Tokens not found!");
    process.exit(1);
}

// Extract the entire block
const blockToRemove = content.substring(matrixStart, pipelineStart);

// Remove it from the original place
content = content.replace(blockToRemove, '');

// Now we want to insert 'blockToRemove' into 'viewMode === 'queue''
// Right before `<SmartQueue leads={leads}`
const smartQueueIndex = content.indexOf('<SmartQueue leads={leads}');

if (smartQueueIndex === -1) {
    console.error("SmartQueue not found!");
    process.exit(1);
}

content = content.substring(0, smartQueueIndex) + 
          blockToRemove + 
          content.substring(smartQueueIndex);

fs.writeFileSync(targetPath, content, 'utf8');
console.log("Success");
