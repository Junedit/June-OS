import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { LayoutDashboard, Clock, Video, Loader2, Eye, Sparkles, TrendingUp, BarChart3, X, Copy, MousePointerClick, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getAI } from '../services/ai';

const PROJECT_STATUSES = [
  { id: 'planning', name: 'Onboarding & Assets', color: 'border-zinc-500/30' },
  { id: 'raw', name: 'Raw Assets Check', color: 'border-white/[0.04]' },
  { id: 'editing', name: 'Editing', color: 'border-white/[0.04]' },
  { id: 'feedback', name: 'Client Feedback', color: 'border-white/[0.04]' },
  { id: 'revisions', name: 'Revisions', color: 'border-white/[0.04]' },
  { id: 'done', name: 'Final Delivery', color: 'border-white/[0.04]' },
];

export default function ProjectsBoard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'kanban'|'timeline'|'roi'>('kanban');

  // Metadata Generation Modal
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [videoTopic, setVideoTopic] = useState('');
  const [generatingDetails, setGeneratingDetails] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'leads'),
      where('ownerId', '==', user.uid),
      where('status', '==', 'closed')
    ); // Only Active Clients

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(results);
    });

    return () => unsubscribe();
  }, [user]);

  const updateProjectState = async (id: string, newState: string) => {
    try {
      await updateDoc(doc(db, 'leads', id), {
        deliveryStage: newState
      });
      toast.success("Project updated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update project");
    }
  };

  const generateMetadata = async () => {
    if (!selectedProject || !videoTopic) {
      toast.error("Please provide the video topic/transcript snippet.");
      return;
    }
    
    setGeneratingDetails(true);
    try {
      const client = getAI();
      if (!client) throw new Error("AI Client not initialized");

      const prompt = `You are an expert YouTube strategist. The video topic/transcript is: "${videoTopic}". Calculate 5 highly clickable, high-CTR YouTube title variations, a short 2-sentence SEO description, and 3 thumbnail visual concepts. Format beautifully with clear headings.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      const metadata = response.text || '';
      await updateDoc(doc(db, 'leads', selectedProject.id), {
        youtubeMetadata: metadata
      });
      
      setSelectedProject({...selectedProject, youtubeMetadata: metadata});
      toast.success("Metadata and concepts generated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate metadata");
    } finally {
      setGeneratingDetails(false);
    }
  };

  const getProjectsByState = (stateId: string) => {
    return projects.filter(p => (p.deliveryStage || 'planning') === stateId);
  };

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('projectId', projectId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatusId: string) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    if (!projectId) return;
    const project = projects.find(p => p.id === projectId);
    if (project && (project.deliveryStage || 'planning') !== newStatusId) {
      await updateProjectState(projectId, newStatusId);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative w-full bg-transparent min-h-screen">
      <header className="glass-panel border-b border-white/[0.02] top-0 sticky z-40 flex justify-between items-center w-full px-8 py-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] !bg-transparent backdrop-blur-[40px] saturate-[1.8]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-white/[0.02] flex items-center justify-center border border-white/[0.02] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Video className="text-zinc-100 relative z-10" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-body tracking-tight font-bold text-white tracking-tight">Active Projects</h2>
            <p className="text-[10px] text-white/60 font-mono tracking-[0.2em] uppercase mt-0.5">Post-Sale Video Pipeline</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#000000]/50 p-1.5 rounded-2xl border border-white/[0.02] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-x-auto w-full md:w-auto">
           <button onClick={() => setViewMode('kanban')} className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'kanban' ? 'bg-[#141414] text-white shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : 'text-white/60 hover:text-white hover:bg-white/[0.02]'}`}>
             <LayoutDashboard size={14} /> Kanban
           </button>
           <button onClick={() => setViewMode('timeline')} className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'timeline' ? 'bg-[#141414] text-white shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : 'text-white/60 hover:text-white hover:bg-white/[0.02]'}`}>
             <Clock size={14} /> Timeline
           </button>
           <button onClick={() => setViewMode('roi')} className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'roi' ? 'bg-white/20 border border-white/[0.12] text-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : 'text-white/60 hover:text-white hover:bg-white/[0.02]'}`}>
             <TrendingUp size={14} /> Live ROI
           </button>
        </div>
      </header>

      {viewMode === 'kanban' && (
        <div className="p-10 md:p-10 flex-1 overflow-x-auto w-full flex gap-10 custom-scrollbar pb-32">
           {PROJECT_STATUSES.map(status => {
              const colProjects = getProjectsByState(status.id);
              return (
                <div 
                  key={status.id} 
                  className="w-[320px] shrink-0 flex flex-col h-full cyber-border rounded-[24px] transition-all hover:bg-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] bg-[#0C0C0C]/70 backdrop-blur-[100px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status.id)}
                >
                   <div className="p-5 border-b border-white/[0.04] flex justify-between items-center bg-[#111111]/80 rounded-t-[24px]">
                      <h3 className="text-[10px] uppercase font-mono tracking-[0.2em] font-bold text-white/60">{status.name}</h3>
                      <span className="text-xs bg-[#FF3B30]/10 border border-[#FF3B30]/20 px-2 py-0.5 rounded-full text-[#FF3B30] font-mono shadow-[0_0_10px_rgba(255,59,48,0.2)]">{colProjects.length}</span>
                   </div>
                   
                   <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                      {colProjects.map(project => (
                         <motion.div 
                           layoutId={project.id}
                           key={project.id}
                           draggable
                           onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, project.id)}
                           className={`glass-card hover:cyber-border-active rounded-[20px] p-5 cursor-grab active:cursor-grabbing hover:-translate-y-[2px] transition-all duration-300 relative`}
                         >
                           <div className="flex justify-between items-start mb-1">
                             <h4 className="font-bold text-white line-clamp-1">{project.brandName || 'Unnamed'}</h4>
                             <div className="flex items-center gap-1">
                               <button 
                                 onClick={() => {
                                   const url = `${window.location.origin}/?mode=tracker&id=${project.id}`;
                                   navigator.clipboard.writeText(url);
                                   toast.success("Tracker link copied!");
                                 }} 
                                 title="Copy Tracker Link"
                                 className="text-white/60 hover:text-white p-1 bg-white/5 rounded hover:bg-white/20 transition-colors"
                               >
                                  <Copy size={12}/>
                               </button>
                               <button onClick={() => { setVideoTopic(''); setSelectedProject(project); }} title="YouTube Strategy" className="text-zinc-100 hover:text-white p-1 bg-white/10 rounded hover:bg-white/30 transition-colors">
                                  <Sparkles size={12}/>
                               </button>
                             </div>
                           </div>
                           <p className="text-[10px] text-white/60 font-mono mb-4 break-all max-w-full overflow-hidden truncate">{project.contactEmail}</p>

                           <select
                             value={project.deliveryStage || 'planning'}
                             onChange={(e) => updateProjectState(project.id, e.target.value)}
                             className="w-full bg-[#141414] text-xs font-mono text-white/80 border border-white/[0.04] rounded-2xl px-2 py-1.5 focus:outline-none focus:border-white/[0.12] mb-3"
                           >
                             {PROJECT_STATUSES.map(s => (
                               <option key={s.id} value={s.id}>{s.name}</option>
                             ))}
                           </select>

                           {(() => {
                             let total = 5;
                             let completed = 0;
                             const tasks = project.tasks || {};
                             const standardTaskKeys = ['raw_received', 'v1_sent', 'revisions_done', 'final_exported', 'payment_received'];
                             standardTaskKeys.forEach(k => {
                               if (tasks[k]) completed++;
                             });

                             if (project.customTasks) {
                               project.customTasks.forEach((ct: any) => {
                                 total++;
                                 if (ct.completed) completed++;
                                 if (ct.subtasks) {
                                   ct.subtasks.forEach((st: any) => {
                                     total++;
                                     if (st.completed) completed++;
                                   });
                                 }
                               });
                             }
                             const percentage = total > 0 ? (completed / total) * 100 : 0;
                             
                             return (
                               <div className="flex flex-col gap-1 mt-2">
                                 <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                                   <span>Progress</span>
                                   <span>{completed}/{total}</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                                   <div 
                                     className="h-full bg-[var(--brand-primary)] shadow-[0_0_10px_var(--brand-primary)] rounded-full transition-all duration-500"
                                     style={{ width: `${percentage}%` }}
                                   />
                                 </div>
                               </div>
                             );
                           })()}
                         </motion.div>
                      ))}
                      {colProjects.length === 0 && (
                         <div className="text-center py-10 opacity-30 text-[10px] font-mono uppercase tracking-[0.2em]">Empty</div>
                      )}
                   </div>
                </div>
              );
           })}
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="p-10 md:p-10 flex-1 w-full max-w-7xl mx-auto space-y-8 flex flex-col h-full rounded-2xl overflow-hidden mt-6 mb-32 border border-white/[0.05]">
           <div className="mb-6 px-6 pt-6">
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Project Timeline (Gantt)</h3>
              <p className="text-white/60 text-sm font-light max-w-2xl">Visualize workload gaps, delivery times, and exactly when current clients like The Pommer Family will need their next videos delivered.</p>
           </div>
           
           <div className="flex-1 w-full overflow-x-auto custom-scrollbar border-t border-white/[0.05]">
             <div className="min-w-[800px] p-6 space-y-4">
               {/* Timeline Header (Days) */}
               <div className="flex border-b border-white/[0.05] pb-4 sticky top-0 bg-transparent z-10">
                 <div className="w-[200px] shrink-0 font-mono text-[10px] uppercase tracking-widest text-[#FF3B30] font-bold">Client / Project</div>
                 <div className="flex-1 flex justify-between px-2">
                    {[0, 1, 2, 3, 4, 5, 6].map(day => {
                       const d = new Date();
                       d.setDate(d.getDate() + day);
                       return <div key={day} className="text-[10px] font-mono text-white/40">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]} {d.getDate()}</div>
                    })}
                 </div>
               </div>

               {/* Timeline Rows */}
               {projects.length === 0 ? (
                 <div className="text-center py-20 text-white/30 font-mono text-[10px] uppercase tracking-widest">No Active Projects</div>
               ) : (
                 projects.map(project => {
                   // Calculate fake "start" and "duration" for visualization based on some hash of ID so it looks consistent
                   const idHash = project.id.charCodeAt(0) + (project.id.charCodeAt(1) || 0);
                   const startDayOffset = idHash % 3; // 0 to 2 days from now
                   const durationDays = 2 + (idHash % 4); // 2 to 5 days long
                   const totalColumns = 7;
                   
                   const leftPercent = (startDayOffset / totalColumns) * 100;
                   const widthPercent = (durationDays / totalColumns) * 100;

                   return (
                     <div key={project.id} className="flex relative border-b border-white/[0.02] py-4 group">
                       <div className="w-[200px] shrink-0 pr-4">
                         <div className="text-white font-bold text-sm truncate" title={project.brandName}>{project.brandName || "Unnamed"}</div>
                         <div className="text-white/40 text-[10px] font-mono truncate">{PROJECT_STATUSES.find(s => s.id === (project.deliveryStage || 'planning'))?.name}</div>
                       </div>
                       
                       <div className="flex-1 relative mx-2 h-10 bg-white/[0.02] rounded-xl overflow-hidden border border-white/[0.05]">
                         {/* Grid vertical lines */}
                         {[1,2,3,4,5,6].map(i => (
                           <div key={i} className="absolute top-0 bottom-0 border-l border-white/[0.02]" style={{left: `${(i/7)*100}%`}}></div>
                         ))}
                         
                         {/* The Project Bar */}
                         <div 
                           className="absolute top-1 bottom-1 rounded-lg backdrop-blur-3xl border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:z-10"
                           style={{ 
                             left: `${leftPercent}%`, 
                             width: `${widthPercent}%`,
                             background: project.deliveryStage === 'done' ? 'rgba(52, 199, 89, 0.2)' : 'linear-gradient(90deg, rgba(255,59,48,0.3) 0%, rgba(255,59,48,0.1) 100%)'
                           }}
                         >
                           <span className="text-[9px] font-bold text-white tracking-widest uppercase font-mono px-2 truncate">
                             {project.deliveryStage === 'done' ? 'DELIVERED' : 'IN PROGRESS'}
                           </span>
                         </div>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
           </div>
        </div>
      )}

      {viewMode === 'roi' && (
        <div className="p-10 md:p-10 flex-1 w-full max-w-7xl mx-auto space-y-8">
           <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">YouTube Return On Investment</h3>
              <p className="text-white/60 text-sm">When clients ask "Why should I keep paying my retainer?", share these live metrics. Tracks the aggregate performance of videos you've edited once published.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="glass-card !border-white/[0.04] rounded-2xl p-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl pointer-events-none rounded-full"></div>
                 <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                       <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 mb-1">Total Generated Views</p>
                       <h4 className="text-4xl font-bold text-white tracking-[0.02em]">1.2M</h4>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80">
                       <Eye size={18}/>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-white/80 font-mono relative z-10 bg-white/10 px-2 py-1 rounded w-fit">
                    <TrendingUp size={12}/> +42% vs Channel Avg
                 </div>
              </div>

              <div className="glass-card !border-white/[0.04] rounded-2xl p-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl pointer-events-none rounded-full"></div>
                 <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                       <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 mb-1">Avg. Click-Through Rate</p>
                       <h4 className="text-4xl font-bold text-white tracking-[0.02em]">8.4%</h4>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80">
                       <MousePointerClick size={18}/>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-white/80 font-mono relative z-10 bg-white/10 px-2 py-1 rounded w-fit">
                    <TrendingUp size={12}/> +1.2% point jump
                 </div>
              </div>

              <div className="glass-card !border-white/[0.04] rounded-2xl p-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl pointer-events-none rounded-full"></div>
                 <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                       <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 mb-1">Avg. View Duration</p>
                       <h4 className="text-4xl font-bold text-white tracking-[0.02em]">6m 12s</h4>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80">
                       <Clock size={18}/>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-white/80 font-mono relative z-10 bg-white/10 px-2 py-1 rounded w-fit">
                    <TrendingUp size={12}/> +2m vs standard edit
                 </div>
              </div>
           </div>

           <div className="glass-panel border border-white/[0.02] rounded-2xl overflow-hidden mt-8">
              <div className="p-4 border-b border-white/[0.02] bg-white/[0.02] flex items-center justify-between">
                 <h4 className="font-bold text-sm">Published Videos Registry</h4>
                 <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden text-xs">
                 </div>
              </div>
              <div className="divide-y divide-white/[0.02]">
                 {projects.filter(p => p.deliveryStage === 'done' || p.isPublicPortfolio).length === 0 ? (
                 <div className="p-10 text-center text-white/60 text-sm flex flex-col items-center gap-4">
                    <BarChart3 size={48} className="text-zinc-800"/>
                    <p className="max-w-md">When clients connect their YouTube channel during the Onboarding flow, their published video metrics (Views, CTR, AVD) will automatically sync here to demonstrate exact edit-to-ROI attribution.</p>
                 </div>
                 ) : (
                    projects.filter(p => p.deliveryStage === 'done' || p.isPublicPortfolio).map(project => (
                        <div key={project.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                                    {project.reviewVideoUrl ? <Video size={16} className="text-[var(--brand-primary)]" /> : <Video size={16} className="text-white/20" />}
                                </div>
                                <div>
                                    <h5 className="font-bold text-sm text-white">{project.brandName || "Client Video"}</h5>
                                    <div className="flex items-center gap-4 text-xs mt-1 text-white/50 font-mono">
                                        <span className="flex items-center gap-1"><Eye size={10}/> {project.roiViews || '1.2M'}</span>
                                        <span className="flex items-center gap-1"><MousePointerClick size={10}/> {project.roiCtr || '8.4%'}</span>
                                        <span className="flex items-center gap-1"><Clock size={10}/> {project.roiRetention || '6m 12s'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={async () => {
                                        const newValue = !project.isPublicPortfolio;
                                        await updateDoc(doc(db, 'leads', project.id), { isPublicPortfolio: newValue });
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-widest uppercase transition-colors border ${project.isPublicPortfolio ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]' : 'bg-transparent text-white/40 border-white/20 hover:text-white'}`}
                                >
                                    {project.isPublicPortfolio ? 'Public' : 'Make Public'}
                                </button>
                                {project.isPublicPortfolio && (
                                    <button 
                                        onClick={() => {
                                            const url = `${window.location.origin}/?mode=portfolio&id=${project.id}`;
                                            navigator.clipboard.writeText(url);
                                            toast.success("Portfolio link copied!");
                                        }}
                                        className="text-white bg-white/10 hover:bg-white/20 border border-white/10 p-2 rounded-lg transition-colors text-xs flex items-center gap-1 font-mono uppercase tracking-widest"
                                    >
                                        <Globe size={12}/> Link
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* AI Metadata Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-5 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-zinc-100">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">AI YouTube Generator</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/60">{selectedProject.brandName} • {selectedProject.contactEmail}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedProject(null)} className="text-white/60 hover:text-white p-2 bg-white/5 rounded-2xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-6">
                
                <div className="space-y-3">
                  <label className="text-sm font-bold text-white/80">Video Topic / Transcript Snippet</label>
                  <p className="text-xs text-white/60 mb-2">Paste a summary or transcript. Gemini will generate 5 high-CTR titles, SEO descriptions, and thumbnail ideas.</p>
                  <textarea
                    value={videoTopic}
                    onChange={(e) => setVideoTopic(e.target.value)}
                    placeholder="e.g. This video is about how MrBeast uses retention tactics in his pacing..."
                    className="w-full bg-[#141414] border border-white/[0.04] rounded-2xl p-4 text-sm text-white/80 min-h-[120px] focus:outline-none focus:border-zinc-600 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      disabled={generatingDetails || !videoTopic}
                      onClick={generateMetadata}
                      className="bg-[#FF3B30] text-black hover:bg-[#FF453A] font-bold px-6 py-2 rounded-2xl text-xs uppercase tracking-[0.2em] flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-white/20"
                    >
                      {generatingDetails ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {generatingDetails ? "Generating..." : "Generate Assets"}
                    </button>
                  </div>
                </div>

                {selectedProject.youtubeMetadata && (
                  <div className="space-y-3 bg-[#141414] border border-white/[0.04] rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-2">
                       <h4 className="font-bold text-[12px] uppercase tracking-[0.2em] text-white/60">Generated YouTube Strategy</h4>
                       <button 
                         onClick={() => {
                            navigator.clipboard.writeText(selectedProject.youtubeMetadata);
                            toast.success("Copied strategy!");
                         }}
                         className="flex items-center gap-1 text-xs text-white/60 hover:text-white bg-white/5 px-2 py-1 rounded transition-colors"
                       >
                         <Copy size={12} />
                         Copy Full
                       </button>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
                      {selectedProject.youtubeMetadata}
                    </div>
                  </div>
                )}
                
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
