const fs = require('fs');
let content = fs.readFileSync('src/screens/ClientPortal.tsx', 'utf8');

// Import icons
content = content.replace(
  /import \{ CheckCircle, Clock, Video, Lock, Loader2, ArrowRight, Play, MessageSquare, CreditCard, Download, ExternalLink, FileSignature \} from 'lucide-react';/,
  `import { CheckCircle, Clock, Video, Lock, Loader2, ArrowRight, Play, MessageSquare, CreditCard, Download, ExternalLink, FileSignature, Globe, Instagram, Twitter, Youtube } from 'lucide-react';`
);

// Modify header to include profile info
const newHeader = `
        {/* Editor Profile Header */}
        <motion.div 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="bg-[#1a1a1a] border border-zinc-800 rounded-sm p-6 shadow-2xl backdrop-blur-2xl mb-2 flex flex-col md:flex-row items-center justify-between gap-6"
         >
           <div className="flex flex-col md:flex-row items-center gap-6">
             {editorSettings?.portalLogoUrl ? (
                <img src={editorSettings.portalLogoUrl} alt="Agency Logo" className="w-20 h-20 rounded-full object-cover border-2 border-zinc-800" />
             ) : (
                <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                  <Video className="text-[var(--color-red)]" size={32} />
                </div>
             )}
             <div className="text-center md:text-left">
               <h1 className="text-2xl font-headline font-black text-white mb-1">{editorSettings?.displayName || "Video Editor"}</h1>
               <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--color-red)] mb-3 font-bold">{editorSettings?.portalAgencyName || "Video Agency"}</p>
               {editorSettings?.bio && (
                 <p className="text-sm text-zinc-400 max-w-lg mb-4">{editorSettings.bio}</p>
               )}
               <div className="flex items-center justify-center md:justify-start gap-3">
                 {editorSettings?.websiteUrl && (
                   <a href={editorSettings.websiteUrl} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full">
                     <Globe size={16} />
                   </a>
                 )}
                 {editorSettings?.instagramHandle && (
                   <a href={\`https://instagram.com/\${editorSettings.instagramHandle.replace('@', '')}\`} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full">
                     <Instagram size={16} />
                   </a>
                 )}
                 {editorSettings?.twitterHandle && (
                   <a href={\`https://twitter.com/\${editorSettings.twitterHandle.replace('@', '')}\`} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full">
                     <Twitter size={16} />
                   </a>
                 )}
                 {editorSettings?.youtubeUrl && (
                   <a href={editorSettings.youtubeUrl} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors p-2 bg-zinc-900 rounded-full">
                     <Youtube size={16} />
                   </a>
                 )}
               </div>
             </div>
           </div>
           
           <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-zinc-800 pt-6 md:pt-0 md:pl-6 w-full md:w-auto">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono mb-2">Project Client</p>
              <h2 className="text-xl font-light tracking-tight text-white mb-1">{lead.brandName}</h2>
              <p className="text-sm text-zinc-500">Live Status & Deliverables</p>
           </div>
        </motion.div>
`;

content = content.replace(
  /\{\/\* Header \*\/\}\s*<motion\.div[\s\S]*?<\/motion\.div>/,
  newHeader
);


// Project Assets modifications
const newAssetsSection = `
            {/* Project Assets */}
            <div className="mt-8 pt-6 border-t border-zinc-800 space-y-4">
               <h3 className="text-xs font-headline tracking-widest uppercase text-white">Project Assets</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="flex flex-col gap-3 p-4 bg-zinc-900/40 rounded-sm border border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <Video size={16} />
                      <span className="text-xs font-mono uppercase tracking-widest">Raw Footage</span>
                    </div>
                    {lead.rawFootageUrl ? (
                      <a href={lead.rawFootageUrl} target="_blank" rel="noreferrer" className="bg-[var(--color-red)]/10 text-[var(--color-red)] hover:bg-[var(--color-red)] hover:text-black transition-colors rounded-sm py-2 px-4 text-xs font-bold uppercase tracking-widest text-center border border-[var(--color-red)]/20">
                        Access Drive/Folder
                      </a>
                    ) : (
                      <div className="bg-zinc-900 text-zinc-600 rounded-sm py-2 px-4 text-xs font-bold uppercase tracking-widest text-center border border-zinc-800 cursor-not-allowed">
                        Awaiting Upload
                      </div>
                    )}
                 </div>
                 
                 <div className="flex flex-col gap-3 p-4 bg-zinc-900/40 rounded-sm border border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <Download size={16} />
                      <span className="text-xs font-mono uppercase tracking-widest">Final Delivery</span>
                    </div>
                    {lead.masterFileUrl ? (
                      <a href={lead.masterFileUrl} target="_blank" rel="noreferrer" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors rounded-sm py-2 px-4 text-xs font-bold uppercase tracking-widest text-center border border-blue-500/20 flex items-center justify-center gap-2">
                        <Download size={14}/> Download Master
                      </a>
                    ) : lead.projectFilesUrl ? (
                       <a href={lead.projectFilesUrl} target="_blank" rel="noreferrer" className="bg-zinc-800 hover:bg-zinc-700 text-white transition-colors rounded-sm py-2 px-4 text-xs font-bold uppercase tracking-widest text-center border border-zinc-700">
                        Project Files Available
                      </a>
                    ) : (
                      <div className="bg-zinc-900 text-zinc-600 rounded-sm py-2 px-4 text-xs font-bold uppercase tracking-widest text-center border border-zinc-800 cursor-not-allowed">
                        Awaiting Export
                      </div>
                    )}
                 </div>
               </div>
            </div>
`;

content = content.replace(
  /\{\/\* Asset Links \*\/\}\s*\{\(lead\.rawFootageUrl \|\| lead\.projectFilesUrl\) && \([\s\S]*?\}\)[\s\S]*?<\/motion\.div>/,
  newAssetsSection + '\n          </motion.div>'
);

fs.writeFileSync('src/screens/ClientPortal.tsx', content);
console.log('Portal modified.');
