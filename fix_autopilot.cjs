const fs = require('fs');
let src = fs.readFileSync('src/screens/Prospector.tsx', 'utf8');

// Needs to be careful with imports
if (!src.includes('useEffect')) {
  src = src.replace('import React, { useState }', 'import React, { useState, useEffect }');
}

// Add state after agentProgress
if (!src.includes('autopilotOn')) {
  src = src.replace(
    /const \[agentProgress, setAgentProgress\] = useState\(\"\"\);/,
    `const [agentProgress, setAgentProgress] = useState("");
  
  const [autopilotOn, setAutopilotOn] = useState(() => {
    return localStorage.getItem('autopilotOn') === 'true';
  });
  const [autopilotNiche, setAutopilotNiche] = useState(() => {
    return localStorage.getItem('autopilotNiche') || 'OVERALL';
  });

  useEffect(() => {
    localStorage.setItem('autopilotOn', String(autopilotOn));
    localStorage.setItem('autopilotNiche', autopilotNiche);
  }, [autopilotOn, autopilotNiche]);

  useEffect(() => {
    if (autopilotOn && user) {
      const lastRun = localStorage.getItem('autopilotLastRunDate');
      const today = new Date().toISOString().split('T')[0];
      if (lastRun !== today && !agentLoading) {
         console.log("Triggering daily AI Autopilot...");
         handleRunAgent(true).catch(console.error);
      }
    }
  }, [autopilotOn, user]);
`
  );
}

// modify handleRunAgent signature
src = src.replace(
  /const handleRunAgent = async \(\) => {/,
  `const handleRunAgent = async (isBackground = false) => {
    if (!user) return;
    if (agentLoading) return;
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('autopilotLastRunDate', today);
    
    setAgentLoading(true);
    if (!isBackground) setAgentProgress("Initializing AI Agent...");
    if (isBackground) toast("🤖 AI Autopilot started daily scan in background...");
    const targetNiche = autopilotNiche === 'OVERALL' ? 'High value YouTube channels hiring editors' : autopilotNiche;
`
);

// modify the bulk generation call
src = src.replace(
  /const channels = await generateBulkChannelLeads\("OVERALL", 10, 50000, "Global"\);/,
  `const channels = await generateBulkChannelLeads(targetNiche, 10, 50000, "Global");`
);

// update toast
src = src.replace(
  /toast\.success\(\`Agent successfully deployed! \$\{addedCount\} highly-qualified leads added to pipeline.\`\);/,
  `toast.success(\`AI Autopilot completed! \${addedCount} highly-qualified leads added to pipeline.\`);`
);


// update the modal UI to have the on/off switch and niche select
const newModalUi = `
      {/* Radar Setting Modal */}
      {radarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-emerald-900/50 rounded-xl p-8 max-w-lg w-full shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-white flex items-center gap-3">
                <Brain size={20} className="text-emerald-400" /> AI Autopilot Agent
              </h3>
              <button disabled={agentLoading} onClick={() => setRadarModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors disabled:opacity-50">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-zinc-400 text-sm mb-6">
              Enable the Autopilot to wake up every morning, scan globally for the Top 10 absolute best highly-qualified leads in your selected niche, generate hyper-personalized pitches, and push them to your pipeline.
            </p>

            <div className="space-y-6 mb-8">
               <div className="flex items-center justify-between bg-zinc-900/50 p-4 border border-zinc-800 rounded-lg">
                  <div>
                     <h4 className="text-white text-sm font-bold flex items-center gap-2">
                        <Activity size={16} className={autopilotOn ? "text-emerald-500" : "text-zinc-500"} />
                        Daily Autopilot
                     </h4>
                     <p className="text-xs text-zinc-500 mt-1">Runs automatically once every 24 hours.</p>
                  </div>
                  <button 
                    onClick={() => {
                        const nextState = !autopilotOn;
                        setAutopilotOn(nextState);
                        if (nextState) {
                           toast.success("Autopilot Enabled. It will run in the background.");
                           // Optionally reset last run date if they want to run it immediately when turned on
                           localStorage.removeItem('autopilotLastRunDate'); 
                        }
                    }}
                    className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none \${autopilotOn ? "bg-emerald-500" : "bg-zinc-700"}\`}
                  >
                    <span className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${autopilotOn ? "translate-x-6" : "translate-x-1"}\`} />
                  </button>
               </div>

               <div className="space-y-3">
                 <label className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Target Niche</label>
                 <select 
                   value={autopilotNiche}
                   onChange={(e) => setAutopilotNiche(e.target.value)}
                   className="w-full bg-[#0a0a0a] border border-zinc-800 text-white rounded-lg p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                 >
                    <option value="OVERALL">Overal (All Niches)</option>
                    {YOUTUBE_NICHES.filter(n => !n.startsWith('🔥')).map(n => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                 </select>
               </div>
            </div>

            {agentLoading ? (
               <div className="flex flex-col items-center justify-center py-8 gap-4 border border-zinc-800 rounded-lg bg-black/50 mb-8">
                  <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                  <p className="text-emerald-400 text-xs font-mono uppercase tracking-widest animate-pulse">{agentProgress}</p>
               </div>
            ) : (
                <div className="flex flex-col gap-4 mb-4">
                   <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-lg flex items-start gap-3">
                     <AlertTriangle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                     <p className="text-xs text-emerald-200/70 font-mono leading-relaxed">
                       You can just leave this ON and it will run silently. Or, if you want immediate results right now, run it manually below.
                     </p>
                   </div>
                </div>
            )}
            
            <div className="flex gap-4">
               <button 
                 disabled={agentLoading}
                 onClick={() => setRadarModalOpen(false)} 
                 className="flex-1 bg-transparent border border-zinc-800 hover:bg-zinc-800 text-white font-bold py-3 rounded-lg transition-colors font-mono uppercase tracking-widest text-xs disabled:opacity-50"
               >
                 Close
               </button>
               <button 
                 disabled={agentLoading}
                 onClick={() => handleRunAgent(false)}
                 className="flex-[2] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50 font-bold py-3 rounded-lg transition-colors font-mono uppercase tracking-[0.2em] text-[10px] sm:text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 <Sparkles size={14} /> {agentLoading ? 'Agent Working...' : 'Force Run Now'}
               </button>
            </div>
          </div>
        </div>
      )}
`;


src = src.replace(/\{\/\* Radar Setting Modal \*\/\}[\s\S]*?(?=\s*<\/div>\s*\n\s*\);\s*\n\})/g, newModalUi);

fs.writeFileSync('src/screens/Prospector.tsx', src);
