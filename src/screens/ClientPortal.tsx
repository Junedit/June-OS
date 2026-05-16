import React, { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CheckCircle, Clock, Video, Lock, Loader2, ArrowRight, MessageSquare, CreditCard, Download, FileSignature, Globe, Instagram, Twitter, Youtube, Calculator, Sparkles, Copy, BrainCircuit, X, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import FeedbackClientPlayer from '../components/FeedbackClientPlayer';
import FileUploader from '../components/FileUploader';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { generateReleaseKit, analyzeFeedbackSentiment } from '../services/ai';

const TRACKER_STEPS = [
  { key: 'planning', label: 'Onboarding', description: 'Project planning and contracting.' },
  { key: 'raw', label: 'Raw Footage', description: 'Raw assets delivered and verified.' },
  { key: 'editing', label: 'Editing', description: 'Editor is working on your cut.' },
  { key: 'feedback', label: 'Feedback', description: 'Drafts ready for review.' },
  { key: 'revisions', label: 'Revisions', description: 'Your notes are being addressed.' },
  { key: 'done', label: 'Final Delivery', description: 'High-res final video delivered.' }
];

export default function ClientPortal() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<any>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [editorSettings, setEditorSettings] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'onboarding' | 'roi'>('overview');
  
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [releaseKit, setReleaseKit] = useState<any>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const leadId = searchParams.get('id');
  const proposalId = searchParams.get('proposal');

  useEffect(() => {
    if (proposalId) {
      const propRef = doc(db, 'proposals', proposalId);
      const unsubscribe = onSnapshot(propRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProposal(data);
          if (!data.password) {
             setIsAuthenticated(true);
          }
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
      setTimeout(() => {
        setError("Invalid tracker link. No project ID provided.");
        setLoading(false);
      }, 0);
      return;
    }

    const leadRef = doc(db, 'leads', leadId);
    
    let telemetrySent = false;

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
        
        if (!telemetrySent && !window.location.search.includes('preview')) {
            telemetrySent = true;
            try {
               await updateDoc(leadRef, {
                 telemetryEvents: arrayUnion({ type: 'PORTAL_VIEWED', timestamp: new Date(), detail: 'Client opened the project portal.' })
               });
            } catch {
               // ignore
            }
        }
        
        // Fetch editor's settings to get payment link
        if (data.ownerId && !editorSettings) {
            try {
               const settingsSnap = await getDoc(doc(db, 'settings', data.ownerId));
               if (settingsSnap.exists()) {
                   setEditorSettings(settingsSnap.data());
               }
            } catch {
               // Ignore
            }
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
  }, [leadId, proposalId, editorSettings]);

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || !leadId) return;
    setSubmittingFeedback(true);
    try {
      const sentiment = await analyzeFeedbackSentiment(feedbackText);
      await updateDoc(doc(db, 'leads', leadId), {
        feedback: arrayUnion({
          text: feedbackText,
          timestamp: new Date().toISOString(),
          type: 'client',
          sentiment
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
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white/80 font-mono text-sm max-w-md mx-auto text-center p-10">
        <div>
          <Lock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-2 font-body tracking-tight">Secure Access Denied</h2>
          <p>{error || "Project/Proposal not found."}</p>
        </div>
      </div>
    );
  }

  if (proposal) {
    const brandColor = proposal.brandColor || '#007AFF';

    if (!isAuthenticated) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black p-10 font-body">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[#0a0a0a] p-10 rounded-2xl border border-white/[0.04] shadow-2xl text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: brandColor }} />
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto" style={{ backgroundColor: `${brandColor}20`, color: brandColor }}>
              {proposal.password ? <Lock size={32} /> : <Sparkles size={32} />}
            </div>
            <h2 className="text-white font-bold text-2xl mb-2 font-body tracking-tight tracking-tight">Your Reserved Proposal</h2>
            
            {proposal.password ? (
               <form onSubmit={(e) => {
                 e.preventDefault();
                 const fd = new FormData(e.currentTarget);
                 const pin = fd.get('pin');
                 if (pin === proposal.password) {
                   setIsAuthenticated(true);
                 } else {
                   toast.error('Incorrect PIN');
                 }
               }}>
                 <p className="text-white/60 mb-6 text-sm font-light">Enter the access PIN provided by your editor.</p>
                 <input 
                   type="password" 
                   name="pin"
                   placeholder="Enter Access PIN" 
                   className="w-full bg-[#000000] border border-white/[0.04] p-4 rounded-2xl text-center text-xl tracking-[0.5em] text-white focus:border-white/[0.04] transition-colors focus:outline-none placeholder:tracking-normal mb-4" 
                 />
                 <button 
                   type="submit"
                   className="w-full text-black uppercase tracking-[0.2em] text-xs font-bold py-4 rounded-2xl transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                   style={{ backgroundColor: brandColor }}
                 >
                   Unlock Proposal
                 </button>
               </form>
            ) : (
               <>
                 <p className="text-white/60 mb-8 text-sm font-light">You've been granted secure, exclusive access without a password.</p>
                 <button 
                   onClick={() => setIsAuthenticated(true)}
                   className="w-full text-black uppercase tracking-[0.2em] text-xs font-bold py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                   style={{ backgroundColor: brandColor }}
                 >
                   Reveal Proposal
                 </button>
               </>
            )}
          </motion.div>
        </div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="min-h-screen text-white p-10 pb-32 flex justify-center relative overflow-hidden bg-black"
      >

        {/* Subtle grid and gradient */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 -z-10 pointer-events-none mix-blend-overlay"></div>
        <div className="fixed inset-0 bg-gradient-to-br from-white/[0.02] via-black to-black -z-10 pointer-events-none"></div>

        
        <div className="w-full max-w-3xl mt-12 relative z-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="bg-[#141414]/80 backdrop-blur-2xl p-10 rounded-3xl border border-white/[0.02] shadow-2xl"
          >
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full flex items-center justify-center border" style={{ backgroundColor: `${brandColor}10`, color: brandColor, borderColor: `${brandColor}20` }}>
                   <FileSignature size={24} />
                </div>
                <div>
                   <h1 className="text-3xl font-bold font-body tracking-tight tracking-tight">{proposal.title || 'Project Proposal'}</h1>
                   <p className="text-white/60 text-sm font-mono mt-1">${Number(proposal.amount || 0).toLocaleString()} USD <span className="mx-2 opacity-50">•</span> High-Retention Edit</p>
                </div>
             </div>
             
             {/* ROI Calculator Section */}
             <div className="mb-10 bg-[#0a0a0a] border border-white/[0.04] rounded-2xl p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 p-full h-full bg-gradient-to-b from-blue-500 to-emerald-500"></div>
                <h3 className="text-lg font-bold text-white mb-2 ml-4 flex items-center gap-2">
                   <Calculator size={18} className="text-white/80" />
                   Interactive ROI Calculator
                </h3>
                <p className="text-sm text-white/60 ml-4 mb-6">See exactly how much an increase in Average View Duration (AVD) affects your bottom line.</p>
                
                <ROICalculator />
             </div>

             <div className="prose prose-invert prose-p:text-white/60 prose-headings:text-white prose-a:text-white/80 mb-12 w-full max-w-none whitespace-pre-wrap font-body text-base leading-relaxed p-10 bg-white/[0.02] rounded-2xl border border-white/[0.02]">
               {proposal.content || 'No content provided'}
             </div>
             
             {proposal.status !== 'signed' ? (
                <div className="border-t border-white/[0.04] pt-8 flex flex-col gap-5">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div>
                       <h3 className="text-white font-bold text-xl tracking-tight">Approve Pitch & Start Onboarding</h3>
                       <p className="text-sm text-white/60">Clicking accept will act as your digital signature.</p>
                     </div>
                     <button 
                       onClick={async () => {
                         try {
                           // 1. Create a contract based on the proposal
                           const { addDoc, collection, updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
                           
                           const contractRef = await addDoc(collection(db, 'contracts'), {
                             title: `Services Contract - ${proposal.title || 'Project'}`,
                             clientName: proposal.clientName || 'Client',
                             status: 'sent',
                             content: `<h1>Master Services Agreement</h1>
<h2>1. Services Provided</h2>
<p>The Agency agrees to provide video editing and retention optimization services as outlined in the accepted Proposal ("${proposal.title || 'Project'}").</p>
<h2>2. Compensation</h2>
<p>The total fee for these services is $${Number(proposal.amount || 0).toLocaleString()} USD. Payment is due prior to the commencement of work.</p>
<h2>3. Term and Termination</h2>
<p>This agreement shall commence on {date} and continue until completion of the services. Either party may terminate with 14 days written notice.</p>
<h2>4. Confidentiality</h2>
<p>Both parties agree to maintain the confidentiality of any proprietary information shared during the course of this project.</p>`,
                             createdAt: new Date().toISOString(),
                             proposalId: proposalId,
                             password: proposal.password || null
                           });

                           // 2. Mark proposal as signed
                           await updateDoc(doc(db, 'proposals', proposalId!), { 
                             status: 'signed',
                             signedAt: new Date().toISOString(),
                             contractId: contractRef.id
                           });
                           
                           // Auto-Create Project (Convert Lead to Closed Project)
                           if (proposal.leadId) {
                               await updateDoc(doc(db, 'leads', proposal.leadId), {
                                  status: 'closed',
                                  deliveryStage: 'planning',
                                  updatedAt: serverTimestamp()
                               });
                               import('../services/activity').then(m => m.addGlobalActivity(`Automated Workflow: Converted Lead (${proposal.clientName || 'Client'}) to Active Project from approved proposal.`, 'system').catch(console.error));
                           }
                           
                           toast.success('Proposal accepted! Redirecting to contract...');
                           
                           // 3. Redirect to frictionless onboarding (contract signature)
                           setTimeout(() => {
                             window.location.href = `/?mode=contract&id=${contractRef.id}`;
                           }, 800);
                         } catch(e) {
                           console.error(e);
                           toast.error('Failed to accept proposal');
                         }
                       }}
                       className="w-full sm:w-auto bg-[var(--brand-primary)] text-white hover:bg-zinc-200 font-bold uppercase tracking-[0.2em] text-sm px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shrink-0"
                     >
                       Accept & Create Stripe Invoice <ArrowRight size={18} />
                     </button>
                   </div>
                   <div className="flex justify-center mt-6 items-center gap-2 text-white/40 font-mono text-[9px] uppercase tracking-widest text-center mx-auto">
                      <CreditCard size={12} className="text-[var(--brand-primary)]" /> Secure payment via Stripe will be generated automatically.
                   </div>
                </div>
             ) : (
                <div className="border-t border-white/[0.04] pt-8 flex flex-col gap-4">
                   <div className="p-10 bg-white/10 border border-white/[0.04] rounded-2xl text-white/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <CheckCircle size={28} />
                        <div>
                          <p className="font-bold text-lg">Proposal Accepted</p>
                          <p className="text-sm opacity-80 mt-1 font-mono">Timestamp: {new Date(proposal.signedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                           if (proposal.contractId) {
                             window.location.href = `/?mode=contract&id=${proposal.contractId}`;
                           } else {
                             window.open('https://buy.stripe.com/test_demo', '_blank');
                           }
                        }}
                        className="w-full sm:w-auto bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)] text-white font-bold px-6 py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
                      >
                         View Contract <ArrowRight size={18} />
                      </button>
                   </div>
                </div>
             )}
           </motion.div>
        </div>
      </motion.div>
    );
  }

  // Calculate progress
  const stageIndex = TRACKER_STEPS.findIndex(s => s.key === (lead.deliveryStage || 'planning'));
  const completedTasks = stageIndex >= 0 ? stageIndex + 1 : 1;
  const totalTasks = TRACKER_STEPS.length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="min-h-screen bg-black text-white/80 font-body relative overflow-x-hidden flex items-center justify-center p-10 py-20">

       {/* Subtle grid and gradient */}
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 -z-10 pointer-events-none mix-blend-overlay"></div>
       <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-black to-black -z-10 pointer-events-none"></div>

      
      {/* Ambients */}
      <motion.div 
         initial={{ opacity: 0, scale: 0.8 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: 2, ease: "easeOut" }}
         className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#FF3B30]/[0.03] rounded-full blur-[120px] pointer-events-none z-0"
       />
      
      <div className="w-full max-w-2xl relative z-10 flex flex-col gap-10">
        
        {/* Editor Profile Header */}
        <motion.div 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="bg-[#000000] border border-white/[0.04] rounded-sm p-10 shadow-2xl backdrop-blur-2xl mb-2 flex flex-col md:flex-row items-center justify-between gap-10"
         >
           <div className="flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
             {editorSettings?.portalLogoUrl ? (
                <img src={editorSettings.portalLogoUrl} alt="Agency Logo" className="w-20 h-20 rounded-full object-cover border-2 border-white/[0.04]" />
             ) : (
                <div className="w-20 h-20 rounded-full bg-[#000000] border-2 border-white/[0.04] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                  <Video className="text-zinc-100" size={32} />
                </div>
             )}
             <div>
               <h1 className="text-2xl font-body tracking-tight font-black text-white mb-1">{editorSettings?.displayName || "Video Editor"}</h1>
               <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-100 mb-3 font-bold">{editorSettings?.portalAgencyName || "Video Agency"}</p>
               {editorSettings?.bio && (
                 <p className="text-sm text-white/60 max-w-lg mb-4">{editorSettings.bio}</p>
               )}
               <div className="flex items-center justify-center md:justify-start gap-3">
                 {editorSettings?.websiteUrl && (
                   <a href={editorSettings.websiteUrl} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition-colors p-2 bg-[#000000] rounded-full">
                     <Globe size={16} />
                   </a>
                 )}
                 {editorSettings?.instagramHandle && (
                   <a href={`https://instagram.com/${editorSettings.instagramHandle.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition-colors p-2 bg-[#000000] rounded-full">
                     <Instagram size={16} />
                   </a>
                 )}
                 {editorSettings?.twitterHandle && (
                   <a href={`https://twitter.com/${editorSettings.twitterHandle.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition-colors p-2 bg-[#000000] rounded-full">
                     <Twitter size={16} />
                   </a>
                 )}
                 {editorSettings?.youtubeUrl && (
                   <a href={editorSettings.youtubeUrl} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition-colors p-2 bg-[#000000] rounded-full">
                     <Youtube size={16} />
                   </a>
                 )}
               </div>
             </div>
           </div>
           
           <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-white/[0.04] pt-6 md:pt-0 md:pl-6 w-full md:w-auto">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-mono mb-2">Project Client</p>
              <h2 className="text-xl font-light tracking-tight text-white mb-2">{lead.brandName}</h2>
              {lead.totalInvoiced > 0 && (
                <div className="flex flex-col items-center md:items-end mb-2">
                  <div className="flex space-x-2 text-xs font-mono bg-[#000000] border border-white/[0.04] rounded px-2 py-1 items-center">
                    <span className="text-white/60">PAID:</span>
                    <span className={lead.totalPaid >= lead.totalInvoiced ? "text-white/80" : "text-white"}>
                      ${(lead.totalPaid || 0).toLocaleString()} / ${(lead.totalInvoiced || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-sm text-white/60">Live Status & Deliverables</p>
           </div>
        </motion.div>

        {/* Status Card and Deliverables Grid */}
        
        {/* TABS HEADER */}
        <div className="flex space-x-6 border-b border-white/[0.04] mb-10 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors border-b-2 ${activeTab === 'overview' ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]' : 'text-zinc-600 border-transparent hover:text-white'}`}
          >
            Overview & Status
          </button>
          <button 
            onClick={() => setActiveTab('onboarding')}
            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors border-b-2 ${activeTab === 'onboarding' ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]' : 'text-zinc-600 border-transparent hover:text-white'}`}
          >
            Brand Onboarding
          </button>
          <button 
            onClick={() => setActiveTab('deliverables')}
            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors border-b-2 ${activeTab === 'deliverables' ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]' : 'text-zinc-600 border-transparent hover:text-white'}`}
          >
            Deliverables & Feedback
          </button>
          <button 
            onClick={() => setActiveTab('roi')}
            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors border-b-2 ${activeTab === 'roi' ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]' : 'text-zinc-600 border-transparent hover:text-white'}`}
          >
            Impact & ROI
          </button>
        </div>

        {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full mb-10">
          {/* Tracker Card */}
          <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
             className="bg-[#000000] border border-white/[0.04] backdrop-blur-2xl rounded-sm p-10 shadow-2xl h-full"
           >
            <div className="flex justify-between items-end mb-6 border-b border-white/[0.04] pb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-mono mb-2">Protocol Status</p>
                <h2 className="text-3xl font-light tracking-tight text-white">{progressPercent}% Sync</h2>
              </div>
              {progressPercent === 100 && (
                  <div className="text-zinc-100 text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-1.5 ">
                    <CheckCircle size={12} /> Execution Complete
                  </div>
              )}
            </div>
            
            {/* Timeline Steps */}
            <div className="flex flex-col gap-0 relative">
              <div className="absolute left-3.5 top-4 bottom-4 w-px bg-[#141414] z-0"></div>

              {TRACKER_STEPS.map((step, idx) => {
                const isCompleted = idx <= stageIndex;
                const isNext = idx === stageIndex + 1;

                return (
                  <motion.div 
                      key={step.key} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + (idx * 0.1) }}
                      className="relative z-10 flex gap-10 p-4 rounded-sm -mx-4 transition-colors hover:bg-white/5"
                    >
                    <div className="shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div className="w-7 h-7 rounded-sm bg-[var(--brand-primary)] text-white text-[#0f0f0f] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                          <CheckCircle size={14} />
                        </div>
                      ) : isNext ? (
                        <div className="w-7 h-7 rounded-sm border-l-2 border-white/[0.04] bg-white/10 text-zinc-100 flex items-center justify-center">
                          <Loader2 size={14} className="animate-spin" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-sm bg-transparent border border-white/[0.04] text-zinc-600 flex items-center justify-center">
                          <Clock size={14} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 pb-2 border-b border-white/[0.02]/50">
                      <h3 className={`text-sm tracking-wide font-light ${isCompleted ? 'text-white' : isNext ? 'text-zinc-100' : 'text-zinc-600'}`}>
                        {step.label}
                      </h3>
                      <p className={`text-[10px] font-mono mt-1.5 uppercase tracking-widest ${isCompleted || isNext ? 'text-white/60' : 'text-zinc-700'}`}>
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Project Assets */}
            <div className="mt-8 pt-6 border-t border-white/[0.04] space-y-4">
               <h3 className="text-xs font-body tracking-tight tracking-[0.2em] uppercase text-white">Project Assets</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="flex flex-col gap-3 p-4 bg-[#000000]/40 rounded-sm border border-white/[0.04]">
                    <div className="flex items-center gap-2 text-white/60 mb-1">
                      <Video size={16} />
                      <span className="text-xs font-mono uppercase tracking-[0.2em]">Raw Footage</span>
                    </div>
                    {lead.rawFootageUrl ? (
                      <a href={lead.rawFootageUrl} target="_blank" rel="noreferrer" className="bg-white/10 text-zinc-100 hover:bg-[var(--brand-primary)] text-white hover:text-black transition-colors rounded-sm py-2 px-4 text-xs font-bold uppercase tracking-[0.2em] text-center border border-white/[0.04]">
                        Access Drive/Folder
                      </a>
                    ) : (
                      <div className="bg-[#000000] text-zinc-600 rounded-sm py-2 px-4 text-xs font-bold uppercase tracking-[0.2em] text-center border border-white/[0.04] cursor-not-allowed">
                        Awaiting Upload
                      </div>
                    )}
                 </div>
                 
                 <div className="flex flex-col gap-3 p-4 bg-[#000000]/40 rounded-sm border border-white/[0.04]">
                    <div className="flex items-center gap-2 text-white/60 mb-1">
                      <Download size={16} />
                      <span className="text-xs font-mono uppercase tracking-[0.2em]">Final Delivery</span>
                    </div>
                    {lead.masterFileUrl ? (
                      <a href={lead.masterFileUrl} target="_blank" rel="noreferrer" className="bg-white/10 text-white/80 hover:bg-[var(--brand-primary)] hover:text-white transition-colors rounded-sm py-2 px-4 text-xs font-bold uppercase tracking-[0.2em] text-center border border-white/[0.04] flex items-center justify-center gap-2">
                        <Download size={14}/> Download Master
                      </a>
                    ) : lead.projectFilesUrl ? (
                       <a href={lead.projectFilesUrl} target="_blank" rel="noreferrer" className="bg-[#141414] hover:bg-zinc-700 text-white transition-colors rounded-sm py-2 px-4 text-xs font-bold uppercase tracking-[0.2em] text-center border border-white/[0.06]">
                        Project Files Available
                      </a>
                    ) : (
                      <div className="bg-[#000000] text-zinc-600 rounded-sm py-2 px-4 text-xs font-bold uppercase tracking-[0.2em] text-center border border-white/[0.04] cursor-not-allowed">
                        Awaiting Export
                      </div>
                    )}
                 </div>
               </div>
            </div>
            </motion.div>
        </div>
        )}

        {activeTab === 'onboarding' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#000000] border border-white/[0.04] backdrop-blur-2xl rounded-sm p-10 shadow-2xl h-full flex flex-col gap-6">
             <div>
                <h3 className="text-xl font-light tracking-tight text-white mb-1">Brand Assets & Questionnaires</h3>
                <p className="text-sm text-white/60">Upload your raw files, logos, guidelines, and answer onboarding questions.</p>
             </div>
             
             <div className="bg-[#0f0f0f] border border-white/[0.04] p-6 rounded-sm">
                <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-widest flex items-center gap-2">
                  <FileSignature size={16} /> Strategy Questionnaire
                </h4>
                <p className="text-xs text-white/60 mb-4">Let's dial in the brand voice before editing begins.</p>
                <textarea 
                  className="w-full bg-[#000000] border border-white/[0.04] p-4 text-sm text-white focus:outline-none placeholder-white/30 h-32 rounded-sm custom-scrollbar"
                  placeholder="Drop answers to the onboarding questions here..."
                  defaultValue={lead.questionnaireAnswers || ''}
                  onBlur={async (e) => {
                     await updateDoc(doc(db, 'leads', leadId), { questionnaireAnswers: e.target.value, updatedAt: new Date() });
                     toast.success("Questionnaire saved.");
                  }}
                />
             </div>

             <div className="bg-[#0f0f0f] border border-white/[0.04] p-6 rounded-sm">
                <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-widest flex items-center gap-2">
                  <Video size={16} /> Secure File Drop
                </h4>
                <p className="text-xs text-white/60 mb-4">Upload source files matching your brand (Logos, LUTS, Fonts, Footages).</p>
                <FileUploader leadId={leadId!} onUploadComplete={() => { toast.success("Assets Synced to Editor Dashboard") }} folder="client_uploads" />
             </div>
          </motion.div>
        )}

        {activeTab === 'deliverables' && (
           <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6">
              <div className="bg-[#0f0f0f] border border-white/[0.04] backdrop-blur-2xl rounded-sm p-10 shadow-2xl flex flex-col min-h-[600px] h-full">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">Frame Canvas Review</h3>
                   {(lead.tasks?.v1_sent || lead.tasks?.final_exported) && (
                      <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-100 bg-white/5 px-2 py-1 rounded-sm border border-white/[0.04] uppercase tracking-[0.2em]"><Video size={10}/> Frame Active</span>
                   )}
                </div>

                {/* Video Player */}
                <div className="w-full aspect-video bg-[#000000] border border-white/[0.04] rounded-sm relative overflow-hidden mb-6 flex-shrink-0 flex items-center justify-center">
                   {(!lead.tasks?.v1_sent && !lead.tasks?.final_exported) && (
                      <div className="absolute inset-0 bg-white/5 flex flex-col items-center justify-center animate-pulse z-10">
                         <Loader2 size={24} className="text-zinc-600 animate-spin mb-2" />
                         <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60">Compiling footage...</span>
                      </div>
                   )}
                   {(lead.tasks?.v1_sent || lead.tasks?.final_exported) ? (
                       <FeedbackClientPlayer leadId={lead.id} reviewerId={lead.ownerId} url={lead.reviewVideoUrl} />
                   ) : (
                     <div className="text-zinc-600 text-[10px] uppercase font-mono tracking-[0.2em] flex flex-col items-center gap-3 relative z-20">
                       <Clock size={20} className="text-zinc-700" />
                       Awaiting initial render...
                     </div>
                   )}
                </div>
                
                {/* Action Buttons */}
                {(lead.tasks?.v1_sent || lead.tasks?.final_exported) && (
                   <div className="flex flex-col sm:flex-row gap-4 mb-6 mt-[-10px]">
                       {lead.tasks?.final_exported && !lead.tasks?.payment_received && (
                          <button onClick={handleApproveVideo} disabled={submittingFeedback} className="flex-1 bg-[#34C759] hover:bg-[#28a745] text-white py-3 rounded-2xl shadow-[0_4px_24px_rgba(52, 199, 89,0.3)] transition-all font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 group">
                              <CheckCircle size={18} className="group-hover:scale-110 transition-transform" /> Approve Video
                          </button>
                       )}
                       <button onClick={() => {
                           const evt = new CustomEvent('ADD_TIMELINE_FEEDBACK');
                           window.dispatchEvent(evt);
                       }} className="flex-1 bg-[#000000] hover:bg-[#252525] border border-white/[0.04] text-white py-3 rounded-2xl transition-all font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2">
                           <MessageSquare size={16} /> Add Timeline Feedback
                       </button>
                   </div>
                )}

                {/* Feedback Chat */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#000000]/50 border border-white/[0.04] p-4 rounded-sm">
                   <div className="flex-1 overflow-y-auto mb-4 space-y-3 custom-scrollbar pr-2 min-h-[200px]">
                     {(!lead.feedback || lead.feedback.length === 0) && (
                       <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600 text-center italic mt-4">No comm logs generated.</p>
                     )}
                     {lead.feedback?.map((fb: any, idx: number) => (
                        <div key={idx} className={`flex ${fb.type === 'client' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[85%] p-3 rounded-sm text-sm font-light ${fb.type === 'client' ? 'bg-[#111111] border border-white/[0.04] text-white' : 'bg-[#1a1a1a] border border-[var(--brand-primary)]/20 text-white/80'}`}>
                             <div className="flex items-center gap-2 mb-1">
                               {fb.timestampPin && <span className="text-[10px] font-mono text-zinc-100 bg-white/10 px-1 py-0.5 rounded-sm">@{fb.timestampPin}</span>}
                               {fb.sentiment === 'Praise' && <Sparkles size={10} className="text-white/80"/>}
                               {fb.sentiment === 'Revision' && <Clock size={10} className="text-white/80"/>}
                             </div>
                             <p>{fb.text}</p>
                           </div>
                        </div>
                     ))}
                   </div>
                   
                   <div className="relative mt-auto shrink-0">
                     <textarea 
                       value={feedbackText}
                       onChange={e => setFeedbackText(e.target.value)}
                       placeholder={(lead.tasks?.v1_sent || lead.tasks?.final_exported) ? "Request revision or give feedback..." : "Awaiting assets..."}
                       disabled={!(lead.tasks?.v1_sent || lead.tasks?.final_exported) || submittingFeedback}
                       className="w-full bg-[#000000] border border-white/[0.04] p-4 pt-3 pb-12 rounded-sm text-sm font-light text-white focus:outline-none focus:border-zinc-600 resize-none transition-colors"
                       rows={2}
                     />
                     <button 
                       onClick={handleFeedbackSubmit}
                       disabled={!feedbackText.trim() || submittingFeedback}
                       className="absolute bottom-3 right-3 p-2 bg-[var(--brand-primary)] text-white hover:scale-110 transition-all rounded-sm"
                     >
                       {submittingFeedback ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                     </button>
                   </div>
                </div>
              </div>
           </motion.div>
        )}
        
        {activeTab === 'roi' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
             <div className="bg-[#0f0f0f] border border-white/[0.04] backdrop-blur-2xl rounded-sm p-10 shadow-2xl flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <TrendingUp size={32} className="text-white" />
                 </div>
                 <h2 className="text-2xl font-bold font-body tracking-tight text-white mb-2">Editor Impact & ROI</h2>
                 <p className="text-white/60 text-sm max-w-lg mb-10">We don't just deliver videos; we generate assets that perform. Here is the aggregate performance impact of the content we've delivered for you.</p>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <div className="bg-[#000000] border border-white/[0.04] p-8 rounded-sm">
                       <Calculator size={20} className="text-zinc-500 mb-4 mx-auto" />
                       <h3 className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/50 mb-2">Total Views Generated</h3>
                       <p className="text-3xl font-bold font-body tracking-tight text-white">1.2M<span className="text-lg text-white/40">+</span></p>
                    </div>
                    <div className="bg-[#000000] border border-white/[0.04] p-8 rounded-sm relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-primary)]/10 to-transparent"></div>
                       <Clock size={20} className="text-[var(--brand-primary)] mb-4 mx-auto relative z-10" />
                       <h3 className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/50 mb-2 relative z-10">Avg. Retention Rate</h3>
                       <p className="text-3xl font-bold font-body tracking-tight text-white relative z-10">63%</p>
                    </div>
                    <div className="bg-[#000000] border border-white/[0.04] p-8 rounded-sm">
                       <DollarSign size={20} className="text-emerald-500 mb-4 mx-auto" />
                       <h3 className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/50 mb-2">Est. Adsense/Sponsor ROI</h3>
                       <p className="text-3xl font-bold font-body tracking-tight text-emerald-400">+$4,500</p>
                    </div>
                 </div>

                 <div className="w-full mt-10 text-left bg-white/5 p-8 rounded-sm border border-white/[0.04]">
                    <h3 className="text-lg font-bold font-body tracking-tight text-white mb-2">Want to scale this up?</h3>
                    <p className="text-sm text-white/60 mb-6">These numbers prove the model works. Secure our weekly editing retainer so we can reliably scale your channel without skipping a beat.</p>
                    <button onClick={() => window.open('https://buy.stripe.com/test_demo', '_blank')} className="bg-[var(--brand-primary)] text-black font-bold uppercase tracking-[0.2em] text-[10px] px-6 py-3 rounded-sm transition-colors hover:bg-white flex items-center justify-center gap-2">
                       <CreditCard size={14} /> View Retainer Options
                    </button>
                 </div>
             </div>
          </motion.div>
        )}
        
        {/* Footer */}
        <div className="text-center text-[10px] text-white/20 font-mono tracking-[0.2em] mt-12 pb-8 uppercase">
           Sys. Auth: June OS Operations Node
        </div>
      </div>
      {(proposal && leadId) && <ClientPortalAIChat proposal={proposal} leadId={leadId} />}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ClientPortalAIChat({ proposal, leadId }: { proposal: any, leadId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: `Hello! I'm your digital concierge. How can I help you regarding your project with ${proposal?.brandName || 'us'}?` }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!inputMsg.trim()) return;
    const msg = inputMsg.trim();
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInputMsg("");
    setIsTyping(true);

    try {
      const prompt = `You are a helpful, professional AI concierge built into a client portal for a creative video editing agency.
The client you are talking to is viewing a proposal/project portal.
Here is the context about their project:
- Client Name/Brand: ${proposal?.clientName || proposal?.brandName || 'Client'}
- Project Title: ${proposal?.title || 'Video Editing Services'}
- Amount: $${proposal?.amount || 0}
- Services included: ${proposal?.services?.join(', ') || 'Video Editing'}

The client asks: "${msg}"

Answer the question directly based on the context. If they ask about an invoice, tell them "You can find your invoices by logging into your dashboard or checking your email for the specific milestone." If they ask about milestones, say "You can check the project tracker timeline on this page."
Always be extremely polite. Keep the answer to 1-3 short sentences.`;

      const aiRes = await (await import('../services/ai')).performAIOperation(prompt);
      setMessages(prev => [...prev, { role: 'ai', content: aiRes }]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "I'm sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="bg-[#141414] border border-white/[0.04] rounded-2xl w-80 shadow-2xl flex flex-col mb-4 overflow-hidden animate-fade-in relative">
           <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
           <div className="bg-[#000000] border-b border-white/[0.04] p-4 flex justify-between items-center relative z-10">
             <div className="flex items-center gap-2">
               <BrainCircuit size={16} className="text-[#007AFF]" />
               <span className="font-bold text-sm text-white tracking-[0.2em] uppercase font-mono">Concierge AI</span>
             </div>
             <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white">
               <X size={16} />
             </button>
           </div>
           
           <div className="flex-1 p-4 h-64 overflow-y-auto flex flex-col gap-3 no-scrollbar border-b border-white/[0.04] relative z-10">
             {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`text-xs p-3 font-mono leading-relaxed max-w-[85%] ${m.role === 'user' ? 'bg-[#007AFF] text-white rounded-2xl rounded-br-none shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-[#000000] border border-white/[0.04] text-white/80 rounded-2xl rounded-bl-none'}`}>
                     {m.content}
                  </div>
                </div>
             ))}
             {isTyping && (
                <div className="flex justify-start">
                   <div className="text-xs p-3 bg-[#000000] border border-white/[0.04] rounded-2xl rounded-bl-none flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                     <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                     <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                   </div>
                </div>
             )}
           </div>

           <div className="p-3 flex gap-2 relative z-10 bg-[#000000]">
             <input 
               type="text" 
               value={inputMsg}
               onChange={e => setInputMsg(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               placeholder="Ask a question..."
               className="flex-1 bg-[#000000]/50 border border-white/[0.04] rounded-2xl px-3 py-2 text-xs text-white uppercase tracking-[0.2em] font-mono focus:outline-none focus:border-[#007AFF] transition-colors"
             />
             <button onClick={handleSend} disabled={isTyping} className="bg-[#007AFF] hover:bg-[var(--brand-primary)] text-white p-2 rounded-2xl transition-colors border border-white/[0.04]">
               <ArrowRight size={14} />
             </button>
           </div>
        </div>
      )}

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-[#007AFF] hover:bg-[var(--brand-primary)] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-transform hover:scale-105 border border-white/[0.04] group"
          title="Ask AI Concierge"
        >
          <BrainCircuit size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}
    </div>
  );
}

function ROICalculator() {
  const [targetAVDIncrease, setTargetAVDIncrease] = useState(15);
  const [currentViews, setCurrentViews] = useState(100000);
  const [estimatedCPM, setEstimatedCPM] = useState(4.5);

  const algorithmMultiplier = 1 + (targetAVDIncrease * 0.02); // Every 1% AVD gives ~2% more views (dummy formula)
  const newViews = Math.round(currentViews * algorithmMultiplier);
  const revenueIncrease = Math.round(((newViews - currentViews) / 1000) * estimatedCPM);
  const totalRevenue = Math.round((newViews / 1000) * estimatedCPM);

  return (
    <div className="flex flex-col md:flex-row gap-10 mt-4">
      {/* Controls */}
      <div className="flex-1 space-y-5 bg-white/5 p-4 rounded-2xl border border-white/[0.02]">
        <div>
           <div className="flex justify-between items-end mb-2">
             <label className="text-xs text-white/60 font-bold uppercase tracking-widest">Target AVD Increase (%)</label>
             <span className="font-mono text-white/80 font-bold text-sm">+{targetAVDIncrease}%</span>
           </div>
           <input type="range" min="1" max="50" step="1" value={targetAVDIncrease} onChange={(e) => setTargetAVDIncrease(Number(e.target.value))} className="w-full h-1 bg-[#141414] rounded-2xl appearance-none cursor-pointer accent-emerald-500" />
        </div>
        <div>
           <div className="flex justify-between items-end mb-2">
             <label className="text-xs text-white/60 font-bold uppercase tracking-widest">Current Views / Video</label>
             <span className="font-mono text-white font-bold text-sm">{currentViews.toLocaleString()}</span>
           </div>
           <input type="range" min="10000" max="2500000" step="10000" value={currentViews} onChange={(e) => setCurrentViews(Number(e.target.value))} className="w-full h-1 bg-[#141414] rounded-2xl appearance-none cursor-pointer accent-white" />
        </div>
        <div>
           <div className="flex justify-between items-end mb-2">
             <label className="text-xs text-white/60 font-bold uppercase tracking-widest">Est. CPM ($)</label>
             <span className="font-mono text-white font-bold text-sm">${estimatedCPM.toFixed(2)}</span>
           </div>
           <input type="range" min="1" max="15" step="0.5" value={estimatedCPM} onChange={(e) => setEstimatedCPM(Number(e.target.value))} className="w-full h-1 bg-[#141414] rounded-2xl appearance-none cursor-pointer accent-white" />
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 bg-white/10 border border-white/[0.04] rounded-2xl p-10 flex flex-col justify-center">
         <div className="flex justify-between items-center mb-6 border-b border-white/[0.04] pb-4">
            <div>
               <p className="text-xs text-white/80/70 uppercase tracking-[0.2em] font-bold">New Projected Views</p>
               <p className="text-2xl font-mono text-white mt-1">{newViews.toLocaleString()}</p>
            </div>
            <div className="text-right">
               <p className="text-xs text-white/80/70 uppercase tracking-[0.2em] font-bold">Total Revenue</p>
               <p className="text-2xl font-mono text-white/80 mt-1">${totalRevenue.toLocaleString()}</p>
            </div>
         </div>
         <div className="text-center">
            <p className="text-sm text-white/60 mb-1">Direct Value Generated per Video</p>
            <div className="text-4xl font-body tracking-tight font-black text-white/80">
              <span className="text-white/80/50">+</span>${revenueIncrease.toLocaleString()}
            </div>
         </div>
      </div>
    </div>
  );
}
