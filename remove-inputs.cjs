const fs = require('fs');

let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

// Remove form fields
content = content.replace(/<div className="col-span-2 lg:col-span-1">\s*<label[^>]*>\s*Client Address\s*<\/label>\s*<textarea id="standalone-clientAddress"[^>]*\/>\s*<\/div>/, '');
content = content.replace(/<div className="col-span-2 lg:col-span-1">\s*<label[^>]*>\s*Sender Name \/ Company\s*<\/label>\s*<input[^>]*id="standalone-senderName"[^>]*\/>\s*<\/div>/, '');
content = content.replace(/<div className="col-span-2 lg:col-span-1">\s*<label[^>]*>\s*Sender Address\s*<\/label>\s*<textarea id="standalone-senderAddress"[^>]*\/>\s*<\/div>/, '');
content = content.replace(/<div className="col-span-2 lg:col-span-1">\s*<label[^>]*>\s*Logo URL\s*<\/label>\s*<input[^>]*id="standalone-logoUrl"[^>]*\/>\s*<\/div>/, '');

// Remove payload definitions
content = content.replace(/const clientAddress = [^;]+;/, '');
content = content.replace(/const senderName = [^;]+;/, '');
content = content.replace(/const senderAddress = [^;]+;/, '');
content = content.replace(/const logoUrl = [^;]+;/, '');

// Remove from payload object
content = content.replace(/clientAddress,\s*/, '');
content = content.replace(/senderName,\s*/, '');
content = content.replace(/senderAddress,\s*/, '');
content = content.replace(/logoUrl,\s*/, '');

fs.writeFileSync('src/screens/Financials.tsx', content);
