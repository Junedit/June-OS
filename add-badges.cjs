const fs = require('fs');
let content = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const statusBadgeLogic = `                        <td className="py-4 px-4 font-mono text-zinc-300 text-sm">
                          {getCurrencySymbol(inv.currency)}
                          {Number(inv.amount || 0).toLocaleString()}{" "}
                          <span className="text-xs text-zinc-600">
                            ({getCurrencySymbol(inv.currency)}
                            {Number(inv.amountPaid || 0).toLocaleString()} paid)
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {(() => {
                            const total = Number(inv.amount || 0);
                            const paid = Number(inv.amountPaid || 0);
                            const isOverdue = inv.dueDate ? new Date(inv.dueDate) < new Date() && paid < total : false;
                            
                            if (paid >= total) return <span className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">Paid</span>;
                            if (isOverdue) return <span className="bg-red-500/10 text-red-500 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">Overdue</span>;
                            if (paid > 0) return <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">Partial</span>;
                            return <span className="bg-zinc-500/10 text-zinc-400 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">Unpaid</span>;
                          })()}
                        </td>`;

content = content.replace(/<td className="py-4 px-4 font-mono text-zinc-300 text-sm">[\s\S]*?paid\)\s*<\/span>\s*<\/td>/, statusBadgeLogic);

// Add a column header for the new status column
content = content.replace(/<th className="py-3 px-4 font-normal text-zinc-500">Amount<\/th>\s*<th className="py-3 px-4 text-right font-normal text-zinc-500">Actions<\/th>/,
  '<th className="py-3 px-4 font-normal text-zinc-500">Amount</th>\n<th className="py-3 px-4 font-normal text-zinc-500">Status</th>\n<th className="py-3 px-4 text-right font-normal text-zinc-500">Actions</th>');

fs.writeFileSync('src/screens/Financials.tsx', content);
