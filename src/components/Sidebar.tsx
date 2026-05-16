import React from 'react';
import { 
  LayoutDashboard, 
  FileText,
  FileSignature,
  TrendingUp, 
  Receipt, 
  Settings,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Plus,
  LogOut,
  Telescope,
  Package,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  MonitorPlay,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Zap,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  ArrowUpRight,
  PlayCircle,
  Mail,
  Command,
  Hexagon,
  Bot,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, userRole, logOut } = useAuth();
  
  const menuItems = [
    { id: 'home', label: 'Command Center', icon: Hexagon },
    { id: 'dashboard', label: 'Lead Database', icon: LayoutDashboard },
    { id: 'agents', label: 'AI War Room', icon: Bot },
    { id: 'projects', label: 'Active Projects', icon: PlayCircle },
    { id: 'prospector', label: 'Prospector', icon: Telescope },
    { id: 'outreach', label: 'Outreach', icon: Mail },
    { id: 'analytics', label: 'Deep Analytics', icon: Activity },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'proposals', label: 'Proposals', icon: FileText },
    { id: 'financials', label: 'Financials', icon: Receipt },
    { id: 'contracts', label: 'Contracts', icon: FileSignature },
    { id: 'assets', label: 'Assets', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <nav className="hidden md:flex fixed left-0 top-0 h-full flex-col p-8 w-72 border-r border-white/[0.05] bg-[#000000]/40 backdrop-blur-[80px] saturate-[1.8] z-50">
        <div className="flex items-center gap-4 mb-12 mt-2 relative z-10 group cursor-pointer px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#222222] to-[#000000] border border-white/[0.08] group-hover:border-[#FF3B30]/40 flex items-center justify-center text-[#FF3B30] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_24px_rgba(0,0,0,0.5)] group-hover:shadow-[inset_0_1px_1px_rgba(255,59,48,0.3),0_8px_32px_rgba(255,59,48,0.2)] group-hover:scale-105 transition-all duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#FF3B30]/10 blur-[10px] rounded-full scale-0 group-hover:scale-150 transition-transform duration-700"></div>
            <Hexagon size={24} className="absolute opacity-20 text-white rotate-90" strokeWidth={1} />
            <Command size={18} strokeWidth={2} className="relative z-10 text-white group-hover:text-[#FF3B30] transition-colors" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-body font-bold tracking-[-0.04em] leading-none transition-colors text-white flex items-center gap-1.5 opacity-90"><span className="text-white font-medium">June</span><span className="text-white group-hover:text-[#FF3B30] transition-colors">OS</span></h1>
            <p className="text-[9px] text-[#FF3B30]/80 mt-1.5 uppercase tracking-[0.2em] font-mono opacity-80">{userRole === 'owner' ? 'ROOT ACCESS' : 'NODE ACCESS'}</p>
          </div>
        </div>

        <ul className="flex-1 flex flex-col gap-2 overflow-y-auto hide-scrollbar pb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`group w-full text-left flex items-center gap-4 px-4 py-3 rounded-2xl font-mono uppercase tracking-[0.15em] text-[10px] font-bold transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? 'bg-[var(--brand-primary)]/[0.02] text-white shadow-[0_4px_20px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.05)] border border-[var(--brand-primary)]/20'
                      : 'text-white/40 hover:text-white/90 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--brand-primary)] shadow-[0_0_15px_rgba(255,59,48,0.8)] rounded-r-full"></div>}
                  {isActive && <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--brand-primary)]/10 to-transparent blur-md"></div>}
                  <Icon strokeWidth={isActive ? 2 : 1.5} size={16} className={`transition-all duration-500 shrink-0 ${isActive ? 'scale-110 text-[var(--brand-primary)] drop-shadow-[0_0_8px_rgba(255,59,48,0.4)]' : 'group-hover:scale-110 group-hover:text-white/60'}`} />
                  <span className={`relative z-10 ${isActive ? 'text-glow-red' : ''}`}>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {user && (
          <div className="mt-auto pt-6 border-t border-white/[0.03]">
            <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.03] rounded-2xl hover:bg-white/[0.02] transition-colors cursor-pointer group">
              {user.photoURL ? (
                  <img
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover border border-white/[0.04] grayscale group-hover:grayscale-0 transition-all duration-500"
                    src={user.photoURL}
                  />
              ) : (
                  <div className="w-9 h-9 rounded-full bg-white/5 text-white flex items-center justify-center text-sm font-bold border border-white/[0.04] group-hover:border-white/[0.02]0 transition-colors">
                      {user.email?.charAt(0).toUpperCase()}
                  </div>
              )}
              <div className="text-left flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate font-mono uppercase tracking-wide">{user.displayName || 'Creator'}</p>
                <p className="text-[9px] text-white/60 truncate mt-0.5 uppercase tracking-[0.2em] font-mono">{userRole === 'owner' ? 'Owner' : 'Team Member'}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); logOut(); }}
                className="text-zinc-600 hover:text-white transition-colors p-1"
                title="Disconnect"
              >
                <LogOut size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#000000]/95 backdrop-blur-[40px] saturate-[1.8] border-t border-white/[0.02] z-50 px-2 flex justify-around items-center h-[72px] pb-safe">
        {menuItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`group flex flex-col items-center justify-center w-16 h-full gap-1.5 transition-all duration-300 ${
                 isActive ? 'text-white drop-shadow-[0_0_10px_rgba(255,59,48,0.8)]' : 'text-zinc-600 hover:text-white'
               }`}
            >
               <Icon strokeWidth={isActive ? 2.5 : 1.5} size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)]' : 'group-hover:scale-110 group-hover:-translate-y-1'}`} />
               <span className="text-[8px] font-mono uppercase tracking-[0.2em] w-full text-center font-bold px-1">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
        {user && (
          <button 
            onClick={logOut}
            className="flex flex-col items-center justify-center w-16 h-full gap-1.5 text-zinc-600 hover:text-white transition-colors"
          >
            <LogOut size={20} strokeWidth={1.5} />
            <span className="text-[8px] font-mono uppercase tracking-[0.2em] font-bold">Exit</span>
          </button>
        )}
      </nav>
    </>
  );
}
