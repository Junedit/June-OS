const fs = require('fs');
let src = fs.readFileSync('src/screens/LeadsDashboard.tsx', 'utf8');

const exportFunction = `
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

if(!src.includes('handleExportCSV')) {
    src = src.replace('  const handle1ClickEmail = async () => {', exportFunction + '\n  const handle1ClickEmail = async () => {');
    
    const buttonStr = `<button onClick={() => setViewMode(viewMode === 'pipeline' ? 'analytics' : 'pipeline')} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-medium">`;
    const exportBtnStr = `<button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors text-sm font-medium">
          <Download size={16} /> Export CSV
        </button>`;
        
    src = src.replace(buttonStr, exportBtnStr + '\n        ' + buttonStr);
    
    fs.writeFileSync('src/screens/LeadsDashboard.tsx', src);
}
