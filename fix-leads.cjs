const fs = require('fs');

let src = fs.readFileSync('src/screens/LeadsDashboard.tsx', 'utf8');

const exportFunc = `
  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast.error("No leads to export.");
      return;
    }
    
    const headers = ['Brand Name', 'Contact Name', 'Email', 'Budget', 'Status', 'Date Created'];
    const escapeCsv = (str) => \`"\${(str || '').toString().replace(/"/g, '""')}"\`;
    const rows = leads.map(l => [
      escapeCsv(l.brandName),
      escapeCsv(l.contactName),
      escapeCsv(l.contactEmail),
      escapeCsv(l.budget?.toString()),
      escapeCsv(l.status),
      escapeCsv(l.createdAt?.toDate ? format(l.createdAt.toDate(), 'yyyy-MM-dd') : '')
    ].join(','));
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pipeline_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(\`Exported \${leads.length} leads to CSV.\`);
  };
`;

// remove handleExportCSV from anywhere it currently is
const regex = /const handleExportCSV = \(\) => \{[\s\S]*?toast\.success\([^)]+\);\n  };\n/g;
src = src.replace(regex, '');

// put it inside LeadsDashboard
src = src.replace('export default function LeadsDashboard() {', 'export default function LeadsDashboard() {' + exportFunc);


// fix Lead interface
src = src.replace('interface Lead {', 'interface Lead {\n  masterFileUrl?: string;\n  reviewVideoUrl?: string;');

fs.writeFileSync('src/screens/LeadsDashboard.tsx', src);
