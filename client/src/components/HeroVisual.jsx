import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Code2, Cpu, Terminal } from 'lucide-react';

export function HeroVisual() {
  return (
    <div className="relative w-full aspect-[4/3] max-w-[700px] mx-auto scale-100 lg:scale-110 origin-center lg:translate-x-6">
      {/* Decorative glows */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-400/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-200/30 blur-[120px] rounded-full" />

      {/* Main Container */}
      <div className="relative h-full w-full rounded-[40px] border border-slate-200 bg-white/90 backdrop-blur-3xl shadow-2xl overflow-hidden shadow-[0_0_100px_-40px_rgba(15,157,88,0.25)]">
        {/* Header bar */}
        <div className="h-14 border-b border-slate-200 flex items-center px-6 gap-3 bg-slate-50">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/40" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
            <div className="w-3 h-3 rounded-full bg-green-500/40" />
          </div>
          <div className="ml-4 h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-[0.4em] font-bold">
            <Terminal className="w-3 h-3" />
            prepdost
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="h-2 w-24 bg-slate-200 rounded-full" />
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="p-8 flex flex-col gap-6 h-[calc(100%-3.5rem)] overflow-y-auto">
          {/* Live AI Interview */}
          <motion.div 
            className="surface-strong p-6 relative group overflow-hidden border border-emerald-100 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Live AI Interview</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">ID: PD-294</div>
            </div>
            <div className="space-y-3">
              <div className="h-2.5 w-full bg-slate-200 rounded-full" />
              <div className="h-2.5 w-5/6 bg-slate-100 rounded-full" />
            </div>
          </motion.div>

          {/* Solution.cpp */}
          <motion.div 
            className="surface p-6 overflow-hidden relative border border-slate-100 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Code2 className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">solution.cpp</span>
            </div>
            <div className="space-y-2.5 font-mono">
              <div className="h-2 w-3/4 bg-emerald-200 rounded-full" />
              <div className="h-2 w-full bg-slate-100 rounded-full" />
            </div>
          </motion.div>

          {/* Performance Insights */}
          <motion.div 
            className="glass p-6 overflow-hidden border border-slate-200 min-h-[140px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-6">Performance Insights</div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                  <span className="text-slate-400">Technical</span>
                  <span className="text-slate-900">88%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full w-[88%] bg-emerald-500" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                  <span className="text-slate-400">Clarity</span>
                  <span className="text-slate-900">92%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full w-[92%] bg-emerald-400" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
