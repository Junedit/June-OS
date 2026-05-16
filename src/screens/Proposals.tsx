import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FileText, Plus, FileSignature, CheckCircle, Send, FileEdit, Trash, Copy, X, Eye, Globe } from 'lucide-react';
import { collection, onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import SkeletonLoader from '../components/SkeletonLoader';
import { toast } from 'sonner';

export default function Proposals() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'proposals'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProposals(p);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'proposals');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreateDraft = async () => {
    try {
      const newDoc = await addDoc(collection(db, 'proposals'), {
        title: 'New Video Production Proposal',
        clientName: '',
        status: 'draft',
        amount: 0,
        content: '# Proposal\n\n## Scope of Work\n\n## Terms',
        ownerId: user?.uid,
        createdAt: serverTimestamp(),
      });
      toast.success('Draft proposal created');
      setEditingId(newDoc.id);
      setEditForm({
        title: 'New Video Production Proposal',
        clientName: '',
        amount: 0,
        content: '# Proposal\n\n## Scope of Work\n\n## Terms',
      });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      toast.error('Failed to create proposal');
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await deleteDoc(doc(db, 'proposals', id));
      toast.success('Deleted proposal');
      setDeleteConfirmId(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `proposals`);
    }
  };

  const startEditing = (prop: any) => {
      setEditingId(prop.id);
      setEditForm({
        id: prop.id,
        title: prop.title || '',
        clientName: prop.clientName || '',
        amount: prop.amount || 0,
        content: prop.content || '',
        status: prop.status || 'draft',
        password: prop.password || ''
      });
    };
  
    const saveEdit = async () => {
      if (!editingId || !editForm) return;
      try {
        await updateDoc(doc(db, 'proposals', editingId), {
          title: editForm.title,
          clientName: editForm.clientName,
          amount: Number(editForm.amount),
          content: editForm.content,
          password: editForm.password || null
        });
      toast.success('Proposal updated');
      setEditingId(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch(e) {
      toast.error('Failed to update proposal');
    }
  };

  if (loading) return <SkeletonLoader type="list" />;

  return (
    <div className="flex-1 flex flex-col relative w-full bg-transparent min-h-screen">
      <header className="bg-transparent/40 backdrop-blur-[40px] saturate-[1.8] border-b border-white/[0.02] top-0 sticky z-40 flex justify-between items-center w-full px-8 py-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-white/[0.02] flex items-center justify-center border border-white/[0.02] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <FileSignature className="text-zinc-100 relative z-10" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-body tracking-tight font-bold text-white tracking-tight">Proposals</h2>
            <p className="text-[10px] text-white/60 font-mono tracking-[0.2em] uppercase mt-0.5">Contracts & Estimates</p>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <button onClick={handleCreateDraft} className="linear-button shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 text-[10px]">
            <Plus size={14} /> NEW PROPOSAL
          </button>
        </div>
      </header>

      <div className="p-10 md:p-10 space-y-8 max-w-[1600px] mx-auto w-full mb-32 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {proposals.map(prop => (
            <div key={prop.id} className="glass-panel p-10 rounded-[24px] relative group flex flex-col transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(255,51,51,0.15)] hover:border-white/20 bg-transparent overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/[0.03] to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-screen"></div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-12 h-12 rounded-[14px] bg-white/[0.02] border border-white/[0.02] flex items-center justify-center text-white/80 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <FileText size={20} className="text-white/60 group-hover:text-white transition-colors" />
                </div>
                <span className={`text-[9px] font-mono uppercase font-bold tracking-[0.2em] px-2.5 py-1 rounded-[6px] border ${
                  prop.status === 'draft' ? 'bg-white/[0.02] text-white/60 border-white/[0.06]/50' :
                  prop.status === 'sent' ? 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20' :
                  'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20 shadow-[0_4px_24px_rgba(52, 199, 89,0.15)]'
                }`}>
                  {prop.status}
                </span>
              </div>
              
              <h3 className="text-white font-body tracking-tight font-semibold mb-1 truncate text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white transition-all duration-300 relative z-10">{prop.title}</h3>
              {prop.clientName && <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-mono mb-4 relative z-10">{prop.clientName}</p>}
              <p className="text-white font-serif italic text-3xl mb-8 mt-auto drop-shadow-sm relative z-10">${Number(prop.amount || 0).toLocaleString()}</p>
              
              <div className="flex gap-2 relative z-10">
                <button onClick={() => startEditing(prop)} className="flex-1 bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.04] text-white py-2.5 rounded-2xl text-[10px] uppercase font-bold tracking-[0.2em] transition-colors flex justify-center items-center gap-1.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                  <FileEdit size={14} className="text-white/60" /> EDIT
                </button>
                {prop.status === 'draft' ? (
                  <>
                    <button onClick={async () => {
                        await updateDoc(doc(db, 'proposals', prop.id), { status: 'sent' });
                        window.open(`mailto:?subject=Project Proposal: ${prop.title}&body=Hello,\n\nPlease review our proposal here: ${window.location.origin}/?mode=tracker&proposal=${prop.id}`, '_blank');
                        toast.success('Proposal marked as sent and mail opened');
                    }} className="flex-1 bg-[#FF3B30] text-black hover:bg-[#FF453A] shadow-[0_4px_24px_rgba(255, 59, 48,0.3)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 py-2.5 rounded-2xl text-[10px] uppercase font-bold tracking-[0.2em] transition-all flex justify-center items-center gap-1.5">
                      <Send size={14} /> SEND
                    </button>
                    <button onClick={() => {
                      window.open(`/?mode=tracker&proposal=${prop.id}`, '_blank');
                    }} className="flex-1 border border-white/[0.04] hover:bg-white/5 text-white flex justify-center py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-colors items-center gap-1.5">
                      <Eye size={14} /> VIEW
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/?mode=tracker&proposal=${prop.id}`);
                      toast.success('Client link copied');
                    }} className="flex-1 border border-white/[0.04] hover:bg-white/5 text-white flex justify-center py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-colors items-center gap-1.5">
                      <Copy size={14} /> LINK
                    </button>
                    <button onClick={() => {
                      window.open(`/?mode=tracker&proposal=${prop.id}`, '_blank');
                    }} className="flex-1 bg-[var(--brand-primary)] text-white hover:bg-zinc-200 shadow-[0_4px_24px_rgba(255, 59, 48,0.3)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 flex justify-center py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all items-center gap-1.5">
                      <Globe size={14} /> PORTAL
                    </button>
                  </>
                )}
                 {deleteConfirmId === prop.id ? (
                   <button onClick={(e) => handleDelete(prop.id, e)} onMouseLeave={() => setDeleteConfirmId(null)} className="w-auto px-4 bg-[var(--brand-primary)] text-white font-bold uppercase tracking-[0.2em] text-[9px] py-2 rounded-2xl transition-colors flex justify-center items-center flex-shrink-0 shadow-[0_4px_24px_rgba(255, 59, 48,0.3)]">
                      SURE?
                   </button>
                 ) : (
                   <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(prop.id); }} className="w-10 bg-white/10 border border-white/20 hover:bg-[var(--brand-primary)] hover:text-white text-zinc-100 py-2 rounded-2xl transition-all flex justify-center items-center opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <Trash size={14} />
                   </button>
                 )}
              </div>
            </div>
          ))}
          {proposals.length === 0 && (
            <div className="col-span-full py-24 glass-panel rounded-[32px] flex flex-col items-center justify-center text-center border-dashed border-white/[0.04] relative overflow-hidden group hover:border-white/30 transition-colors">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,51,51,0.05),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="w-20 h-20 rounded-[20px] bg-white/[0.02] border border-white/[0.02] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex items-center justify-center mb-6 relative z-10">
                <FileSignature className="text-white/60 group-hover:text-white transition-colors duration-500" size={32} />
              </div>
              <h3 className="text-white font-body tracking-tight text-2xl tracking-tight mb-3 relative z-10">No active proposals</h3>
              <p className="text-white/60 font-mono text-[11px] mb-8 max-w-sm leading-relaxed uppercase tracking-widest relative z-10">Draft professional proposals, send them to clients, and close deals directly from your dashboard.</p>
              <button onClick={handleCreateDraft} className="linear-button relative z-10">
                <Plus size={14} /> Create First Proposal
              </button>
            </div>
          )}
        </div>
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#000000]/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]" onClick={() => setEditingId(null)}>
          <div className="bg-[#0f0f0f] border-l border-white/[0.04] w-full max-w-md h-full flex flex-col shadow-[0_4px_24px_rgba(255,255,255,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-10 border-b border-white/[0.02]">
              <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] font-mono">Edit Proposal</h2>
              <button onClick={() => setEditingId(null)} className="text-white/40 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-mono text-white/40 tracking-[0.2em] block mb-2">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  className="w-full bg-[#000000]/50 border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-white/40 tracking-[0.2em] block mb-2">Client Name</label>
                <input
                  type="text"
                  value={editForm.clientName}
                  onChange={e => setEditForm({...editForm, clientName: e.target.value})}
                  className="w-full bg-[#000000]/50 border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-white/40 tracking-[0.2em] block mb-2">Amount ($)</label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={e => setEditForm({...editForm, amount: e.target.value})}
                  className="w-full bg-[#000000]/50 border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-white/40 tracking-[0.2em] block mb-2">Content (Markdown)</label>
                <textarea
                  value={editForm.content}
                  onChange={e => setEditForm({...editForm, content: e.target.value})}
                  className="w-full h-64 bg-[#000000]/50 border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors font-mono resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-white/40 tracking-[0.2em] block mb-2">Access Password (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty for public access"
                  value={editForm.password || ''}
                  onChange={e => setEditForm({...editForm, password: e.target.value})}
                  className="w-full bg-[#000000]/50 border border-white/30 rounded-2xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-white/20 transition-colors font-mono"
                />
              </div>
            </div>
            <div className="p-10 border-t border-white/[0.02] bg-[#000000]/50">
              <button onClick={saveEdit} className="w-full linear-button py-3 text-sm flex justify-center">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

