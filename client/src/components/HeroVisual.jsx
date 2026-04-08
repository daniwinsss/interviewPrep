import React from 'react';

export function HeroVisual() {
  return (
    <div className="relative w-[110%] md:w-full aspect-[4/3] max-w-[540px] mx-auto md:mr-[-10%] translate-x-4 md:translate-x-0">
      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-blue-500/15 blur-[120px] rounded-full mix-blend-screen" />
      
      {/* Main Wireframe Window */}
      <div className="absolute inset-0 bg-[#0a0f1c]/90 backdrop-blur-md border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col rounded-xl">
        
        {/* Fake Mac Window Header */}
        <div className="h-10 border-b border-slate-800/80 bg-[#0f1523] flex items-center px-4 gap-2 shrink-0">
          <div className="w-3 h-3 rounded-full bg-slate-600/80" />
          <div className="w-3 h-3 rounded-full bg-slate-600/80" />
          <div className="w-3 h-3 rounded-full bg-slate-600/80" />
        </div>
        
        {/* Content Container */}
        <div className="flex-1 p-6 flex flex-col gap-5">
          
          {/* Top Large Box */}
          <div className="relative w-full bg-[#070b15] border border-slate-700/40 rounded-xl p-6 flex flex-col gap-4 shadow-inner">
             <div className="h-3 w-1/3 bg-blue-500 rounded-full" />
             <div className="flex flex-col gap-2.5 mt-2">
                <div className="h-2.5 w-4/5 bg-slate-700 rounded-full" />
                <div className="h-2.5 w-3/5 bg-slate-700 rounded-full" />
                <div className="h-2.5 w-1/4 bg-slate-700 rounded-full" />
             </div>
             
             {/* Floating Checkmark Element */}
             <div className="absolute -right-6 top-14 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex items-center gap-4 w-[180px] animate-pulse" style={{animationDuration: '4s'}}>
               <div className="w-8 h-8 shrink-0 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                 <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                 </svg>
               </div>
               <div className="h-2.5 w-full bg-slate-600 rounded-full" />
             </div>
          </div>

          {/* Middle: Two Split Boxes */}
          <div className="grid grid-cols-2 gap-5 min-h-[90px]">
            <div className="h-full bg-[#070b15] border border-slate-700/40 rounded-xl p-5 flex flex-col justify-end gap-4 relative overflow-hidden group">
               <div className="h-2 w-1/2 bg-slate-700 rounded-full" />
               <div className="h-4 w-full bg-blue-400 rounded-full" />
               <div className="absolute inset-0 bg-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="h-full bg-[#070b15] border border-slate-700/40 rounded-xl p-5 flex flex-col justify-end gap-4 relative overflow-hidden group">
               <div className="h-2 w-1/2 bg-slate-700 rounded-full" />
               <div className="h-4 w-full bg-blue-400 rounded-full" />
               <div className="absolute inset-0 bg-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Bottom: Wide Pill Elements Box */}
          <div className="flex-1 w-full bg-[#070b15] border border-slate-700/40 rounded-xl p-5 flex flex-col gap-4 overflow-hidden relative">
             <div className="w-[85%] h-8 bg-blue-900 rounded-r-full absolute left-0 top-6 border-y border-r border-blue-800/60" />
             <div className="w-[70%] h-8 bg-slate-800 rounded-l-full absolute right-0 bottom-6 border-y border-l border-slate-700/50" />
          </div>

        </div>
      </div>
    </div>
  );
}
