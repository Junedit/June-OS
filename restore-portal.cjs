const fs = require('fs');

const original = `import React, { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CheckCircle, Clock, Video, Lock, Loader2, ArrowRight, Play, MessageSquare, CreditCard, Download, ExternalLink, FileSignature } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const TRACKER_STEPS = [
  { key: 'raw_received', label: 'Raw Footage Received', description: 'Raw assets delivered and verified.' },
  { key: 'v1_sent', label: 'V1 Rough Cut', description: 'First draft sent for your review.' },
  { key: 'revisions_done', label: 'Revisions Addressed', description: 'Your notes have been applied.' },
  { key: 'final_exported', label: 'Final Edit Exported', description: 'High-res final video rendering.' },
  { key: 'payment_received', label: 'Payment Received', description: 'Balance cleared, assets unlocked.' }
];

export default function ClientPortal() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<any>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [editorSettings, setEditorSettings] = useState<any>(null);
  
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const leadId = searchParams.get('id');
  const proposalId = searchParams.get('proposal');

  useEffect(() => {
    if (proposalId) {
      const propRef = doc(db, 'proposals', proposalId);
      const unsubscribe = onSnapshot(propRef, (docSnap) => {
        if (docSnap.exists()) {
          setProposal(docSnap.data());
        } else {
          setError("Proposal not found.");
        }
        setLoading(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'proposals');
        setError("Error loading proposal.");
        setLoading(false);
      });
      return () => unsubscribe();
    }

    if (!leadId) {
      setError("Invalid tracker link. No project ID provided.");
      setLoading(false);
      return;
    }

    const leadRef = doc(db, 'leads', leadId);
    
    const unsubscribe = onSnapshot(leadRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!data.tasks) {
           data.tasks = {
             raw_received: false, v1_sent: false, revisions_done: false, final_exported: false, payment_received: false
           };
        }
        if (!data.feedback) data.feedback = [];
        setLead(data);
        
        // Fetch editor's settings to get payment link
        if (data.ownerId && !editorSettings) {
            try {
               const settingsSnap = await getDoc(doc(db, 'settings', data.ownerId));
               if (settingsSnap.exists()) {
                   setEditorSettings(settingsSnap.data());
               }
            } catch(e) { }
        }
      } else {
        setError("Project not found. It may have been archived or deleted.");
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'leads');
      setError("Error loading project data.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [leadId]);

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || !leadId) return;
    setSubmittingFeedback(true);
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        feedback: arrayUnion({
          text: feedbackText,
          timestamp: new Date().toISOString(),
          type: 'client'
        })
      });
      setFeedbackText('');
    } catch(e) {
      console.error("Error submitting feedback:", e);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleApproveVideo = async () => {
    if (submittingFeedback || !leadId) return;
    setSubmittingFeedback(true);
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        feedback: arrayUnion({
          text: "✅ CLIENT APPROVED VIDEO - Proceed to final delivery.",
          timestamp: new Date().toISOString(),
          type: 'client'
        })
      });
      toast.success('Approval registered.');
    } catch(err) {
      console.error(err);
      toast.error('Failed to mark approval.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-white w-8 h-8" />
      </div>
    );
  }

  if (error || (!lead && !proposal)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-zinc-300 font-mono text-sm max-w-md mx-auto text-center p-6">
        <div>
          <Lock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-2 font-headline">Secure Access Denied</h2>
          <p>{error || "Project/Proposal not found."}</p>
        </div>
      </div>
    );
  }

  if (proposal) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white p-6 pb-32 flex justify-center">
        <div className="w-full max-w-3xl mt-12">
           <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-zinc-800">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                   <FileSignature size={20} />
                </div>
                <div>
                   <h1 className="text-2xl font-bold font-headline">{proposal.title}</h1>
                   <p className="text-white/40 text-sm font-mono">\${Number(proposal.amount || 0).toLocaleString()} USD</p>
                </div>
             </div>
             <div className="prose prose-invert prose-p:text-white/60 prose-headings:text-white mb-10 w-full max-w-none whitespace-pre-wrap">
               {proposal.content || 'No content provided'}
             </div>
             
             {proposal.status !== 'signed' ? (
                <div className="border-t border-zinc-800 pt-6 mt-6 flex flex-col gap-4">
                   <h3 className="text-white font-bold">Accept & Sign</h3>
                   <button 
                     onClick={async () => {
                       try {
                         await updateDoc(doc(db, 'proposals', proposalId!), { 
                           status: 'signed',
                           signedAt: new Date().toISOString()
                         });
                         toast.success('Proposal accepted & signed!');
                       } catch(e) {
                         toast.error('Failed to sign');
                       }
                     }}
                     className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-xs px-6 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                   >
                     Agree and Accept
                   </button>
                </div>
             ) : (
                <div className="border-t border-zinc-800 pt-6 mt-6 flex flex-col gap-4">
                   <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 flex items-center gap-3">
                      <CheckCircle size={20} />
                      <div>
                        <p className="font-bold">Proposal Accepted</p>
                        <p className="text-xs opacity-70">Timestamp: {proposal.signedAt}</p>
                      </div>
                   </div>
                </div>
             )}
           </div>
        </div>
      </div>
    );
  }

  // Calculate progress
  const completedTasks = TRACKER_STEPS.filter(step => lead.tasks[step.key]).length;
  const totalTasks = TRACKER_STEPS.length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-300 font-body relative overflow-x-hidden flex items-center justify-center p-6 py-20">
      
      {/* Ambients */}
      <motion.div 
         initial={{ opacity: 0, scale: 0.8 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: 2, ease: "easeOut" }}
         className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-500/[0.03] rounded-full blur-[120px] pointer-events-none z-0"
       />
      
      <div className="w-full max-w-2xl relative z-10 flex flex-col gap-8">
        
        {/* Header */}
        <motion.div 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="text-center"
         >
           <div className="mx-auto mb-6 flex flex-col items-center justify-center">
             {editorSettings?.portalLogoUrl ? (
                <img src={editorSettings.portalLogoUrl} alt="Agency Logo" className="h-12 object-contain mb-4" />
             ) : (
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.02)] mb-4">
                  <Video className="text-[var(--color-red)]" size={24} />
                </div>
             )}
             <div className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--color-red)] mb-2 font-bold">{editorSettings?.portalAgencyName || editorSettings?.displayName || "Video Agency"}</div>
           </div>
           <h1 className="text-3xl md:text-5xl font-headline font-black bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent mb-2 leading-tight tracking-tight">Project Tracker</h1>
           <p className="text-zinc-500 max-w-md mx-auto">Live status & deliverables for <span className="text-white font-medium">{lead.brandName}</span></p>
        </motion.div>

        {/* Status Card and Deliverables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Tracker Card */}
          <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
             className="bg-[#1a1a1a] border border-zinc-800 backdrop-blur-2xl rounded-sm p-8 shadow-2xl h-full"
           >
            <div className="flex justify-between items-end mb-6 border-b border-zinc-800 pb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono mb-2">Protocol Status</p>
                <h2 className="text-3xl font-light tracking-tight text-white">{progressPercent}% Sync</h2>
              </div>
              {progressPercent === 100 && (
                  <div className="text-[var(--color-red)] text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 ">
                    <CheckCircle size={12} /> Execution Complete
                  </div>
              )}
            </div>
            
            {/* Timeline Steps */}
            <div className="flex flex-col gap-0 relative">
              <div className="absolute left-3.5 top-4 bottom-4 w-px bg-zinc-800 z-0"></div>

              {TRACKER_STEPS.map((step, idx) => {
                const isCompleted = lead.tasks[step.key];
                const isNext = !isCompleted && (idx === 0 || lead.tasks[TRACKER_STEPS[idx - 1].key]);

                return (
                  <motion.div 
                      key={step.key} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + (idx * 0.1) }}
                      className="relative z-10 flex gap-6 p-4 rounded-sm -mx-4 transition-colors hover:bg-zinc-900/50"
                    >
                    <div className="shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div className="w-7 h-7 rounded-sm bg-[var(--color-red)] text-[#0f0f0f] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.2)]">
                          <CheckCircle size={14} />
                        </div>
                      ) : isNext ? (
                        <div className="w-7 h-7 rounded-sm border-l-2 border-[var(--color-red)] bg-[var(--color-red)]/10 text-[var(--color-red)] flex items-center justify-center">
                          <Loader2 size={14} className="animate-spin" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-sm bg-transparent border border-zinc-800 text-zinc-600 flex items-center justify-center">
                          <Clock size={14} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 pb-2 border-b border-zinc-900/50">
                      <h3 className={\`text-sm tracking-wide font-light \${isCompleted ? 'text-white' : isNext ? 'text-[var(--color-red)]' : 'text-zinc-600'}\`}>
                        {step.label}
                      </h3>
                      <p className={\`text-[10px] font-mono mt-1.5 uppercase tracking-wider \${isCompleted || isNext ? 'text-zinc-500' : 'text-zinc-700'}\`}>
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Asset Links */}
            {(lead.rawFootageUrl || lead.projectFilesUrl) && (
              <div className="mt-8 pt-6 border-t border-zinc-800 space-y-3">
                 <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-4">Project Assets</h3>
                 {lead.rawFootageUrl && (
                   <a href={lead.rawFootageUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-sm border border-zinc-800 hover:border-zinc-600 transition-colors group">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-sm bg-black border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                           <ExternalLink size={14} />
                         </div>
                         <div>
                            <p className="text-sm text-white font-medium">Raw Footage Drop</p>
                            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Upload / View Original Media</p>
                         </div>
                      </div>
                   </a>
                 )}
                 {lead.projectFilesUrl && (
                   <a href={lead.projectFilesUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-sm border border-zinc-800 hover:border-zinc-600 transition-colors group">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-sm bg-black border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-[var(--color-red)] transition-colors">
                           <ExternalLink size={14} />
                         </div>
                         <div>
                            <p className="text-sm text-white font-medium">Project Delivery Files</p>
                            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Premiere Pro / After Effects</p>
                         </div>
                      </div>
                   </a>
                 )}
              </div>
            )}
          </motion.div>

          {/* Interactive Deliverables Right Panel */}
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
             className="flex flex-col gap-6"
           >
             {/* Media Review Block */}
             <div className="bg-[#0f0f0f] border border-zinc-800 backdrop-blur-2xl rounded-sm p-6 shadow-2xl flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Canvas Review</h3>
                  {(lead.tasks.v1_sent || lead.tasks.final_exported) && (
                     <span className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--color-red)] bg-[var(--color-red)]/5 px-2 py-1 rounded-sm border border-[var(--color-red)]/20 uppercase tracking-widest"><Video size={10}/> Frame Active</span>
                  )}
                </div>

                {/* Video Player Mockup / Real Viewer */}
                <div className="w-full aspect-video bg-black border border-zinc-800 rounded-sm relative group overflow-hidden mb-6 flex-shrink-0 flex items-center justify-center">
                  {(lead.tasks.v1_sent || lead.tasks.final_exported) ? (
                    lead.reviewVideoUrl ? (
                      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-zinc-900 z-20">
                         <Video size={48} className="text-zinc-700 mb-4" />
                         <a href={lead.reviewVideoUrl} target="_blank" rel="noreferrer" className="bg-[var(--color-red)] hover:bg-[var(--color-red-bright)] text-black font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-sm flex items-center gap-2">
                           <ExternalLink size={14} /> Open Review Video Link
                         </a>
                      </div>
                    ) : (
                      <>
                        <img src="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80" alt="Video Preview" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        <div className="w-16 h-16 rounded-full bg-black/50 border border-zinc-600 backdrop-blur-md flex items-center justify-center z-10 cursor-pointer hover:scale-105 hover:bg-[var(--color-red)] text-white hover:text-black transition-all">
                          <Play size={24} fill="currentColor" className="ml-1" />
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 h-1 bg-zinc-800 rounded-full overflow-hidden backdrop-blur-sm">
                           <div className="h-full bg-[var(--color-red)] w-1/3"></div>
                        </div>
                      </>
                    )
                  ) : (
                    <div className="text-zinc-600 text-[10px] uppercase font-mono tracking-widest flex flex-col items-center gap-3">
                      <Clock size={20} className="text-zinc-700" />
                      Awaiting initial render...
                    </div>
                  )}
                </div>

                {/* Feedback Chat */}
                <div className="flex-1 flex flex-col min-h-[200px]">
                   <div className="flex-1 overflow-y-auto mb-4 space-y-3 custom-scrollbar pr-2">
                     {(!lead.feedback || lead.feedback.length === 0) && (
                       <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 text-center italic mt-4">No comm logs generated.</p>
                     )}
                     {lead.feedback?.map((fb: any, idx: number) => (
                        <div key={idx} className={\`flex \${fb.type === 'client' ? 'justify-end' : 'justify-start'}\`}>
                           <div className={\`max-w-[85%] p-3 rounded-sm text-sm font-light \${fb.type === 'client' ? 'bg-zinc-900 border border-zinc-800 text-zinc-200' : 'bg-transparent border border-zinc-800 text-zinc-400'}\`}>
                             <p>{fb.text}</p>
                             <span className="text-[8px] font-mono uppercase opacity-40 mt-2 block tracking-widest">
                               {new Date(fb.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                           </div>
                        </div>
                     ))}
                   </div>
                   
                   {/* Input */}
                   <div className="relative mt-auto">
                     <textarea 
                       value={feedbackText}
                       onChange={e => setFeedbackText(e.target.value)}
                       placeholder={(lead.tasks.v1_sent || lead.tasks.final_exported) ? "Add frame notes or feedback..." : "Awaiting assets before notes..."}
                       disabled={!(lead.tasks.v1_sent || lead.tasks.final_exported) || submittingFeedback}
                       className="w-full bg-[#1a1a1a] border border-zinc-800 p-4 pt-3 pb-12 rounded-sm text-sm font-light text-white focus:outline-none focus:border-zinc-600 resize-none placeholder-zinc-700"
                       rows={2}
                     />
                     <div className="absolute bottom-3 left-3 flex gap-2">
                         {lead.tasks.final_exported && !lead.tasks.payment_received && (
                           <button onClick={handleApproveVideo} disabled={submittingFeedback} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-20 rounded-sm transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                             <CheckCircle size={12}/> Approve Video
                           </button>
                         )}
                     </div>
                     <button 
                       onClick={handleFeedbackSubmit}
                       disabled={!feedbackText.trim() || submittingFeedback}
                       className="absolute bottom-3 right-3 p-2 bg-[var(--color-red)] text-black hover:bg-[var(--color-red-bright)] disabled:opacity-20 rounded-sm transition-colors"
                     >
                       {submittingFeedback ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                     </button>
                   </div>
                </div>
             </div>

             {/* Payment Gateway Block (Shown when final exported but not paid) */}
             {lead.tasks.final_exported && !lead.tasks.payment_received && (
               <div className="bg-gradient-to-br from-[var(--color-red)]/10 to-[#cc0000]/5 border border-[var(--color-red)]/20 p-6 rounded-sm flex flex-col justify-between gap-6 shadow-[0_0_30px_rgba(255,0,0,0.05)]">
                 <div>
                   <h4 className="text-[var(--color-red)] font-headline text-lg tracking-tight mb-1">Clear Asset Delivery</h4>
                   <p className="text-[10px] font-mono text-[var(--color-red)]/60 uppercase tracking-widest">Invoice #{leadId.slice(0, 6)} • \${lead.budget?.toLocaleString()}</p>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                   {editorSettings?.stripeLink && (
                     <a href={editorSettings.stripeLink} target="_blank" rel="noreferrer" className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.2)] whitespace-nowrap">
                       Pay via Stripe
                     </a>
                   )}
                   {editorSettings?.paypalLink && (
                     <a href={editorSettings.paypalLink} target="_blank" rel="noreferrer" className="flex-1 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,112,186,0.2)] whitespace-nowrap">
                       Pay via PayPal
                     </a>
                   )}
                   {editorSettings?.wiseLink && (
                     <a href={editorSettings.wiseLink} target="_blank" rel="noreferrer" className="flex-1 bg-[#9fe870] hover:bg-[#85d354] text-black font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(159,232,112,0.2)] whitespace-nowrap">
                       Pay via Wise
                     </a>
                   )}
                   {editorSettings?.paymentLink && (
                     <a href={editorSettings.paymentLink} target="_blank" rel="noreferrer" className="flex-1 bg-[var(--color-red)] hover:bg-[var(--color-red-bright)] text-black font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,0,0,0.2)] whitespace-nowrap">
                       <CreditCard size={14} /> Fulfill Invoice
                     </a>
                   )}
                   
                   {(!editorSettings?.stripeLink && !editorSettings?.paypalLink && !editorSettings?.wiseLink && !editorSettings?.paymentLink) && (
                     <button disabled className="w-full opacity-50 cursor-not-allowed sm:w-auto bg-[var(--color-red)] hover:bg-[var(--color-red-bright)] text-black font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-sm flex items-center justify-center gap-2 transition-transform shadow-[0_0_20px_rgba(255,0,0,0.2)] whitespace-nowrap">
                        <CreditCard size={14} /> Fulfill Invoice (Not Configured)
                     </button>
                   )}
                 </div>
               </div>
             )}

             {/* Asset Delivery Block (Shown when paid) */}
             {lead.tasks.payment_received && (
               <div className="bg-[#0f0f0f] border border-[var(--color-red)]/30 p-6 rounded-sm flex flex-col sm:flex-row justify-between items-center gap-6 shadow-[0_0_30px_rgba(255,0,0,0.05)]">
                 <div>
                   <h4 className="text-white font-headline text-lg tracking-tight mb-1">Assets Unlocked</h4>
                   <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Master File Available (ProRes 422)</p>
                 </div>
                 <a href={lead.masterFileUrl || '#'} target={lead.masterFileUrl ? "_blank" : "_self"} rel="noreferrer" className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap">
                    <Download size={14} /> {lead.masterFileUrl ? 'Download Master' : 'Link Pending'}
                 </a>
               </div>
             )}
          </motion.div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-[10px] text-white/20 font-mono tracking-widest mt-12 pb-8 uppercase">
           Sys. Auth: June OS Operations Node
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/screens/ClientPortal.tsx', original);
console.log('Restored');
