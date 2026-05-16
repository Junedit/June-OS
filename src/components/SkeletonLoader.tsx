import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion } from 'motion/react';

interface SkeletonProps {
  type: 'dashboard' | 'kanban' | 'list' | 'analytics';
}

export default function SkeletonLoader({ type }: SkeletonProps) {
  if (type === 'kanban') {
    return (
      <div className="flex-1 bg-transparent w-full min-h-screen relative flex flex-col z-0 p-10">
        <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/[0.02]">
          <div className="w-1/3 h-12 bg-white/[0.02] rounded-2xl animate-pulse"></div>
          <div className="w-1/4 h-12 bg-white/[0.02] rounded-2xl animate-pulse"></div>
        </div>
        <div className="flex gap-10 overflow-x-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[340px] w-[340px] flex flex-col max-h-full h-[calc(100vh-140px)] bg-transparent/40 border border-white/[0.03] rounded-[24px] overflow-hidden">
               <div className="px-5 py-5 border-b border-white/[0.02] bg-transparent">
                  <div className="w-1/2 h-4 bg-white/[0.05] rounded animate-pulse"></div>
               </div>
               <div className="p-3 flex flex-col gap-3 relative">
                 {[1, 2, 3].map((card) => (
                   <div key={card} className="bg-[#0a0a0a] min-h-[140px] border border-white/[0.02] p-5 rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse"></div>
                       <div className="w-3/4 h-5 bg-white/[0.02] rounded animate-pulse"></div>
                     </div>
                     <div className="w-full h-16 bg-white/[0.02] rounded-2xl animate-pulse"></div>
                   </div>
                 ))}
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className="flex-1 bg-transparent w-full min-h-screen p-10">
         <div className="w-1/4 h-10 bg-white/[0.02] rounded-2xl animate-pulse mb-8"></div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/[0.02] border border-white/[0.02] rounded-[24px] animate-pulse"></div>
            ))}
         </div>
         <div className="h-[400px] w-full bg-white/[0.02] border border-white/[0.02] rounded-[24px] animate-pulse"></div>
      </div>
    );
  }

  if (type === 'list') {
     return (
       <div className="flex-1 bg-transparent w-full min-h-screen p-10">
          <div className="w-1/3 h-12 bg-white/[0.02] rounded-2xl animate-pulse mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-transparent border border-white/[0.02] rounded-[24px] animate-pulse"></div>
            ))}
          </div>
       </div>
     );
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] bg-transparent">
      <div className="w-16 h-16 rounded-full border border-white/20 border-t-[var(--brand-primary)] animate-spin shadow-[0_4px_24px_rgba(255,255,255,0.15)]"></div>
    </div>
  );
}
