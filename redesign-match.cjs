const fs = require('fs');
const path = require('path');

const files = [
  'src/screens/ClientPortal.tsx',
  'src/screens/SalesRoomView.tsx',
  'src/screens/ClientOnboardingPortal.tsx',
  'src/screens/ClientVideoReviewHub.tsx',
];

const noiseBg = `
        {/* Subtle grid and gradient */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 z-[0] pointer-events-none mix-blend-overlay"></div>
        <div className="fixed inset-0 bg-gradient-to-br from-white/[0.02] via-black to-black z-[1] pointer-events-none"></div>
`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // ClientPortal.tsx
  if (file.includes('ClientPortal.tsx')) {
    content = content.replace(
      '<motion.div \n        initial={{ opacity: 0 }}\n        animate={{ opacity: 1 }}\n        transition={{ duration: 1.5, ease: "easeInOut" }}\n        className="min-h-screen text-white p-10 pb-32 flex justify-center relative overflow-hidden"\n        style={{ backgroundColor: \'#050505\', backgroundImage: brandGlow }}\n      >',
      `<motion.div \n        initial={{ opacity: 0 }}\n        animate={{ opacity: 1 }}\n        transition={{ duration: 1.5, ease: "easeInOut" }}\n        className="min-h-screen text-white p-10 pb-32 flex justify-center relative overflow-hidden bg-black"\n      >\n${noiseBg}`
    );
    // Also remove the old ambient radial gradient elements if they are still there
    content = content.replace(
      '<div className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-20">\n            <div className="w-full h-full" style={{ background: `radial-gradient(ellipse at 50% -20%, ${brandColor}40, transparent 60%)` }} />\n        </div>',
      ''
    );
  }

  // SalesRoomView.tsx
  if (file.includes('SalesRoomView.tsx')) {
    content = content.replace(
      '<div className="bg-[#000000] text-white font-sans antialiased min-h-screen relative overflow-x-hidden selection:bg-white/30 selection:text-white">',
      `<div className="bg-black text-white font-sans antialiased min-h-screen relative overflow-x-hidden selection:bg-brand-primary selection:text-white">\n${noiseBg}`
    );
    // remove the huge blurred circles
    content = content.replace(/<div className="absolute inset-0 pointer-events-none overflow-hidden">[\s\S]*?<\/div>\n      <header/g, '<header');
  }

  // ClientOnboardingPortal.tsx
  if (file.includes('ClientOnboardingPortal.tsx')) {
    content = content.replace(
      '<div className="bg-[#000000] text-white font-sans antialiased min-h-screen relative flex flex-col selection:bg-white/30 selection:text-white">',
      `<div className="bg-black text-white font-sans antialiased min-h-screen relative flex flex-col selection:bg-brand-primary selection:text-white">\n${noiseBg}`
    );
    // remove the huge blurred circles
    content = content.replace(/<div className="absolute inset-0 pointer-events-none overflow-hidden">[\s\S]*?<\/div>\n      <header/g, '<header');
  }

  // ClientVideoReviewHub.tsx
  if (file.includes('ClientVideoReviewHub.tsx')) {
    content = content.replace(
      '<div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white/30 flex flex-col md:flex-row relative overflow-hidden">',
      `<div className="min-h-screen bg-black text-white font-sans selection:bg-brand-primary flex flex-col md:flex-row relative overflow-hidden">\n${noiseBg}`
    );
  }

  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});
