import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FileSignature, Plus, Edit3, Trash, Download, CheckCircle, Eye, Edit2, Send, PenTool, X, ChevronDown, FileText, Link, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';
import { collection, onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import SkeletonLoader from '../components/SkeletonLoader';
import { toast } from 'sonner';
import { SimpleWysiwyg } from '../components/SimpleWysiwyg';
import { performAIOperation } from '../services/ai';

const CONTRACT_TEMPLATES = [
  {
    id: 'msa',
    title: 'Master Services Agreement',
    description: 'General terms forming the foundation of your ongoing business relationship.',
    content: '<h1>Master Services Agreement</h1>\n<p>This Master Services Agreement ("Agreement") is made and entered into on {date}, by and between <strong>{clientName}</strong> ("Client") and the service provider.</p>\n<h2>1. Services</h2>\n<p>The provider agrees to perform the services outlined in future Statements of Work (SOW).</p>\n<h2>2. Term and Termination</h2>\n<p>This agreement shall commence on {date} and remain in effect until terminated by either party with 30 days written notice.</p>\n<h2>3. Confidentiality</h2>\n<p>Both parties agree to keep all proprietary information confidential.</p>\n<hr />\n<p><strong>Signed by:</strong> {signatoryName}</p>\n<p><strong>Email:</strong> {signatoryEmail}</p>'
  },
  {
    id: 'nda',
    title: 'Non-Disclosure Agreement',
    description: 'Protect sensitive information before starting discussions or a project.',
    content: '<h1>Non-Disclosure Agreement (NDA)</h1>\n<p>This Non-Disclosure Agreement (the "Agreement") is entered into on {date} by and between the disclosing party and <strong>{clientName}</strong> (the "Receiving Party").</p>\n<h2>1. Definition of Confidential Information</h2>\n<p>Confidential Information means all non-public information disclosed by the Disclosing Party to the Receiving Party...</p>\n<h2>2. Obligations of Receiving Party</h2>\n<p>The Receiving Party shall hold and maintain the Confidential Information in strictest confidence for the sole and exclusive benefit of the Disclosing Party.</p>\n<hr />\n<p><strong>Signed by:</strong> {signatoryName}</p>\n<p><strong>Email:</strong> {signatoryEmail}</p>'
  },
  {
     id: 'sow',
     title: 'Statement of Work',
     description: 'Specific details about a project\'s scope, timeline, and deliverables.',
     content: '<h1>Statement of Work (SOW)</h1>\n<p>This Statement of Work is issued under the existing Master Services Agreement between the provider and <strong>{clientName}</strong>.</p>\n<h2>1. Project Scope</h2>\n<p>[Describe the specific work to be done...]</p>\n<h2>2. Deliverables</h2>\n<ul><li>Deliverable 1</li><li>Deliverable 2</li></ul>\n<h2>3. Timeline & Milestones</h2>\n<p>[Insert schedule...]</p>\n<h2>4. Pricing</h2>\n<p>[Insert cost structure...]</p>\n<hr />\n<p><strong>Signed by:</strong> {signatoryName}</p>\n<p><strong>Email:</strong> {signatoryEmail}</p>'
  },
  {
    id: 'blank',
    title: 'Blank Contract',
    description: 'Start from scratch with an empty document.',
    content: '<h1>New Contract</h1>\n<p>Start typing your contract terms here...</p>'
  }
];

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<boolean | 'split'>(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // AI Contract Reviewer State
  const [isRedlineModalOpen, setIsRedlineModalOpen] = useState(false);
  const [redlineInputText, setRedlineInputText] = useState("");
  const [isRedlining, setIsRedlining] = useState(false);
  const [redlineResult, setRedlineResult] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'contracts'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const c = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContracts(c);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'contracts');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleRedlineContract = async () => {
    if (!redlineInputText.trim()) {
      toast.error("Please paste the contract text first.");
      return;
    }
    
    setIsRedlining(true);
    setRedlineResult(null);
    try {
      const prompt = `You are a premium, protective virtual legal counsel for a creative agency.
Analyze the following third-party client contract for:
1. "Scope Creep" loopholes.
2. Dangerous liability clauses or unreasonable indemnification.
3. IP Ownership (make sure the agency retains portfolio rights).
4. Payment terms (check if it aligns with standard Net-30, flag if they demand Net-60 or Net-90).

Provide a structured, JSON response in the following exact format:
{
  "flags": [
    { "type": "scope_creep" | "liability" | "payment" | "ip", "severity": "high" | "medium" | "low", "clause": "excerpt from contract...", "explanation": "Why this is dangerous" }
  ],
  "pushbackDraft": "A professional, diplomatic email drafted to the client pushing back on the dangerous clauses and requesting modifications.",
  "summary": "Overall risk assessment (1-2 sentences)"
}

Do NOT use markdown code blocks around the JSON output, just strictly return the raw JSON object.

Contract text:
${redlineInputText}`;

      const res = await performAIOperation(prompt);
      const parsed = JSON.parse(res);
      setRedlineResult(parsed);
      toast.success("AI Analysis complete!");
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to analyze contract: " + e.message);
    } finally {
      setIsRedlining(false);
    }
  };

  const handleSelectTemplate = async (template: typeof CONTRACT_TEMPLATES[0]) => {
    try {
      const newDoc = await addDoc(collection(db, 'contracts'), {
        title: template.title,
        clientName: '',
        status: 'draft',
        content: template.content,
        ownerId: user?.uid,
        createdAt: serverTimestamp(),
      });
      toast.success('Draft contract created');
      setIsTemplateModalOpen(false);
      startEditing({
        id: newDoc.id,
        title: template.title,
        clientName: '',
        content: template.content
      });
    } catch {
      toast.error('Failed to create contract');
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'contracts', id));
      toast.success('Deleted contract');
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete: ' + (err.message || 'permission error'));
    }
  };

  const startEditing = (contract: any) => {
    setEditingId(contract.id);
    setEditForm({
      id: contract.id,
      title: contract.title || '',
      clientName: contract.clientName || '',
      content: contract.content || '',
      status: contract.status || 'draft',
      signatoryName: contract.signatoryName || '',
      signatoryEmail: contract.signatoryEmail || '',
      signedAt: contract.signedAt || null
    });
    setPreviewMode(false);
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;
    try {
      await updateDoc(doc(db, 'contracts', editingId), {
        title: editForm.title,
        clientName: editForm.clientName,
        content: editForm.content,
        updatedAt: serverTimestamp()
      });
      toast.success('Contract saved');
      setEditingId(null);
    } catch {
      toast.error('Failed to update contract');
    }
  };

  const markAsSigned = async (id: string) => {
    const name = window.prompt("Full legal name for signature:");
    if (!name) return;
    const email = window.prompt("Email address for signature receipt:");
    if (!email) return;

    try {
      await updateDoc(doc(db, 'contracts', id), { 
        status: 'signed',
        signatoryName: name,
        signatoryEmail: email,
        signedAt: serverTimestamp()
      });
      toast.success('Contract marked as signed');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const markAsSent = async (id: string) => {
    try {
      await updateDoc(doc(db, 'contracts', id), { status: 'sent' });
      toast.success('Contract marked as sent');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleClientSign = async () => {
    if (!editingId) return;
    const name = window.prompt("Full legal name for signature:");
    if (!name) return;
    const email = window.prompt("Email address for signature receipt:");
    if (!email) return;

    try {
      await updateDoc(doc(db, 'contracts', editingId), { 
        status: 'signed',
        signatoryName: name,
        signatoryEmail: email,
        signedAt: serverTimestamp()
      });
      setEditForm({
        ...editForm,
        status: 'signed',
        signatoryName: name,
        signatoryEmail: email,
        signedAt: new Date()
      });
      toast.success('Contract signed successfully');
    } catch {
      toast.error('Failed to sign contract');
    }
  };

  const downloadPDF = async () => {
      const element = document.getElementById('contract-print-area');
      if (!element) return;
      
      setGeneratingPdf(true);
      try {
          const html2pdf = (await import('html2pdf.js')).default;
          const opt: any = {
              margin: [1, 1, 1, 1],
              filename: `${editForm.title || 'Contract'}-${editForm.clientName || 'Draft'}.pdf`,
              image: { type: 'jpeg', quality: 1 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
          };
          
          html2pdf().set(opt).from(element).save().then(() => {
              setGeneratingPdf(false);
              toast.success('PDF Downloaded');
          }).catch((e: any) => {
              console.error(e);
              setGeneratingPdf(false);
              toast.error('Failed to generate PDF');
          });
      } catch (e) {
          console.error(e);
          setGeneratingPdf(false);
          toast.error('Could not load PDF module');
      }
  };

  if (loading) return <SkeletonLoader type="list" />;

  if (editingId) {
    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f0f0f0] text-black relative z-50 font-sans">
        <header className="bg-white border-b border-zinc-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-10">
             <button onClick={() => setEditingId(null)} className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-[0.2em] text-white/60 hover:text-black transition-colors group">
               <span className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">←</span> Back
             </button>
             <div className="w-px h-6 bg-zinc-200"></div>
             <div className="flex items-center gap-3">
                <FileSignature className="text-white/60" size={18} />
                <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="bg-transparent text-xl font-body tracking-tight font-bold outline-none placeholder:text-white/80 min-w-[300px] text-zinc-900 border-b border-transparent hover:border-zinc-200 focus:border-white/20 transition-colors pb-0.5" placeholder="Contract Title" />
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex bg-zinc-100 p-1 rounded-2xl">
                <button 
                  onClick={() => setPreviewMode(false)}
                  className={`px-4 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center gap-2 ${previewMode === false ? 'bg-[var(--brand-primary)] text-white shadow-sm' : 'text-white/60 hover:text-zinc-700'}`}
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button 
                  onClick={() => setPreviewMode('split')}
                  className={`px-4 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center gap-2 ${previewMode === 'split' ? 'bg-[var(--brand-primary)] text-white shadow-sm' : 'text-white/60 hover:text-zinc-700'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/></svg> Split
                </button>
                <button 
                  onClick={() => setPreviewMode(true)}
                  className={`px-4 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center gap-2 ${previewMode === true ? 'bg-[var(--brand-primary)] text-white shadow-sm' : 'text-white/60 hover:text-zinc-700'}`}
                >
                  <Eye size={14} /> Preview
                </button>
             </div>
             <button onClick={() => {
                 if (previewMode === false) {
                     setPreviewMode(true);
                     setTimeout(downloadPDF, 100);
                 } else {
                     downloadPDF();
                 }
             }} disabled={generatingPdf} className="bg-white border border-zinc-200 hover:bg-zinc-50 text-black px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2 disabled:opacity-50">
                <Download size={14} /> {generatingPdf ? 'Generating...' : 'Download PDF'}
             </button>
             {editForm.status === 'draft' && (
                 <button onClick={async () => {
                     await saveEdit();
                     await markAsSent(editingId);
                     setEditForm({...editForm, status: 'sent'});
                 }} className="bg-[#FF3B30] text-black hover:bg-[#FF453A] text-white px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md flex items-center gap-2">
                   <Send size={14} /> Send
                 </button>
             )}
             {editingId && editForm.id && (
                 <button onClick={async () => {
                     try {
                         const res = await fetch('/api/generate-magic-link', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ clientId: editForm.id, viewType: 'contract' })
                         });
                         const data = await res.json();
                         if (data.url) {
                             navigator.clipboard.writeText(data.url);
                             toast.success("Client magic link copied!");
                         } else {
                             throw new Error(data.error || "Unknown error");
                         }
                     } catch (e: any) {
                         toast.error("Failed to generate magic link: " + e.message);
                     }
                 }} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2">
                   <Link size={14} /> Copy Link
                 </button>
             )}
             <button onClick={saveEdit} className="bg-[#000000] hover:bg-[#141414] text-white px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md flex items-center gap-2">
               <CheckCircle size={14} /> Save Contract
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full flex no-scrollbar bg-[#f5f5f5]">
          <div className={`mx-auto py-12 px-4 sm:px-8 w-full transition-all duration-300 ${previewMode === 'split' ? 'max-w-[1600px] flex gap-4 xl:gap-10 justify-center items-start' : 'max-w-[850px] flex-1'}`}>
            {/* EDIT SIDE */}
            {(previewMode === false || previewMode === 'split') && (
            <div className={`bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-sm border border-zinc-200 p-10 sm:p-16 min-h-[1056px] relative flex-1 shrink-0 ${previewMode === 'split' ? 'w-1/2 flex-none overflow-hidden' : 'w-full'}`}>
               <div className="absolute left-4 top-20 bottom-20 flex flex-col justify-between opacity-20 pointer-events-none hidden sm:flex print:hidden">
                  <div className="w-4 h-4 rounded-full bg-[#f5f5f5] shadow-inner border border-zinc-200"></div>
                  <div className="w-4 h-4 rounded-full bg-[#f5f5f5] shadow-inner border border-zinc-200"></div>
                  <div className="w-4 h-4 rounded-full bg-[#f5f5f5] shadow-inner border border-zinc-200"></div>
               </div>

               <div className="mb-12 pb-8 border-b border-zinc-100 flex items-end gap-10 sm:pl-8">
                  <div className="flex-1 w-full">
                    <h3 className="text-[10px] uppercase font-mono tracking-[0.2em] text-zinc-100 font-bold mb-2 flex items-center gap-2 print:text-white/60">
                       <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] text-white print:bg-zinc-400"></span> Client / Party
                    </h3>
                    <input type="text" value={editForm.clientName} onChange={e => setEditForm({...editForm, clientName: e.target.value})} className="w-full text-3xl font-serif font-bold outline-none border-none placeholder:text-zinc-200 text-zinc-900" placeholder="Client or Company Name" />
                  </div>
                  <div className="text-right hidden sm:block print:hidden">
                     <p className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-1">Status</p>
                     <p className="text-xs font-bold uppercase tracking-[0.2em] inline-block px-3 py-1 rounded bg-zinc-100 text-zinc-600">{editForm.status}</p>
                  </div>
               </div>
               
               <div className="sm:pl-8 flex-1">
                 <h3 className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-4 block border-b border-zinc-100 pb-2 print:hidden">Agreement Terms</h3>
                 <div className="prose prose-zinc max-w-none text-zinc-800 font-serif contract-content h-full">
                    <SimpleWysiwyg 
                       value={editForm.content} 
                       onChange={content => setEditForm({...editForm, content})}
                       availableVariables={['{clientName}', '{status}', '{date}', '{signatoryName}', '{signatoryEmail}']}
                       placeholder="Start typing your contract terms here. Use variables from the dropdown!"
                    />
                 </div>
               </div>
            </div>
            )}

            {/* PREVIEW SIDE */}
            {(previewMode === true || previewMode === 'split') && (
             <div id="contract-print-area" className={`bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-sm border border-zinc-200 p-10 sm:p-16 min-h-[1056px] relative flex-1 shrink-0 ${previewMode === 'split' ? 'w-1/2 flex-none origin-top' : 'w-full'}`}>
                <div className="absolute left-4 top-20 bottom-20 flex flex-col justify-between opacity-20 pointer-events-none hidden sm:flex print:hidden">
                   <div className="w-4 h-4 rounded-full bg-[#f5f5f5] shadow-inner border border-zinc-200"></div>
                   <div className="w-4 h-4 rounded-full bg-[#f5f5f5] shadow-inner border border-zinc-200"></div>
                   <div className="w-4 h-4 rounded-full bg-[#f5f5f5] shadow-inner border border-zinc-200"></div>
                </div>

                <div className="mb-12 pb-8 border-b border-zinc-100 flex items-end gap-10 sm:pl-8">
                   <div className="flex-1 w-full">
                     <h3 className="text-[10px] uppercase font-mono tracking-[0.2em] text-zinc-100 font-bold mb-2 flex items-center gap-2 print:text-white/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] text-white print:bg-zinc-400"></span> Client / Party
                     </h3>
                     <h2 className="text-3xl font-serif font-bold text-zinc-900 whitespace-pre-wrap">{editForm.clientName || 'Unspecified Client'}</h2>
                   </div>
                   <div className="text-right hidden sm:block print:hidden">
                      <p className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-1">Status</p>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] inline-block px-3 py-1 rounded bg-zinc-100 text-zinc-600">{editForm.status}</p>
                   </div>
                </div>
                
                <div className="sm:pl-8 flex-1">
                  <div className="prose prose-zinc max-w-none text-zinc-800 font-serif contract-content">
                    <style>{`
                        .contract-content p { margin-bottom: 1em; }
                        .contract-content h1 { font-size: 2em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; font-family: sans-serif; letter-spacing: -0.025em; }
                        .contract-content h2 { font-size: 1.5em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; font-family: sans-serif; letter-spacing: -0.025em; }
                        .contract-content ul { list-style-type: disc; margin-left: 1.5em; margin-bottom: 1em; }
                        .contract-content ol { list-style-type: decimal; margin-left: 1.5em; margin-bottom: 1em; }
                        .contract-content blockquote { border-left: 4px solid #e4e4e7; padding-left: 1rem; color: #52525b; font-style: italic; margin-bottom: 1em; margin-top: 1em; background: #fafafa; border-radius: 4px; }
                        .contract-content hr { border: none; border-top: 1px solid #e4e4e7; margin: 2rem 0; }
                        .contract-content a { color: #007AFF; text-decoration: underline; }
                        .contract-content strike { text-decoration: line-through; }
                        .contract-content table { border-collapse: collapse; width: 100%; border: 1px solid #d4d4d8; margin: 1rem 0; }
                        .contract-content td, .contract-content th { border: 1px solid #d4d4d8; padding: 0.75rem; text-align: left; }
                    `}</style>
                    <div dangerouslySetInnerHTML={{ __html: editForm.content
                        .replace(/{clientName}/g, editForm.clientName || '[Client Name]')
                        .replace(/{status}/g, editForm.status)
                        .replace(/{date}/g, new Date().toLocaleDateString())
                        .replace(/{signatoryName}/g, editForm.signatoryName || '[Signatory Name]')
                        .replace(/{signatoryEmail}/g, editForm.signatoryEmail || '[Signatory Email]')
                    }} />
                  </div>
                </div>
                
                {editForm.status === 'sent' && (
                    <div className="mt-24 sm:pl-8 border-t border-zinc-200 pt-12">
                      <h3 className="text-xl font-serif font-bold text-zinc-900 mb-6">Signatures</h3>
                      <div className="bg-zinc-50 border border-zinc-200 p-10 rounded-2xl flex flex-col items-center justify-center text-center">
                         <FileSignature className="text-white/60 mb-4" size={32} />
                         <h4 className="text-lg font-bold text-zinc-800 mb-2">Pending Client Signature</h4>
                         <p className="text-white/60 text-sm mb-6 max-w-sm">This contract is marked as sent and is awaiting signature from the client.</p>
                         <button onClick={handleClientSign} className="bg-[#FF3B30] text-black hover:bg-[#FF453A] text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-md transition-all flex items-center gap-2">
                             <PenTool size={16} /> Click to Sign
                         </button>
                      </div>
                    </div>
                )}
                {editForm.status === 'signed' && (
                    <div className="mt-24 sm:pl-8 border-t border-zinc-200 pt-12">
                      <h3 className="text-xl font-serif font-bold text-zinc-900 mb-6">Signatures</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div>
                              <div className="border-b border-zinc-300 w-full mb-2 h-16">
                              </div>
                              <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/60 font-mono">Signatory 1 (Your Company)</p>
                          </div>
                          <div>
                              <div className="border-b border-zinc-300 w-full mb-2 h-16 flex items-end pb-2">
                                 <span className="font-serif italic text-3xl text-zinc-800" style={{ fontFamily: 'Georgia, serif' }}>{editForm.signatoryName}</span>
                              </div>
                              <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/60 font-mono">Signatory 2 (Client)</p>
                              <div className="mt-3 text-xs text-white/60 font-mono space-y-1">
                                 <p>Signed by: <span className="text-zinc-800 font-bold">{editForm.signatoryName}</span></p>
                                 <p>Email: <span className="text-zinc-800">{editForm.signatoryEmail}</span></p>
                                 <p>Date: <span className="text-zinc-800">{editForm.signedAt?.toDate ? editForm.signedAt.toDate().toLocaleString() : new Date(editForm.signedAt).toLocaleString()}</span></p>
                              </div>
                          </div>
                      </div>
                    </div>
                )}
                {editForm.status === 'draft' && (
                    <div className="mt-24 sm:pl-8 grid grid-cols-2 gap-12 opacity-50">
                        <div>
                            <div className="border-b border-zinc-300 w-full mb-2 h-16"></div>
                            <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/60 font-mono">Signatory 1 (Your Company)</p>
                        </div>
                        <div>
                            <div className="border-b border-zinc-300 w-full mb-2 h-16"></div>
                            <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/60 font-mono">Signatory 2 (Client)</p>
                        </div>
                    </div>
                )}
             </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative w-full bg-transparent">
      <header className="bg-[#000000]/60 backdrop-blur-[80px] saturate-[2.0] border-b border-white/[0.02] top-0 sticky z-40 flex justify-between items-center w-full px-8 py-5">
        <div className="flex items-center gap-4">
          <span className="md:hidden font-black text-2xl text-white font-body tracking-tight">CT</span>
          <h2 className="text-xl font-body tracking-tight font-semibold text-white tracking-tight hidden lg:block">
            Contracts
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button 
            onClick={() => {
              setRedlineInputText("");
              setRedlineResult(null);
              setIsRedlineModalOpen(true);
            }} 
            className="bg-[#000000] hover:bg-[#000000] border border-white/[0.04] text-[var(--brandColor)] px-4 py-2 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors relative overflow-hidden group shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="absolute inset-0 bg-[var(--brandColor)] opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <Sparkles size={16} /> AI Contract Review
          </button>
          <button onClick={() => setIsTemplateModalOpen(true)} className="bg-[var(--brand-primary)] text-white hover:bg-zinc-200 px-4 py-2 text-sm font-semibold rounded-2xl flex items-center gap-2 transition-colors">
            <Plus size={16} /> New Contract
          </button>
        </div>
      </header>

      <div className="p-10 md:p-10 space-y-8 max-w-[1600px] mx-auto w-full mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {contracts.map(contract => (
            <div key={contract.id} className="bg-[#0a0a0a] border border-white/[0.02] p-10 rounded-2xl relative group flex flex-col transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(255,255,255,0.1)] hover:border-white/[0.04]">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/[0.02] flex items-center justify-center text-white/60">
                  <FileSignature size={20} />
                </div>
                <span className={`text-[9px] font-mono uppercase font-bold tracking-[0.2em] px-2.5 py-1 rounded-2xl border ${
                  contract.status === 'signed' ? 'bg-[#34C759]/10 text-green-400 border-[#34C759]/20' :
                  contract.status === 'sent' ? 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20' :
                  'bg-white/5 text-white/50 border-white/[0.04]'
                }`}>
                  {contract.status === 'signed' ? 'Active' : contract.status}
                </span>
              </div>
              
              <h3 className="text-white font-semibold mb-1 truncate text-lg">{contract.title}</h3>
              {contract.clientName ? (
                 <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-mono mb-8">{contract.clientName}</p>
              ) : (
                 <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] font-mono mb-8 italic">No client assigned</p>
              )}
              
              <div className="flex gap-2 mt-auto">
                <button onClick={() => startEditing(contract)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-2xl text-sm font-medium transition-colors flex justify-center items-center gap-2">
                  <Edit3 size={16} /> Edit
                </button>
                {contract.status === 'draft' && (
                  <button onClick={() => markAsSent(contract.id)} className="flex-1 bg-[var(--brand-primary)] hover:bg-[#FF6961] text-white py-2.5 rounded-2xl text-sm font-medium transition-colors flex justify-center items-center gap-2">
                    <Send size={16} /> Send
                  </button>
                )}
                {contract.status === 'sent' && (
                  <button onClick={() => markAsSigned(contract.id)} className="flex-1 bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)] text-white py-2.5 rounded-2xl text-sm font-medium transition-colors flex justify-center items-center gap-2">
                    <CheckCircle size={16} /> Sign
                  </button>
                )}
                 {deleteConfirmId === contract.id ? (
                   <button onClick={(e) => handleDelete(contract.id, e)} onMouseLeave={() => setDeleteConfirmId(null)} className="w-auto px-4 bg-[var(--brand-primary)] text-white font-bold uppercase tracking-[0.2em] text-[10px] py-2 rounded-2xl transition-colors flex justify-center items-center flex-shrink-0 animate-[fade-in_0.2s_ease-out]">
                      Confirm?
                   </button>
                 ) : (
                   <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(contract.id); }} className="w-10 bg-white/5 hover:bg-white/20 text-zinc-100 py-2 rounded-2xl text-xs transition-colors flex justify-center items-center opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <Trash size={14} />
                   </button>
                 )}
              </div>
            </div>
          ))}
          {contracts.length === 0 && (
            <div className="col-span-full py-24 glass-panel rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <FileSignature className="text-white/20" size={32} />
              </div>
              <h3 className="text-white font-body tracking-tight text-2xl tracking-tight mb-3">No active contracts</h3>
              <p className="text-white/40 text-sm mb-8 max-w-sm leading-relaxed">Draft MSAs, NDAs, or employment contracts separate from your billing and invoices.</p>
              <button onClick={() => setIsTemplateModalOpen(true)} className="linear-button">
                <Plus size={16} /> Create Contract
              </button>
            </div>
          )}
        </div>
      </div>

      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-10 animate-fade-in">
          <div className="bg-[#141414] border border-white/[0.04] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl flex-shrink-0 animate-slide-up">
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/[0.02] bg-white/5 shrink-0">
               <div>
                 <h2 className="text-xl font-bold text-white font-body tracking-tight">Select a Template</h2>
                 <p className="text-white/40 text-[10px] uppercase font-mono tracking-[0.2em] mt-1">Start from a legal foundation</p>
               </div>
               <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors">
                 <X size={20} />
               </button>
            </div>
            
            <div className="p-10 md:p-10 overflow-y-auto no-scrollbar flex-1 shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONTRACT_TEMPLATES.map((template) => (
                 <button
                   key={template.id}
                   onClick={() => handleSelectTemplate(template)}
                   className="flex flex-col text-left p-10 sm:p-10 border border-white/[0.02] bg-[#000000] hover:bg-white/5 rounded-2xl transition-all hover:-translate-y-1 hover:border-white/[0.04] hover:shadow-lg group"
                 >
                    <div className="w-12 h-12 bg-white/5 border border-white/[0.04] rounded-2xl flex items-center justify-center text-white/50 group-hover:bg-white/10 group-hover:text-white group-hover:scale-110 transition-all mb-6 shrink-0">
                       <FileText size={20} />
                    </div>
                    <div className="flex-1 shrink-0">
                       <h3 className="text-lg font-bold text-white mb-2 font-body tracking-tight">{template.title}</h3>
                       <p className="text-white/40 text-sm leading-relaxed">{template.description}</p>
                    </div>
                 </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isRedlineModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50 flex flex-col justify-center items-center p-10 sm:p-10">
          <div className="w-full max-w-5xl bg-[#0a0a0a] rounded-2xl border border-white/[0.04] flex flex-col max-h-[90vh] overflow-hidden shadow-2xl relative">
            <div className="flex justify-between items-center p-10 border-b border-white/[0.04] shrink-0 bg-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-red-900/20 text-[#FF3B30]">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-body tracking-tight font-bold text-white">Virtual Legal Counsel</h2>
                  <p className="text-xs font-mono text-white/60 tracking-[0.2em] uppercase">AI Contract Redlining</p>
                </div>
              </div>
              <button onClick={() => setIsRedlineModalOpen(false)} className="text-white/60 hover:text-white p-2">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Left Side: Input */}
              <div className="flex-1 flex flex-col border-r border-white/[0.04] p-10 overflow-y-auto">
                 <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 mb-3">Paste Client Contract Here</h3>
                 <textarea
                   value={redlineInputText}
                   onChange={e => setRedlineInputText(e.target.value)}
                   className="flex-1 bg-[#141414] border border-white/[0.04] rounded-2xl p-4 text-sm text-white/80 focus:outline-none focus:border-[var(--brandColor)] resize-none no-scrollbar font-mono"
                   placeholder="Paste the raw text of the contract..."
                 />
                 <button 
                   onClick={handleRedlineContract}
                   disabled={isRedlining || !redlineInputText.trim()}
                   className="mt-4 bg-[var(--brandColor)] hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl uppercase tracking-[0.2em] text-xs flex justify-center items-center gap-2 transition-opacity"
                 >
                   {isRedlining ? <><Sparkles size={16} className="animate-spin" /> Analyzing Risks...</> : <><ShieldAlert size={16} /> Analyze Contract</>}
                 </button>
              </div>

              {/* Right Side: Output */}
              <div className="flex-1 p-10 overflow-y-auto bg-[#141414]">
                 {isRedlining ? (
                   <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                      <Sparkles size={48} className="text-[var(--brandColor)] animate-pulse" />
                      <p className="text-white/60 font-mono text-xs uppercase tracking-[0.2em]">Scanning for loopholes & scope creep...</p>
                   </div>
                 ) : redlineResult ? (
                   <div className="space-y-6">
                      <div className="bg-red-900/10 border border-red-900/30 rounded-2xl p-5">
                        <h4 className="text-[#FF453A] font-bold mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Risk Summary</h4>
                        <p className="text-sm text-red-200/80 leading-relaxed">{redlineResult.summary}</p>
                      </div>

                      <div>
                        <h4 className="text-white/80 font-bold font-mono text-[10px] uppercase tracking-[0.2em] mb-3 border-b border-white/[0.04] pb-2">Identified Flags</h4>
                        <div className="space-y-3">
                          {redlineResult.flags?.map((flag: any, i: number) => (
                             <div key={i} className="bg-[#000000] border border-white/[0.04] rounded p-4">
                               <div className="flex justify-between items-start mb-2">
                                 <span className="text-xs font-bold text-white uppercase tracking-widest">{flag.type.replace('_', ' ')}</span>
                                 <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-[0.2em] ${flag.severity === 'high' ? 'bg-[#FF3B30]/20 text-[#FF453A]' : flag.severity === 'medium' ? 'bg-white/20 text-white/80' : 'bg-white/20 text-white/80'}`}>{flag.severity}</span>
                               </div>
                               <blockquote className="border-l-2 border-zinc-600 pl-3 my-3 text-xs text-white/60 font-mono italic">"{flag.clause}"</blockquote>
                               <p className="text-sm text-white/80">{flag.explanation}</p>
                             </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white/80 font-bold font-mono text-[10px] uppercase tracking-[0.2em] mb-3 border-b border-white/[0.04] pb-2">Drafted Pushback</h4>
                        <div className="relative group">
                          <textarea 
                            readOnly
                            value={redlineResult.pushbackDraft}
                            className="w-full h-48 bg-[#000000] border border-white/[0.04] rounded p-4 text-sm text-white/80 focus:outline-none resize-none font-mono leading-relaxed"
                          />
                          <button 
                            onClick={() => { navigator.clipboard.writeText(redlineResult.pushbackDraft); toast.success("Copied to clipboard!"); }}
                            className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </div>
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                      <ShieldAlert size={48} className="text-zinc-700" />
                      <p className="text-white/60 font-mono text-xs uppercase tracking-[0.2em] max-w-[200px]">Waiting for contract text to analyze...</p>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

