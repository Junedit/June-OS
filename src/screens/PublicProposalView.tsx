import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FileText, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Markdown from 'react-markdown';

export default function PublicProposalView({ proposalId }: { proposalId: string | null }) {
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!proposalId) {
      const timer = setTimeout(() => {
        setError('Proposal ID is missing.');
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const fetchProposal = async () => {
      try {
        const docRef = doc(db, 'proposals', proposalId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as any;
          setProposal(data);
          if (!data.password) {
            setIsAuthenticated(true);
          }
          if (data.leadId && !window.location.search.includes('preview')) {
            try {
              const { arrayUnion, addDoc, collection } = await import('firebase/firestore');
              await updateDoc(docRef, {
                views: (data.views || 0) + 1,
                lastViewedAt: serverTimestamp()
              });
              await updateDoc(doc(db, 'leads', data.leadId), {
                telemetryEvents: arrayUnion({ type: 'PROPOSAL_OPENED', timestamp: new Date(), detail: `Proposal viewed.` })
              });
              if (data.userId || data.ownerId) {
                await addDoc(collection(db, 'activity_logs'), {
                  ownerId: data.userId || data.ownerId,
                  type: 'deal',
                  text: `A prospect is currently viewing the proposal "${data.title || 'Untitled'}".`,
                  createdAt: serverTimestamp()
                });
              }
            } catch (e) {
              console.error("Telemetry error", e);
            }
          }
        } else {
          setError('Proposal not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load proposal.');
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [proposalId]);

  const handleClientAccept = async () => {
    if (!proposal || accepting) return;
    const name = window.prompt("Full name to accept proposal:");
    if (!name) return;

    setAccepting(true);
    try {
      await updateDoc(doc(db, 'proposals', proposal.id), { 
        status: 'accepted',
        acceptedByName: name,
        acceptedAt: serverTimestamp()
      });
      setProposal({
        ...proposal,
        status: 'accepted',
        acceptedByName: name,
        acceptedAt: new Date()
      });
      toast.success('Proposal accepted successfully');
    } catch(e) {
      console.error(e);
      toast.error('Failed to accept proposal.');
    } finally {
      setAccepting(false);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === proposal?.password) {
      setIsAuthenticated(true);
      toast.success("Access granted");
    } else {
      toast.error("Incorrect password");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono">
        <div className="text-center animate-pulse flex flex-col items-center">
          <Loader2 className="animate-spin text-zinc-500 mb-4" size={32} />
          <p className="text-zinc-500 uppercase tracking-widest text-xs">Loading Secure Proposal</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono text-zinc-500">
        {error}
      </div>
    );
  }

  if (!isAuthenticated && proposal?.password) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
        <form onSubmit={handleAuth} className="glass-card max-w-sm w-full p-8 flex flex-col gap-6 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-[var(--brand-primary)]"></div>
           <div>
             <h2 className="text-xl font-bold text-white mb-2 font-mono uppercase">Internal Portal</h2>
             <p className="text-zinc-400 text-sm">This proposal is password protected.</p>
           </div>
           
           <div>
             <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2 block">Access Code</label>
             <input
               type="password"
               value={passwordInput}
               onChange={(e) => setPasswordInput(e.target.value)}
               className="w-full bg-[#0a0a0a] border border-white/[0.05] rounded p-3 text-white focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
               placeholder="Enter password..."
             />
           </div>

           <button type="submit" className="w-full bg-[var(--brand-primary)] text-black font-bold py-3 uppercase tracking-widest text-sm rounded shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)] hover:brightness-110 transition-all">
             Authenticate
           </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-zinc-300 relative selection:bg-brand-primary selection:text-black">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-24 relative z-10 space-y-12">
        <header className="flex flex-col items-center justify-center text-center space-y-6">
           <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FileText size={28} className="text-zinc-100" />
           </div>
           
           <div className="space-y-4 max-w-2xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Secure Proposal Server
             </div>
             <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-sm">{proposal.title || 'Service Proposal'}</h1>
             <p className="text-lg text-zinc-400/80 font-medium">Prepared exclusively for {proposal.clientName || 'Client'}</p>
           </div>
        </header>

        <section className="bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl p-8 md:p-12 shadow-2xl relative -mx-4 md:mx-0">
          <div className="prose prose-invert prose-p:text-zinc-400 prose-headings:text-zinc-100 prose-a:text-[var(--brand-primary)] prose-strong:text-zinc-200 max-w-none">
            <div className="markdown-body">
              <Markdown>{proposal.content}</Markdown>
            </div>
          </div>
        </section>

        <section className="p-8 md:p-12 bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-2xl border border-zinc-800 shadow-2xl text-center space-y-8 relative overflow-hidden -mx-4 md:mx-0">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent opacity-50"></div>
          
          <div className="space-y-4 max-w-xl mx-auto">
            <h3 className="text-3xl font-bold text-white tracking-tight">Proposal Authorization</h3>
            <p className="text-zinc-400">By accepting this proposal, you confirm your intent to proceed with the outlined terms.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {proposal.status === 'accepted' ? (
              <div className="flex flex-col items-center gap-4 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-8 py-6 rounded-xl">
                 <CheckCircle size={48} className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                 <div>
                    <h3 className="font-bold text-xl mb-1 text-emerald-400 drop-shadow-sm">Proposal Accepted</h3>
                    <p className="text-emerald-500/80 text-sm font-medium">Acknowledged by {proposal.acceptedByName}</p>
                 </div>
              </div>
            ) : (
              <button 
                onClick={handleClientAccept}
                disabled={accepting}
                className="group relative bg-[#fff] text-black font-black px-12 py-5 rounded shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all disabled:opacity-50 hover:-translate-y-1 w-full md:w-auto"
              >
                <span className="flex items-center justify-center gap-3 relative z-10 text-lg uppercase tracking-wide">
                   {accepting ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle size={24} className="group-hover:scale-110 transition-transform" />}
                   {accepting ? 'Processing...' : 'Accept Proposal'}
                </span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity rounded"></div>
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
