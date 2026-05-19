import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { User, Target, Rocket, ArrowRight, CheckCircle, ChevronRight, Briefcase, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingWizard() {
  const { userData, updateUserData } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [niche, setNiche] = useState(userData?.niche || 'B2B SaaS');
  const [targetBudget, setTargetBudget] = useState(userData?.targetBudget || '10k+');
  const [primaryGoal, setPrimaryGoal] = useState(userData?.primaryGoal || 'revenue');

  const niches = ['B2B SaaS', 'E-commerce', 'Real Estate', 'Agencies', 'Healthcare', 'Crypto/Web3'];
  const budgets = ['Under $1k', '$1k - $5k', '$5k - $10k', '$10k+'];
  const goals = [
    { id: 'revenue', temp: 'Increase Revenue', desc: 'Direct impact on bottom line' },
    { id: 'volume', temp: 'Higher Volume', desc: 'More leads in pipeline' },
    { id: 'efficiency', temp: 'Time Efficiency', desc: 'Automate manual processes' },
    { id: 'retention', temp: 'Client Retention', desc: 'Keep existing clients longer' }
  ];

  const handleNext = () => setStep(prev => prev + 1);
  
  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateUserData({
        displayName,
        niche,
        targetBudget,
        primaryGoal,
        onboardingCompleted: true
      });
      toast.success('Profile configured! Welcome aboard.');
    } catch (e: any) {
      toast.error('Failed to complete onboarding: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const slideVariants: any = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050507]/90 backdrop-blur-md p-4">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--brand-primary)]/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="glass-card w-full max-w-2xl relative overflow-hidden flex flex-col min-h-[600px] border border-white/[0.08] shadow-2xl">
        {/* Progress Bar Header */}
        <div className="px-8 py-6 border-b border-white/[0.04] flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] flex items-center justify-center border border-[var(--brand-primary)]/30">
               <Rocket size={14} />
             </div>
             <div>
               <h2 className="text-white font-bold text-sm">Setup Workspace</h2>
               <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider">Step {step} of 3</p>
             </div>
          </div>
          
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-12 h-1.5 rounded-full transition-all duration-300 ${step >= i ? 'bg-[var(--brand-primary)] shadow-[0_0_10px_rgba(255,59,48,0.5)]' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative p-8 z-10 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Welcome aboard. Let's personalize your portal.</h3>
                  <p className="text-white/60 text-sm">Tell us a bit about yourself and the types of clients you serve.</p>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/60 uppercase tracking-widest pl-1">Your Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                        <User size={16} />
                      </div>
                      <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-[#000000]/50 border border-white/10 hover:border-white/20 focus:border-[var(--brand-primary)] focus:bg-[#000000]/80 rounded-xl py-3 pl-11 pr-4 text-white text-sm transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/60 uppercase tracking-widest pl-1">Primary Niche / Industry</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {niches.map(n => (
                        <button
                          key={n}
                          onClick={() => setNiche(n)}
                          className={`py-3 px-4 rounded-xl text-xs flex items-center justify-center transition-all duration-200 border ${niche === n ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-white shadow-[inset_0_0_20px_rgba(255,59,48,0.1)]' : 'border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white/80'}`}
                        >
                          <Briefcase size={12} className="mr-2" opacity={niche === n ? 1 : 0.5}/>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={handleNext}
                    disabled={!displayName.trim()}
                    className="bg-white text-black font-bold py-3 px-8 rounded-xl flex items-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Set your operational targets.</h3>
                  <p className="text-white/60 text-sm">We'll tailor your AI insights based on what you consider an ideal client.</p>
                </div>

                <div className="space-y-8 flex-1">
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono text-white/60 uppercase tracking-widest pl-1">Target Account Size (Budget)</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {budgets.map(b => (
                        <button
                          key={b}
                          onClick={() => setTargetBudget(b)}
                          className={`py-4 px-2 rounded-xl text-sm flex flex-col items-center justify-center gap-1 transition-all duration-200 border ${targetBudget === b ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-white shadow-[inset_0_0_20px_rgba(255,59,48,0.1)]' : 'border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white/80'}`}
                        >
                          <DollarSign size={16} className={targetBudget === b ? 'text-[var(--brand-primary)]' : 'text-white/30'}/>
                          <span className="font-bold">{b}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-mono text-white/60 uppercase tracking-widest pl-1">Primary Objective</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {goals.map(g => (
                        <button
                          key={g.id}
                          onClick={() => setPrimaryGoal(g.id)}
                          className={`p-4 rounded-xl text-left flex items-start gap-3 transition-all duration-200 border ${primaryGoal === g.id ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-white shadow-[inset_0_0_20px_rgba(255,59,48,0.1)]' : 'border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white/80'}`}
                        >
                           <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${primaryGoal === g.id ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]' : 'border-white/30 bg-transparent'}`}>
                             {primaryGoal === g.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                           </div>
                           <div>
                             <div className="font-bold text-sm mb-1">{g.temp}</div>
                             <div className="text-xs opacity-70">{g.desc}</div>
                           </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center">
                  <button onClick={() => setStep(1)} className="text-white/50 hover:text-white px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors">
                    Back
                  </button>
                  <button onClick={handleNext} className="bg-white text-black font-bold py-3 px-8 rounded-xl flex items-center gap-2 hover:bg-zinc-200 transition-colors">
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full text-center">
                
                <div className="flex-1 flex flex-col items-center justify-center mb-8">
                   <div className="w-24 h-24 bg-[var(--brand-primary)]/20 rounded-full flex items-center justify-center border border-[var(--brand-primary)]/30 mb-8 relative">
                     <div className="absolute inset-0 bg-[var(--brand-primary)] rounded-full animate-ping opacity-20"></div>
                     <Target size={40} className="text-[var(--brand-primary)] relative z-10" />
                   </div>
                   <h3 className="text-3xl font-bold text-white mb-4">You're completely set up.</h3>
                   <p className="text-white/60 text-sm max-w-sm mx-auto">
                     Your workspace has been customized for <strong className="text-white">{niche}</strong> clients.
                     The AI is now configured to optimize for <strong className="text-white">{goals.find(g => g.id === primaryGoal)?.temp.toLowerCase()}</strong>.
                   </p>

                   <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-5 text-left w-full max-w-md">
                     <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">Core Features Activated</div>
                     <ul className="space-y-3">
                       <li className="flex items-center gap-3 text-sm text-white/80">
                         <CheckCircle size={14} className="text-[var(--brand-primary)] shrink-0" /> Autonomous Prospecting & Sorting
                       </li>
                       <li className="flex items-center gap-3 text-sm text-white/80">
                         <CheckCircle size={14} className="text-[var(--brand-primary)] shrink-0" /> Financial & Pipeline Intelligence
                       </li>
                       <li className="flex items-center gap-3 text-sm text-white/80">
                         <CheckCircle size={14} className="text-[var(--brand-primary)] shrink-0" /> Dedicated Client Portals
                       </li>
                     </ul>
                   </div>
                </div>

                <div className="flex justify-between items-center shrink-0">
                  <button onClick={() => setStep(2)} className="text-white/50 hover:text-white px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-0" disabled={loading}>
                    Back
                  </button>
                  <button 
                    onClick={handleComplete} 
                    disabled={loading}
                    className="linear-button px-8 py-3 w-64 justify-center"
                  >
                    {loading ? <span className="animate-pulse">Saving...</span> : <>Enter Workspace <ChevronRight size={16} /></>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
