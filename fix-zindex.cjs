const fs = require('fs');
const files = [
  'src/screens/ClientOnboardingPortal.tsx',
  'src/screens/ClientPortal.tsx',
  'src/screens/ClientVideoReviewHub.tsx',
  'src/screens/PublicIntakeView.tsx',
  'src/screens/SalesRoomView.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/z-\[1\]/g, 'z-0');
  content = content.replace(/z-\[0\]/g, 'z-0');
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
