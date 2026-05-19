import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FileSignature, PenTool, CheckCircle, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicContractView({ contractId, token }: { contractId: string | null, token?: string | null }) {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!contractId) {
      const timer = setTimeout(() => {
        setError('Contract ID is missing.');
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const fetchContract = async () => {
      try {
        const docRef = doc(db, 'contracts', contractId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as any;
          setContract(data);
          
          let authed = false;
          if (!data.password) {
            authed = true;
          } else if (token) {
             try {
                const res = await fetch(`/api/verify-magic-link/${token}`);
                if (res.ok) {
                   const verification = await res.json();
                   if (verification.clientId === contractId) {
                      authed = true;
                      toast.success("Authenticated via magic link");
                   }
                }
             } catch(e) {
                console.error("Magic link err", e);
             }
          }
          if (authed) {
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
                telemetryEvents: arrayUnion({ type: 'CONTRACT_OPENED', timestamp: new Date(), detail: `Contract viewed.` })
              });
              if (data.userId || data.ownerId) {
                await addDoc(collection(db, 'activity_logs'), {
                  ownerId: data.userId || data.ownerId,
                  type: 'deal',
                  text: `A prospect is currently viewing the contract "${data.title || 'Untitled'}".`,
                  createdAt: serverTimestamp()
                });
              }
            } catch (e) {
              console.error("Telemetry error", e);
            }
          }
        } else {
          setError('Contract not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load contract.');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [contractId]);

  const handleClientSign = async () => {
    if (!contract || signing) return;
    const name = window.prompt("Full legal name for signature:");
    if (!name) return;
    const email = window.prompt("Email address for signature receipt:");
    if (!email) return;

    setSigning(true);
    try {
      await updateDoc(doc(db, 'contracts', contract.id), { 
        status: 'signed',
        signatoryName: name,
        signatoryEmail: email,
        signedAt: serverTimestamp()
      });
      // also update locally
      setContract({
        ...contract,
        status: 'signed',
        signatoryName: name,
        signatoryEmail: email,
        signedAt: new Date()
      });
      toast.success('Contract signed successfully');
    } catch(e) {
      console.error(e);
      toast.error('Failed to sign contract. Please check permissions.');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#000000]">
        <Loader2 className="animate-spin text-white/30" size={32} />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#000000] text-white font-mono uppercase tracking-[0.2em] text-xs">
        {error || 'Not Found'}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#000000] text-white/80 font-mono text-sm p-10">
        <div className="w-full max-w-sm bg-[#141414] p-10 rounded-2xl border border-white/[0.04] shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-white font-bold text-xl mb-2 font-body tracking-tight tracking-tight">Secure Contract</h2>
          <p className="text-white/60 mb-6 text-xs">Please enter the access code to view this agreement.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (passwordInput === contract.password) {
              setIsAuthenticated(true);
            } else {
              toast.error('Incorrect password');
            }
          }}>
            <input
              type="password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              autoFocus
              className="w-full bg-[#0a0a0a] border border-white/[0.04] px-4 py-3 rounded-2xl text-white mb-4 focus:outline-none focus:border-white transition-colors"
              placeholder="Enter access code"
            />
            <button className="w-full bg-[var(--brand-primary)] text-white hover:bg-zinc-200 uppercase tracking-[0.2em] text-xs font-bold py-3 rounded-2xl transition-colors">
              Unlock Contract
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-body py-12 px-4 relative">
      <div className="max-w-4xl mx-auto bg-white border border-zinc-200 shadow-[0_4px_24px_rgba(255,255,255,0.15)] rounded-2xl p-10 md:p-16">
        <h1 className="text-3xl font-serif font-bold text-zinc-900 mb-2">{contract.title}</h1>
        <p className="text-sm font-mono text-white/60 uppercase tracking-[0.2em] mb-12">
           Prepared for: {contract.clientName}
        </p>

        <div className="prose max-w-none mb-12 contract-content">
          <style dangerouslySetInnerHTML={{__html: `
              .contract-content h1 { font-size: 2.5em; font-weight: bold; margin-bottom: 0.5em; color: #18181b; }
              .contract-content h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; margin-top: 1.5em; color: #18181b; }
              .contract-content p { margin-bottom: 1em; line-height: 1.6; color: #3f3f46; }
              .contract-content ul { list-style-type: disc; margin-left: 1.5em; margin-bottom: 1em; color: #3f3f46; }
              .contract-content ol { list-style-type: decimal; margin-left: 1.5em; margin-bottom: 1em; color: #3f3f46; }
              .contract-content blockquote { border-left: 4px solid #e4e4e7; padding-left: 1rem; color: #52525b; font-style: italic; margin-bottom: 1em; margin-top: 1em; background: #fafafa; border-radius: 4px; }
              .contract-content hr { border: none; border-top: 1px solid #e4e4e7; margin: 2rem 0; }
              .contract-content a { color: #007AFF; text-decoration: underline; }
              .contract-content strike { text-decoration: line-through; }
              .contract-content table { border-collapse: collapse; width: 100%; border: 1px solid #d4d4d8; margin: 1rem 0; }
              .contract-content td, .contract-content th { border: 1px solid #d4d4d8; padding: 0.75rem; text-align: left; }
          `}}></style>
          <div dangerouslySetInnerHTML={{ __html: contract.content
              .replace(/{clientName}/g, contract.clientName || '[Client Name]')
              .replace(/{status}/g, contract.status)
              .replace(/{date}/g, new Date().toLocaleDateString())
              .replace(/{signatoryName}/g, contract.signatoryName || '[Signatory Name]')
              .replace(/{signatoryEmail}/g, contract.signatoryEmail || '[Signatory Email]')
          }} />
        </div>
        
        {contract.status === 'sent' && (
            <div className="mt-16 sm:pl-8 border-t border-zinc-200 pt-12">
              <h3 className="text-xl font-serif font-bold text-zinc-900 mb-6">Signatures</h3>
              <div className="bg-zinc-50 border border-zinc-200 p-10 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner">
                 <FileSignature className="text-white/60 mb-4" size={32} />
                 <h4 className="text-lg font-bold text-zinc-800 mb-2">Pending Client Signature</h4>
                 <p className="text-white/60 text-sm mb-6 max-w-sm">This contract is awaiting signature before work can begin.</p>
                 <button disabled={signing} onClick={handleClientSign} className="bg-[var(--brand-primary)] text-white disabled:opacity-50 hover:bg-[#FF6961] text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-md transition-all flex items-center gap-2">
                     {signing ? <Loader2 className="animate-spin" size={16} /> : <PenTool size={16} />} 
                     {signing ? 'Signing...' : 'Click to Sign'}
                 </button>
              </div>
            </div>
        )}
        
        {contract.status === 'signed' && (
            <div className="mt-16 sm:pl-8 border-t border-zinc-200 pt-12">
              <h3 className="text-xl font-serif font-bold text-zinc-900 mb-6">Signatures</h3>
              <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center gap-3 mb-8 text-green-800">
                  <CheckCircle size={20} />
                  <span className="font-medium text-sm">This contract has been signed and is legally binding.</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                      <div className="border-b border-zinc-300 w-full mb-2 h-16">
                      </div>
                      <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/60 font-mono">Signatory 1 (Agency)</p>
                  </div>
                  <div>
                      <div className="border-b border-zinc-300 w-full mb-2 h-16 flex items-end pb-2">
                         <span className="font-serif italic text-3xl text-zinc-800" style={{ fontFamily: 'Georgia, serif' }}>{contract.signatoryName}</span>
                      </div>
                      <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/60 font-mono">Signatory 2 (Client)</p>
                      <div className="mt-3 text-xs text-white/60 font-mono space-y-1">
                         <p>Signed by: <span className="text-zinc-800 font-bold">{contract.signatoryName}</span></p>
                         <p>Email: <span className="text-zinc-800">{contract.signatoryEmail}</span></p>
                         <p>Date: <span className="text-zinc-800">{contract.signedAt?.toDate ? contract.signedAt.toDate().toLocaleString() : new Date(contract.signedAt).toLocaleString()}</span></p>
                      </div>
                  </div>
              </div>

              <div className="mt-12 p-10 bg-[#000000] border border-white/[0.04] rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-[#252525] text-white/80 rounded-full flex items-center justify-center border border-white/[0.04] mb-4">
                     <CreditCard size={24} />
                  </div>
                  <h4 className="text-xl font-bold text-zinc-900 mb-2">Final Step: Pay Retainer</h4>
                  <p className="text-zinc-600 mb-6 max-w-sm">The contract is signed. Please complete your initial payment via Stripe to begin onboarding.</p>
                  <a href="https://buy.stripe.com/test_demo" target="_blank" rel="noreferrer" className="w-full sm:w-auto bg-[#FF3B30] text-black hover:bg-[#FF453A] text-white font-bold uppercase tracking-[0.2em] text-sm px-8 py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3">
                     Open Payment Portal 
                  </a>
              </div>
            </div>
        )}

      </div>
    </div>
  );
}
