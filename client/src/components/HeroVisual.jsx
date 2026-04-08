import React from 'react';

export function HeroVisual() {
  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full mix-blend-screen" />
      
      {/* Wireframe UI Card Container */}
      <div className="absolute inset-4 glass-card border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
        {/* Fake Header */}
        <div className="h-12 border-b border-slate-800 flex items-center px-4 gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-700" />
          <div className="w-3 h-3 rounded-full bg-slate-700" />
          <div className="w-3 h-3 rounded-full bg-slate-700" />
        </div>
        
        {/* Fake Content area */}
        <div className="flex-1 p-6 flex flex-col gap-6">
          {/* Code block skeleton */}
          <div className="w-full h-32 bg-slate-950/80 rounded border border-slate-800 p-4 flex flex-col gap-2">
            <div className="h-2 w-1/3 bg-blue-500/80 rounded" />
            <div className="h-2 w-1/2 bg-slate-700 rounded ml-4" />
            <div className="h-2 w-1/4 bg-slate-700 rounded ml-4" />
            <div className="h-2 w-1/5 bg-slate-600 rounded" />
          </div>

          {/* Metrics skeleton */}
          <div className="flex gap-4">
            <div className="flex-1 h-20 bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
              <div className="h-2 w-1/2 bg-slate-600 rounded mb-4" />
              <div className="h-4 w-3/4 bg-blue-400 rounded" />
            </div>
            <div className="flex-1 h-20 bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
               <div className="h-2 w-1/2 bg-slate-600 rounded mb-4" />
              <div className="h-4 w-3/4 bg-blue-400 rounded" />
            </div>
          </div>

          {/* Chat skeleton */}
           <div className="w-full flex-1 bg-slate-900/80 rounded border border-slate-800 p-4 flex flex-col justify-end gap-3">
             <div className="self-end h-8 w-2/3 bg-blue-600/30 border border-blue-500/30 rounded-2xl rounded-tr-sm" />
             <div className="self-start h-12 w-3/4 bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm" />
           </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -right-8 top-1/4 p-4 glass-card border-blue-500/30 bg-slate-900/90 animate-bounce" style={{animationDuration: '3s'}}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="h-2 w-16 bg-slate-300 rounded" />
        </div>
      </div>
    </div>
  );
}
