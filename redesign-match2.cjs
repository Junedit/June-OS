const fs = require('fs');

const files = [
  'src/screens/ClientPortal.tsx',
];

const noiseBg = `
       {/* Subtle grid and gradient */}
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 z-[0] pointer-events-none mix-blend-overlay"></div>
       <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-black to-black z-[1] pointer-events-none"></div>
`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // ClientPortal.tsx part 2
  if (file.includes('ClientPortal.tsx')) {
    content = content.replace(
      '<div className="min-h-screen bg-[#0f0f0f] text-white/80 font-body relative overflow-x-hidden flex items-center justify-center p-10 py-20">',
      `<div className="min-h-screen bg-black text-white/80 font-body relative overflow-x-hidden flex items-center justify-center p-10 py-20">\n${noiseBg}`
    );
     content = content.replace(/<div className="fixed inset-0 flex items-center justify-center bg-\[#000000\]/g, '<div className="fixed inset-0 flex items-center justify-center bg-black');
  }

  fs.writeFileSync(file, content);
  console.log('Updated ClientPortal part 2');
});
