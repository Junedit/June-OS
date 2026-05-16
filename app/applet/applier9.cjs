const fs = require('fs');
const path = require('path');

const targetPath = path.join(process.cwd(), 'src/screens/Financials.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const anchor = '{/* Predictive MRR & Cashflow Forecast */}';
const targetIndex = content.indexOf(anchor);

if (targetIndex === -1) {
    console.error('Anchor not found!');
    process.exit(1);
}

const insertion = `        {/* Actual Historical Revenue Chart */}
        <section className="mb-8 glass-panel border border-white/5 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
           <div className="flex justify-between items-end mb-8 relative z-10">
              <div>
                 <h3 className="text-xl font-headline font-black text-white flex items-center gap-3">
                   <BarChartIcon size={24} className="text-[var(--color-red)]" /> Historical Revenue
                 </h3>
                 <p className="text-zinc-500 font-mono text-sm mt-2">Your actual closed revenue over the last 6 months.</p>
              </div>
           </div>
           
           <div className="h-64 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={revenueData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                   <XAxis dataKey="month" stroke="none" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} dy={10} />
                   <YAxis stroke="none" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} dx={-10} tickFormatter={(value) => \`$\${value.toLocaleString()}\`} />
                   <Tooltip 
                     cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                     contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(10px)', padding: '12px' }}
                     itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                     labelStyle={{ color: '#71717a', marginBottom: '8px', fontSize: '10px', fontWeight: 'bold' }}
                     formatter={(val: number) => \`$\${val.toLocaleString()}\`}
                   />
                   <Bar dataKey="revenue" fill="var(--color-red)" radius={[4, 4, 0, 0]} name="Revenue" />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </section>

        `;

content = content.substring(0, targetIndex) + insertion + content.substring(targetIndex);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Success');
