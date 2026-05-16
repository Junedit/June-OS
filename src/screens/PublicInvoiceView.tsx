import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CreditCard, Download, Loader2, CheckCircle, Receipt } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicInvoiceView({ invoiceId }: { invoiceId: string | null }) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!invoiceId) {
      setTimeout(() => {
        setError('Invoice ID is missing.');
        setLoading(false);
      }, 0);
      return;
    }

    let telemetrySent = false;
    const fetchInvoice = async () => {
      try {
        const docRef = doc(db, 'invoices', invoiceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Handle successful payment redirect
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('payment') === 'success' && data.status !== 'paid') {
             // Let's mark it as paid. (In a real production app, do this in the webhook!)
             toast.success("Payment successful!");
             await updateDoc(docRef, { status: 'paid', paidAt: serverTimestamp() });
             if (data.leadId) {
                const { increment } = await import('firebase/firestore');
                await updateDoc(doc(db, 'leads', data.leadId), { totalPaid: increment(Number(data.amount) || 0) });
             }
             data.status = 'paid';
             data.paidAt = new Date();
             
             // Strip query param to avoid refreshing triggering it again
             window.history.replaceState({}, document.title, window.location.pathname + `?mode=invoice&id=${invoiceId}`);
          } else if (urlParams.get('payment') === 'cancelled') {
             toast.error("Payment was cancelled.");
             window.history.replaceState({}, document.title, window.location.pathname + `?mode=invoice&id=${invoiceId}`);
          }
          
          setInvoice({ id: docSnap.id, ...data });
          
          if (data.leadId && !telemetrySent && !window.location.search.includes('preview')) {
             telemetrySent = true;
             try {
                const { arrayUnion, addDoc, collection } = await import('firebase/firestore');
                await updateDoc(docRef, {
                  views: (data.views || 0) + 1,
                  lastViewedAt: serverTimestamp()
                });
                await updateDoc(doc(db, 'leads', data.leadId), {
                    telemetryEvents: arrayUnion({ type: 'INVOICE_OPENED', timestamp: new Date(), detail: `Invoice #${data.invoiceNumber || 'Unknown'} viewed.` })
                });
                if (data.userId || data.ownerId) {
                  await addDoc(collection(db, 'activity_logs'), {
                    ownerId: data.userId || data.ownerId,
                    type: 'payment',
                    text: `A prospect is currently viewing invoice #${data.invoiceNumber || 'Unknown'}.`,
                    createdAt: serverTimestamp()
                  });
                }
             } catch (e) { console.error("Telemetry error", e); }
          }
        } else {
          setError('Invoice not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load invoice.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  const handlePayNow = async () => {
    if (!invoice || paying) return;
    setPaying(true);

    try {
       const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             invoiceId: invoice.id,
             amountStr: String(invoice.amount),
             title: invoice.description || "Video Editing Services",
             origin: window.location.origin
          })
       });
       if (!res.ok) {
           const err = await res.json();
           throw new Error(err.error || "Failed");
       }
       const data = await res.json();
       window.location.href = data.url;
    } catch(e: any) {
       console.error(e);
       toast.error(e.message || 'Payment initialization failed. Check API key settings.');
       setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#000000]">
        <Loader2 className="animate-spin text-white/30" size={32} />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#000000] text-white font-mono uppercase tracking-[0.2em] text-xs">
        {error || 'Not Found'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white/80 font-sans relative overflow-x-hidden flex items-center justify-center p-10 py-20">
      <div className="w-full max-w-2xl bg-white border border-zinc-200 shadow-2xl rounded-sm text-black">
        
        {/* Header */}
        <div className="p-10 md:p-12 border-b border-zinc-200 flex justify-between items-start">
           <div>
              <h1 className="text-4xl font-black tracking-[0.02em] uppercase mb-2">Invoice</h1>
              <p className="text-white/60 font-mono text-xs uppercase tracking-[0.2em]">#{invoice.invoiceNumber || invoice.id.slice(0,8)}</p>
           </div>
           <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Total Due</p>
              <p className="text-3xl font-light tracking-tight mt-1">${(invoice.amount || 0).toLocaleString()}</p>
              {invoice.status === 'paid' ? (
                 <span className="inline-flex mt-3 items-center gap-1 text-white/80 bg-emerald-50 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-[0.2em] border border-emerald-200">
                    <CheckCircle size={12} /> Paid in Full
                 </span>
              ) : (
                 <span className="inline-flex mt-3 items-center gap-1 text-white/80 bg-amber-50 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-[0.2em] border border-amber-200">
                    Pending Payment
                 </span>
              )}
           </div>
        </div>

        {/* Details */}
        <div className="p-10 md:p-12 flex flex-col md:flex-row justify-between gap-12 bg-zinc-50 border-b border-zinc-200">
           <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2">Billed To</p>
              <p className="font-bold text-sm">{invoice.clientName || invoice.brandName || "Client"}</p>
              <p className="text-sm text-zinc-600 mt-1">{invoice.email || "No email on file"}</p>
           </div>
           <div className="text-left md:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2">Date Issued</p>
              <p className="text-sm text-zinc-600">
                 {invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleDateString() : new Date(invoice.createdAt || 0).toLocaleDateString()}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mt-4 mb-2">Due Date</p>
              <p className="text-sm font-bold text-zinc-100">
                 {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Upon Receipt"}
              </p>
           </div>
        </div>

        {/* Content/Items */}
        <div className="p-10 md:p-12 border-b border-zinc-200">
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-4 border-b border-zinc-200 pb-2">Description of Services</p>
           <p className="text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap">{invoice.description || "Video Editing Services"}</p>
        </div>

        {/* Actions */}
        <div className="p-10 bg-zinc-50 flex flex-col sm:flex-row justify-between items-center gap-4">
           {invoice.status !== 'paid' ? (
             <button 
               onClick={handlePayNow}
               disabled={paying}
               className="w-full sm:w-auto bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 px-8 py-4 rounded flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-sm transition-all active:scale-95 disabled:opacity-50"
             >
                {paying ? <Loader2 size={18} className="animate-spin" /> : <><CreditCard size={18} /> Pay Securely via Stripe</>}
             </button>
           ) : (
             <div className="w-full sm:w-auto text-center sm:text-left text-white/60 text-sm italic font-serif">
                This invoice has been settled. Thank you for your business.
             </div>
           )}

           <button className="w-full sm:w-auto flex items-center justify-center gap-2 text-white/60 hover:text-black font-bold uppercase tracking-[0.2em] text-xs transition-colors px-4 py-2 border border-zinc-300 hover:border-black rounded">
              <Download size={14} /> Download PDF
           </button>
        </div>
      </div>
    </div>
  );
}
