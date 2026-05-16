import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Check, ClipboardList, Briefcase, Video, DollarSign, Send, Zap, ChevronRight, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicIntakeView({ userId }: { userId: string | null }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    contactName: '',
    brandName: '',
    contactEmail: '',
    painPoints: '',
    budget: '',
    timeline: '',
    exampleLinks: ''
  });

  const handleNext = () => {
      setStep(prev => prev + 1);
  };

  const handleBack = () => {
      setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!userId) {
        toast.error('Invalid Intake URL: Missing User ID');
        return;
    }
    setLoading(true);
    try {
      // 1. Save to Leads Collection
      const leadPayload = {
        ownerId: userId,
        contactName: formData.contactName,
        brandName: formData.brandName,
        contactEmail: formData.contactEmail,
        niche: "Inbound Lead", // Default or extract
        source: "Public Intake Form",
        status: "new",
        message: formData.painPoints,
        notes: `Budget: ${formData.budget}\nTimeline: ${formData.timeline}\nExamples: ${formData.exampleLinks}\nPain Points: ${formData.painPoints}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const leadRef = await addDoc(collection(db, 'leads'), leadPayload);

      // 2. Fetch owner's settings to see if they have Zapier configured
      const settingsSnap = await getDoc(doc(db, 'settings', userId));
      if (settingsSnap.exists()) {
         const settings = settingsSnap.data();
         if (settings.zapierWebhookUrl) {
            try {
               await fetch(settings.zapierWebhookUrl, {
                  method: 'POST',
                  mode: 'no-cors', // Use no-cors since many webhooks don't return proper CORS headers for the frontend
                  headers: {
                     'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                      ...leadPayload,
                      id: leadRef.id,
                      createdAt: new Date().toISOString()
                  })
               });
            } catch (webhookError) {
               console.error("Webhook trigger failed:", webhookError);
               // Non-fatal, so we don't throw
            }
         }
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Intake Form Error:", error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
      return (
          <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
              <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Invalid Intake URL</h1>
                  <p className="text-white/50">This form is missing the required tracking ID.</p>
              </div>
          </div>
      );
  }

  if (submitted) {
      return (
          <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 overflow-hidden relative">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 via-black to-black opacity-50 z-0"></div>
              
              <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="relative z-10 text-center max-w-md w-full bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] p-12 rounded-[32px]"
              >
                  <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                      <Check size={40} strokeWidth={3} />
                  </div>
                  <h1 className="text-3xl font-bold font-body tracking-tight mb-4 text-white">Application Received</h1>
                  <p className="text-white/60 mb-8 leading-relaxed">
                      Thank you taking the time to share your vision. We'll review your objectives and be in touch shortly.
                  </p>
                  <button onClick={() => window.location.reload()} className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors font-mono">
                      Submit Another
                  </button>
              </motion.div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-brand-primary selection:text-white relative overflow-hidden">
        {/* Subtle grid and gradient */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 -z-10 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-black to-black -z-10 pointer-events-none"></div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-12">
            
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] mb-6">
                        <Zap size={14} className="text-yellow-400" />
                        <span className="text-[10px] font-mono tracking-widest uppercase text-white/70">Partnership Intake</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Let's build something <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">incredible.</span></h1>
                    <p className="text-lg text-white/50">Fill out the details below so we can prepare a strategy tailored to your needs.</p>
                </div>

                {/* Main Form Box */}
                <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/[0.08] p-8 md:p-12 rounded-[32px] shadow-[0_20px_80px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden">
                   
                   {/* Step indicator */}
                   <div className="mb-10 flex items-center justify-between relative z-10">
                       {[1, 2, 3].map((s) => (
                           <div key={s} className="flex-1 flex items-center">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs ${step === s ? 'bg-white text-black font-bold' : step > s ? 'bg-white/20 text-white' : 'bg-white/5 text-white/30'} transition-all`}>
                                   {step > s ? <Check size={14} /> : s}
                               </div>
                               {s < 3 && (
                                   <div className={`flex-1 h-[1px] mx-2 ${step > s ? 'bg-white/20' : 'bg-white/5'} transition-colors`}></div>
                               )}
                           </div>
                       ))}
                   </div>

                   <div className="relative z-10 min-h-[300px]">
                       <AnimatePresence mode="wait">
                           {step === 1 && (
                               <motion.div 
                                  key="step1"
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ duration: 0.3 }}
                                  className="space-y-6"
                               >
                                   <div>
                                       <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3 block">Your Name</label>
                                       <input 
                                           autoFocus
                                           type="text" 
                                           placeholder="John Doe" 
                                           value={formData.contactName}
                                           onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                                           className="w-full bg-[#111] border border-white/[0.08] rounded-xl px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all text-white placeholder-white/20"
                                       />
                                   </div>
                                   <div>
                                       <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3 block">Brand / Company Name</label>
                                       <input 
                                           type="text" 
                                           placeholder="Acme Corp" 
                                           value={formData.brandName}
                                           onChange={(e) => setFormData({...formData, brandName: e.target.value})}
                                           className="w-full bg-[#111] border border-white/[0.08] rounded-xl px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all text-white placeholder-white/20"
                                       />
                                   </div>
                                   <div>
                                       <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3 block">Email Address</label>
                                       <input 
                                           type="email" 
                                           placeholder="john@example.com" 
                                           value={formData.contactEmail}
                                           onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                                           className="w-full bg-[#111] border border-white/[0.08] rounded-xl px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all text-white placeholder-white/20"
                                       />
                                   </div>
                               </motion.div>
                           )}

                           {step === 2 && (
                               <motion.div 
                                  key="step2"
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ duration: 0.3 }}
                                  className="space-y-6"
                               >
                                   <div>
                                       <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3 block flex items-center gap-2"><DollarSign size={14}/> Proposed Budget</label>
                                       <select 
                                          value={formData.budget}
                                          onChange={(e) => setFormData({...formData, budget: e.target.value})}
                                          className="w-full bg-[#111] border border-white/[0.08] rounded-xl px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all text-white appearance-none"
                                       >
                                           <option value="" disabled>Select a range</option>
                                           <option value="<$1k">Less than $1,000</option>
                                           <option value="$1k - $3k">$1,000 - $3,000</option>
                                           <option value="$3k - $10k">$3,000 - $10,000</option>
                                           <option value="$10k+">$10,000+</option>
                                       </select>
                                   </div>
                                   <div>
                                       <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3 block flex items-center gap-2"><Briefcase size={14}/> Expected Timeline</label>
                                       <select 
                                          value={formData.timeline}
                                          onChange={(e) => setFormData({...formData, timeline: e.target.value})}
                                          className="w-full bg-[#111] border border-white/[0.08] rounded-xl px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all text-white appearance-none"
                                       >
                                           <option value="" disabled>Select a timeline</option>
                                           <option value="ASAP">As soon as possible</option>
                                           <option value="1 month">Within 1 month</option>
                                           <option value="1-3 months">1-3 months</option>
                                           <option value="Flexible">Flexible</option>
                                       </select>
                                   </div>
                                   <div>
                                       <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3 block flex items-center gap-2"><Video size={14}/> Example Channels / Links</label>
                                       <input 
                                           type="text" 
                                           placeholder="e.g. YouTube channels you like" 
                                           value={formData.exampleLinks}
                                           onChange={(e) => setFormData({...formData, exampleLinks: e.target.value})}
                                           className="w-full bg-[#111] border border-white/[0.08] rounded-xl px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all text-white placeholder-white/20"
                                       />
                                   </div>
                               </motion.div>
                           )}

                           {step === 3 && (
                               <motion.div 
                                  key="step3"
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ duration: 0.3 }}
                                  className="space-y-6"
                               >
                                   <div>
                                       <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3 block">What are your biggest bottlenecks?</label>
                                       <textarea 
                                           rows={5}
                                           placeholder="Tell us what you're struggling with and what success looks like to you..." 
                                           value={formData.painPoints}
                                           onChange={(e) => setFormData({...formData, painPoints: e.target.value})}
                                           className="w-full bg-[#111] border border-white/[0.08] rounded-xl px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all text-white placeholder-white/20 resize-none"
                                       />
                                   </div>
                               </motion.div>
                           )}
                       </AnimatePresence>
                   </div>

                   {/* Footer Actions */}
                   <div className="mt-8 pt-8 border-t border-white/[0.05] flex items-center justify-between relative z-10">
                       {step > 1 ? (
                           <button onClick={handleBack} className="text-xs font-mono tracking-widest uppercase text-white/40 hover:text-white transition-colors px-4 py-2">
                               Back
                           </button>
                       ) : <div></div>}
                       
                       {step < 3 ? (
                           <button 
                               onClick={handleNext}
                               disabled={step === 1 && (!formData.contactName || !formData.contactEmail)}
                               className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-full font-bold text-xs tracking-[0.2em] uppercase transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_40px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                           >
                               Continue <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                           </button>
                       ) : (
                           <button 
                               onClick={handleSubmit}
                               disabled={loading || !formData.painPoints}
                               className="bg-[var(--brand-primary)] text-white hover:bg-red-600 px-8 py-3.5 rounded-full font-bold text-xs tracking-[0.2em] uppercase transition-all shadow-[0_0_30px_rgba(237,27,36,0.3)] hover:shadow-[0_4px_40px_rgba(237,27,36,0.5)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                               {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Submit Application</>}
                           </button>
                       )}
                   </div>
                </div>
            </div>
            
            {/* Footer branding */}
            <div className="mt-12 text-center relative z-10">
                <p className="text-[10px] font-mono tracking-[0.2em] text-white/30 uppercase flex items-center justify-center gap-2">
                    <Lock size={10} /> Secure Form • Powered by CRM
                </p>
            </div>
        </div>
    </div>
  );
}
