const fs = require('fs');
let code = fs.readFileSync('src/screens/LeadsDashboard.tsx', 'utf8');

// Add motion import
if (!code.includes("import { motion } from 'motion/react';")) {
  code = code.replace(
    "import { toast } from 'sonner';", 
    "import { toast } from 'sonner';\nimport { motion } from 'motion/react';"
  );
}

// Fade in header section
code = code.replace(
  '<div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-white/5 gap-4">',
  '<motion.div \n        initial={{ opacity: 0, y: -10 }}\n        animate={{ opacity: 1, y: 0 }}\n        transition={{ duration: 0.5 }}\n        className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-white/5 gap-4"\n      >'
);
code = code.replace(
  '          </div>\n        </div>\n      </div>',
  '          </div>\n        </div>\n      </motion.div>'
);

// Map rows stagger animation
code = code.replace(
  '<div key={lead.id} className="group bg-[#0f0f0f] border border-white/5 rounded-xl mb-3 hover:border-white/10 transition-colors cursor-pointer overflow-hidden relative">',
  '<motion.div \n                  key={lead.id} \n                  initial={{ opacity: 0, y: 10 }}\n                  animate={{ opacity: 1, y: 0 }}\n                  transition={{ duration: 0.3, delay: (Math.random() % 0.3) }}\n                  className="group bg-[#0f0f0f] border border-white/5 rounded-xl mb-3 hover:border-white/10 transition-colors cursor-pointer overflow-hidden relative"\n                >'
);

// Map rows closing tag replace
const oldRowsClose = '                  </div>\n                </div>\n              </div>\n            </div>';
const newRowsClose = '                  </div>\n                </div>\n              </div>\n            </motion.div>';
if(code.includes(oldRowsClose)) {
   code = code.replace(oldRowsClose, newRowsClose);
} else {
   // A bit looser matching
   code = code.replace(
     /<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\}\)/g,
     '  </div>\n                  </div>\n                </div>\n              </motion.div>\n            })'
   );
}


fs.writeFileSync('src/screens/LeadsDashboard.tsx', code);
