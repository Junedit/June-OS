const fs = require('fs');
let code = fs.readFileSync('src/screens/ClientPortal.tsx', 'utf8');

const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
   if (lines[i] === '         </div>' && lines[i+1] === '' && lines[i+2] === '         {/* Status Card and Deliverables Grid */}') {
       lines[i] = '         </motion.div>';
   }
   
   if (lines[i] === '          </div>' && lines[i+1] === '' && lines[i+2] === '          {/* Interactive Deliverables Right Panel */}') {
       lines[i] = '          </motion.div>';
   }
   
   if (lines[i] === '          </div>' && lines[i+1] === '        </div>' && lines[i+2] === '        ' && lines[i+3] === '        {/* Footer */}') {
       lines[i] = '          </motion.div>';
   }
}

fs.writeFileSync('src/screens/ClientPortal.tsx', lines.join('\n'));
