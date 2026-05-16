const fs = require('fs');
let content = fs.readFileSync('src/screens/Settings.tsx', 'utf8');

// Fix the array destructuring
content = content.replace(
  /const \[portalAgencyName,\s+websiteUrl,\s+instagramHandle,\s+twitterHandle,\s+youtubeUrl, setPortalAgencyName\] = useState\(''\);/,
  `const [portalAgencyName, setPortalAgencyName] = useState('');`
);

// Now in handleSave, we need to add the fields.
// Let's find handleSave
let handleSaveIdx = content.indexOf('const handleSave');
if (handleSaveIdx !== -1) {
  let docUpdateIdx = content.indexOf('portalAgencyName,', handleSaveIdx);
  if (docUpdateIdx !== -1) {
    content = content.substring(0, docUpdateIdx) + 
      "portalAgencyName,\n        websiteUrl,\n        instagramHandle,\n        twitterHandle,\n        youtubeUrl," + 
      content.substring(docUpdateIdx + "portalAgencyName,".length);
  }
}

fs.writeFileSync('src/screens/Settings.tsx', content);
console.log('Fixed Settings.tsx');
