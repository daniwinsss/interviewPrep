import React from 'react';

export function HeroVisual() {
  return (
    <div className="relative w-full aspect-[4/3] max-w-[560px] mx-auto">
      <div className="absolute inset-0 bg-radial opacity-80" />
      <div className="absolute -top-12 -left-10 w-56 h-56 bg-white/5 blur-[120px]" />
      <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-white/10 blur-[140px]" />

      <div className="absolute inset-0 glass shadow-float overflow-hidden">
        <div className="h-10 border-b border-white/10 bg-black/40 flex items-center px-4 gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
        </div>

        <div className="p-6 grid grid-rows-[1.2fr_0.8fr_1fr] gap-5 h-full">
          <div className="relative surface-strong p-6">
            <div className="flex items-center justify-between">
              <div className="h-2 w-24 bg-white/70 rounded-full" />
              <div className="h-2 w-12 bg-white/30 rounded-full" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="h-2 w-3/4 bg-white/20 rounded-full" />
              <div className="h-2 w-2/3 bg-white/20 rounded-full" />
              <div className="h-2 w-1/2 bg-white/20 rounded-full" />
            </div>
            <div className="absolute -right-6 top-10 glass px-4 py-3 flex items-center gap-3 shadow-float">
              <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center font-bold">AI</div>
              <div className="h-2 w-20 bg-white/20 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="surface p-4 flex flex-col gap-3">
              <div className="h-2 w-1/2 bg-white/30 rounded-full" />
              <div className="h-4 w-full bg-white/80 rounded-full" />
              <div className="h-3 w-5/6 bg-white/20 rounded-full" />
            </div>
            <div className="surface p-4 flex flex-col gap-3">
              <div className="h-2 w-1/2 bg-white/30 rounded-full" />
              <div className="h-4 w-full bg-white/80 rounded-full" />
              <div className="h-3 w-4/6 bg-white/20 rounded-full" />
            </div>
          </div>

          <div className="surface-strong p-5 relative overflow-hidden">
            <div className="absolute left-0 top-6 w-[70%] h-8 bg-white/10 rounded-r-full" />
            <div className="absolute right-0 bottom-6 w-[55%] h-8 bg-white/20 rounded-l-full" />
            <div className="absolute right-6 top-6 h-2 w-20 bg-white/50 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
