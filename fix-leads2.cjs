const fs = require('fs');

let src = fs.readFileSync('src/screens/LeadsDashboard.tsx', 'utf8');

// 1. Fix duplicate reviewVideoUrl

src = src.replace('  reviewVideoUrl?: string;\n  id: string;', '  id: string;');
src = src.replace('  tasks?: Record<string, boolean>;\n  customTasks?: { id: string; title: string; completed: boolean }[];\n  reviewVideoUrl?: string;', '  tasks?: Record<string, boolean>;\n  customTasks?: { id: string; title: string; completed: boolean }[];');


// 2. Move handleExportCSV below useState
const regex = /  const handleExportCSV = \(\) => \{[\s\S]*?toast\.success\([^)]+\);\n  };\n/g;
let match = src.match(regex);

if (match) {
  src = src.replace(regex, '');
  src = src.replace('  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);', '  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);\n\n' + match[0]);
}

fs.writeFileSync('src/screens/LeadsDashboard.tsx', src);
