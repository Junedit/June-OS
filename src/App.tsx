import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Financials from './screens/Financials';
import Trends from './screens/Trends';
import LeadsDashboard from './screens/LeadsDashboard';
import ProjectsBoard from './screens/ProjectsBoard';
import ClientPortal from './screens/ClientPortal';
import Settings from './screens/Settings';
import Prospector from './screens/Prospector';
import Proposals from './screens/Proposals';
import Contracts from './screens/Contracts';
import AssetsHub from './screens/AssetsHub';
import AIAgents from './screens/AIAgents';
import { Toaster, toast } from 'sonner';
import { useAuth } from './contexts/AuthContext';
import { Key, Command, Hexagon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HomeHUD from './screens/HomeHUD';
import CommandPalette from './components/CommandPalette';
import ActivityTicker from './components/ActivityTicker';
import { addGlobalActivity } from './services/activity';
import { seedPommerLead } from './seedPommer';

// Monkey-patch toast.success to also log to our genuine activity history
if (!(toast as any).__patched) {
  const originalToastSuccess = toast.success;
  toast.success = ((message: string | React.ReactNode, data?: any) => {
    if (typeof message === 'string') {
      let type: 'system' | 'ai' | 'deal' | 'payment' = 'system';
      if (message.toLowerCase().includes('invoice') || message.toLowerCase().includes('paid')) type = 'payment';
      if (message.toLowerCase().includes('generated') || message.toLowerCase().includes('ai')) type = 'ai';
      if (message.toLowerCase().includes('contract') || message.toLowerCase().includes('proposal') || message.toLowerCase().includes('lead')) type = 'deal';
      
      addGlobalActivity(message, type).catch(console.error);
    }
    return originalToastSuccess(message as any, { duration: 3000, ...data });
  }) as any;
  const originalToastError = toast.error;
  toast.error = ((message: string | React.ReactNode, data?: any) => {
    return originalToastError(message as any, { duration: 3000, ...data });
  }) as any;
  (toast as any).__patched = true;
}

import PublicContractView from './screens/PublicContractView';
import PublicInvoiceView from './screens/PublicInvoiceView';
import PublicIntakeView from './screens/PublicIntakeView';
import SalesRoomView from './screens/SalesRoomView';
import ClientOnboardingPortal from './screens/ClientOnboardingPortal';
import ClientVideoReviewHub from './screens/ClientVideoReviewHub';
import PortfolioDelivery from './screens/PortfolioDelivery';
import GodModeBackgroundWorker from './components/GodModeBackgroundWorker';
import AnalyticsHub from './screens/AnalyticsHub';
import OnboardingWizard from './screens/OnboardingWizard';

import Outreach from './screens/Outreach';

import CyberBackground from './components/CyberBackground';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // Start on dashboard/leads
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { user, userData, loading, signInWithEmail, registerWithEmail } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  
  useEffect(() => {
    if (user?.uid) {
      seedPommerLead(user.uid);
    }
  }, [user]);

  // Basic routing for external brand viewers
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('mode') === 'tracker') {
    return <ClientPortal />;
  }
  if (searchParams.get('mode') === 'contract') {
    return <PublicContractView contractId={searchParams.get('id')} />;
  }
  if (searchParams.get('mode') === 'invoice') {
    return <PublicInvoiceView invoiceId={searchParams.get('id')} />;
  }
  if (searchParams.get('mode') === 'sales-room') {
    return <SalesRoomView leadId={searchParams.get('id')} />;
  }
  if (searchParams.get('mode') === 'onboarding') {
    return <ClientOnboardingPortal leadId={searchParams.get('id')} />;
  }
  if (searchParams.get('mode') === 'intake') {
    return <PublicIntakeView userId={searchParams.get('uid')} />;
  }
  if (searchParams.get('mode') === 'video-review') {
    return <ClientVideoReviewHub leadId={searchParams.get('id')} />;
  }
  if (searchParams.get('mode') === 'portfolio') {
    return <PortfolioDelivery />;
  }

  if (loading) {
     return <div className="min-h-screen bg-[#000000] flex items-center justify-center text-white/40 font-mono text-xs uppercase tracking-[0.2em]">Initializing OS...</div>;
  }

  if (!user) {
    const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setAuthError('Please enter a valid email address.');
        return;
      }
      
      if (password.length < 8) {
        setAuthError('Password must be at least 8 characters long.');
        return;
      }

      try {
        if (authMode === 'login') {
          await signInWithEmail(email, password);
        } else {
          await registerWithEmail(email, password);
        }
      } catch (err: any) {
        setAuthError(err.message || 'Authentication failed');
      }
    };

    return (
      <div className="flex bg-[#000000] text-[#F5F5F7] font-body antialiased min-h-screen relative overflow-hidden items-center justify-center">
        <CyberBackground />
        {/* Background Ambient Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#FF3B30]/[0.05] rounded-full blur-[180px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none z-0"></div>
        
        <div className="relative z-10 w-full max-w-[440px] p-12 flex flex-col items-center bg-[#050505]/80 backdrop-blur-[120px] rounded-[32px] cyber-border border-white/[0.04] shadow-[0_40px_100px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-[#1A1A1A] to-[#040404] border border-white/[0.06] shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12),0_0_80px_rgba(255,59,48,0.15)] flex items-center justify-center text-white mb-10 group relative transition-all duration-700 hover:scale-[1.02] overflow-hidden">
            <div className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[24px] bg-[#FF3B30]/20 z-0"></div>
            <Hexagon size={56} className="absolute opacity-10 text-white rotate-90" strokeWidth={1} />
            <Command size={36} strokeWidth={1.5} className="relative z-10 opacity-90 transition-all duration-700 group-hover:text-[#FF3B30]" />
          </div>
          
          <h1 className="text-4xl font-body font-bold mb-3 tracking-[-0.04em] flex items-center gap-2"><span className="text-white">June</span><span className="text-[#FF3B30]">OS</span></h1>
          <p className="text-[#FF3B30]/80 text-center mb-8 font-mono tracking-[0.2em] uppercase text-[10px] font-bold">Secure Admin Access</p>
          
          <form onSubmit={handleEmailAuth} className="w-full space-y-4">
            {authError && <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl text-[#FF3B30] text-xs font-medium text-center">{authError}</div>}
            
            <div className="space-y-3">
              <input 
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all font-mono"
                required
              />
              <input 
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all font-mono"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full linear-button mt-4 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out z-0 relative"></div>
              <Key size={16} className="relative z-10 opacity-70" />
              <span className="relative z-10 font-body uppercase">{authMode === 'login' ? 'Initialize Session' : 'Register Admin'}</span>
            </button>
            
            <button 
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="w-full flex items-center justify-center gap-3 bg-transparent text-white/40 hover:text-white font-medium text-[12px] pt-4 px-6 transition-all font-body tracking-[0.05em] hover:bg-transparent"
            >
              <span>{authMode === 'login' ? "Need an admin account? Register" : "Already an admin? Log in"}</span>
            </button>
          </form>
          
          <div className="mt-12 text-xs text-white/20 font-medium">
            Secure Connection
          </div>
        </div>
      </div>
    );
  }

  // Prevent team members from accessing restricted tabs
  // (Removed for now to give access)

  return (
    <div className="bg-transparent text-white font-body antialiased min-h-screen relative flex">
      <CyberBackground />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#fff_1px,transparent_1px)] [background-size:30px_30px] opacity-[0.015] pointer-events-none"></div>
      <div className="noise-bg mix-blend-overlay"></div>
      <Toaster 
        theme="dark" 
        position="top-center" 
        duration={3000} 
        closeButton 
        toastOptions={{ 
          duration: 3000,
          classNames: {
            closeButton: 'bg-[#111111] text-white border-white/[0.05] hover:bg-[#222222]',
          },
          style: { 
            background: 'rgba(5,5,5,0.95)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            color: '#fff', 
            borderRadius: '16px', 
            fontSize: '13px', 
            boxShadow: '0 16px 32px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.03)',
            backdropFilter: 'blur(24px)' 
          } 
        }} 
      />

      {user && userData && userData.onboardingCompleted === false && (
        <OnboardingWizard />
      )}
      
      <CommandPalette isOpen={paletteOpen} setIsOpen={setPaletteOpen} navigateTo={setActiveTab} />
      <ActivityTicker />
      <GodModeBackgroundWorker />
      
      {/* Background Ambient Glows */}
      <motion.div 
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.03, 0.06, 0.03],
        }} 
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[900px] h-[700px] bg-[#FF3B30] rounded-full blur-[250px] pointer-events-none z-0 mix-blend-screen"
      />
      <motion.div 
        animate={{ 
          scale: [0.9, 1.05, 0.9],
          opacity: [0.02, 0.05, 0.02],
        }} 
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[600px] bg-[#FF3B30] rounded-full blur-[220px] pointer-events-none z-0 mix-blend-screen"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.01, 0.03, 0.01],
        }} 
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[40%] left-[30%] w-[600px] h-[500px] bg-white rounded-full blur-[250px] pointer-events-none z-0 mix-blend-screen"
      />
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="md:pl-[288px] min-h-screen relative overflow-y-auto overflow-x-hidden pb-16 md:pb-0 flex flex-col flex-1 min-w-0 w-full z-10 transition-all duration-500">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <motion.div key="home" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><HomeHUD navigateTo={setActiveTab} /></motion.div>}
          {activeTab === 'dashboard' && <motion.div key="dashboard" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><LeadsDashboard /></motion.div>}
          {activeTab === 'projects' && <motion.div key="projects" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><ProjectsBoard /></motion.div>}
          {activeTab === 'proposals' && <motion.div key="proposals" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><Proposals /></motion.div>}
          {activeTab === 'contracts' && <motion.div key="contracts" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><Contracts /></motion.div>}
          {activeTab === 'agents' && <motion.div key="agents" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><AIAgents /></motion.div>}
          {activeTab === 'assets' && <motion.div key="assets" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><AssetsHub /></motion.div>}
          {activeTab === 'prospector' && <motion.div key="prospector" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><Prospector /></motion.div>}
          {activeTab === 'outreach' && <motion.div key="outreach" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><Outreach /></motion.div>}
          {activeTab === 'analytics' && <motion.div key="analytics" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><AnalyticsHub /></motion.div>}
          {activeTab === 'trends' && <motion.div key="trends" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><Trends /></motion.div>}
          {activeTab === 'financials' && <motion.div key="financials" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><Financials /></motion.div>}
          {activeTab === 'settings' && <motion.div key="settings" initial={{ opacity: 0, y: 10, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full flex-1 flex flex-col"><Settings /></motion.div>}
        </AnimatePresence>
      </main>
    </div>
  );
}
