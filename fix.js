const fs = require('fs');
let code = fs.readFileSync('src/screens/LeadsDashboard.tsx', 'utf8');

code = code.replace(
  '            <        {/* Global Action Bar */}',
  '            </button>\\n        </div>\\n\\n        {/* Global Action Bar */}'
);

const search2 = '         {/* Body */} )}\\n         </div>\\n \\n         {/* Body */}';
code = code.replace(search2, '         {/* Body */}');

// Let's just fix it properly with a robust regex:
code = code.replace(/<button onClick=\{onClose\}[\s\S]*?<X size=\{16\} \/>\n\s*?<\s*\{\/\* Global Action Bar \*\/\}/g, 
  '<button onClick={onClose} className="text-slate-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 text-xs rounded-full ml-auto">\\n<X size={16} />\\n</button>\\n</div>\\n\\n{/* Global Action Bar */}');

code = code.replace(/\{\/\* Body \*\/\} \)\}\n\s*<\/div>\n\s*\{\/\* Body \*\/\}/g, 
  '           </>\\n         )}\\n       </div>\\n    </div>\\n\\n    {/* Body */}');

fs.writeFileSync('src/screens/LeadsDashboard.tsx', code);
