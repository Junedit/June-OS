const fs = require('fs');
let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// Remove Client Address
content = content.replace(/<div className="col-span-2 lg:col-span-1">\s*<label[^>]*>\s*Client Address\s*<\/label>[\s\S]*?<\/div>/, '');

// Remove Sender Name / Company (if it exists)
content = content.replace(/<div className="col-span-2 lg:col-span-1">\s*<label[^>]*>\s*Sender Name \/ Company\s*<\/label>[\s\S]*?<\/div>/, '');

// Remove Sender Address
content = content.replace(/<div className="col-span-2 lg:col-span-1">\s*<label[^>]*>\s*Sender Address\s*<\/label>[\s\S]*?<\/div>/, '');

// Remove Additional Notes
content = content.replace(/<div className="col-span-2 lg:col-span-1">\s*<label[^>]*>\s*Additional Notes\s*<\/label>[\s\S]*?<\/div>/, '');

// Remove Logo URL
content = content.replace(/<div className="col-span-2 lg:col-span-1">\s*<label[^>]*>\s*Logo URL\s*<\/label>[\s\S]*?<\/div>/, '');

// Update payload gathering just to be safe
content = content.replace(/const clientAddress = [^\n]*\n/g, '');
content = content.replace(/const senderAddress = [^\n]*\n/g, '');
content = content.replace(/const notes = [^\n]*\n/g, '');

content = content.replace(/clientAddress,\n/g, '');
content = content.replace(/senderAddress,\n/g, '');
content = content.replace(/notes,\n/g, '');

fs.writeFileSync('src/screens/Financials.tsx', content);
