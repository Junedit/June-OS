const fs = require('fs');
let code = fs.readFileSync('src/screens/Financials.tsx', 'utf8');

const replacement = `
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })()}
        </div>
      </div>

      {pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-[#111] rounded-xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-[#0a0a0a]">
              <h3 className="text-white font-bold font-mono">Invoice PDF Preview</h3>
              <div className="flex gap-2">
                 <a href={pdfPreviewUrl} download={\`Invoice-\${livePreviewData?.invoiceNumber || 'draft'}.pdf\`} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 transition">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                   Download
                 </a>
                 <button onClick={() => setPdfPreviewUrl(null)} className="text-zinc-400 hover:text-white p-2">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                 </button>
              </div>
            </div>
            <iframe src={pdfPreviewUrl} className="w-full flex-grow bg-zinc-900 border-none"></iframe>
          </div>
        </div>
      )}
      
      {templateModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
           <div className="w-full max-w-2xl bg-[#0a0a0a] rounded-xl p-8 border border-zinc-800">
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">Custom Template HTML</h2>
              <input type="text" value={editTemplateName} onChange={e => setEditTemplateName(e.target.value)} placeholder="Template Name" className="w-full bg-[#111] border border-zinc-800 rounded p-3 text-white mb-4" />
              <textarea value={editTemplateHtml} onChange={e => setEditTemplateHtml(e.target.value)} rows={12} className="w-full bg-[#111] border border-zinc-800 rounded p-3 text-white font-mono text-xs" />
              <div className="flex justify-end gap-4 mt-6">
                 <button onClick={() => setTemplateModalOpen(false)} className="px-4 py-2 text-zinc-400">Cancel</button>
                 <button onClick={async () => {
                    setTemplateModalOpen(false);
                 }} className="bg-[var(--brandColor)] text-white px-6 py-2 rounded font-bold">Save</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
`;

code = code + replacement;
fs.writeFileSync('src/screens/Financials.tsx', code);
