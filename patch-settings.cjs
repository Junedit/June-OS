const fs = require('fs');

let content = fs.readFileSync('src/screens/Settings.tsx', 'utf8');

// Add state variables
content = content.replace(
  /const \[portalAgencyName, setPortalAgencyName\] = useState\(''\);/,
  `const [portalAgencyName, setPortalAgencyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');`
);

// Add to loadSettings
content = content.replace(
  /setPortalAgencyName\(data\.portalAgencyName \|\| ''\);/,
  `setPortalAgencyName(data.portalAgencyName || '');
          setWebsiteUrl(data.websiteUrl || '');
          setInstagramHandle(data.instagramHandle || '');
          setTwitterHandle(data.twitterHandle || '');
          setYoutubeUrl(data.youtubeUrl || '');`
);

// Add to handleSave
content = content.replace(
  /portalAgencyName,/,
  `portalAgencyName,
        websiteUrl,
        instagramHandle,
        twitterHandle,
        youtubeUrl,`
);

// Add inputs to UI
const inputs = `
             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">Website URL</label>
               <input 
                 type="url" 
                 value={websiteUrl}
                 onChange={e => setWebsiteUrl(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                 placeholder="https://yourportfolio.com"
               />
             </div>
             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">Instagram Handle</label>
               <input 
                 type="text" 
                 value={instagramHandle}
                 onChange={e => setInstagramHandle(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                 placeholder="@username"
               />
             </div>
             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">X / Twitter Handle</label>
               <input 
                 type="text" 
                 value={twitterHandle}
                 onChange={e => setTwitterHandle(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                 placeholder="@username"
               />
             </div>
             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">YouTube URL</label>
               <input 
                 type="url" 
                 value={youtubeUrl}
                 onChange={e => setYoutubeUrl(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                 placeholder="https://youtube.com/c/yourchannel"
               />
             </div>
`;

content = content.replace(
  /<div>\s*<label className="block text-\[10px\] text-white\/50 uppercase tracking-\[0.2em\] mb-3 font-mono">Calendar Endpoint \(Follow-Ups\)<\/label>/,
  inputs + '\n             <div>\n               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">Calendar Endpoint (Follow-Ups)</label>'
);

fs.writeFileSync('src/screens/Settings.tsx', content);
console.log('Settings modified.');
