import React from 'react';
import { motion } from 'framer-motion';

export function HeroVisual() {
  return (
    <div className="relative w-full aspect-[4/3] max-w-[600px] mx-auto">
      <div className="absolute inset-0 bg-radial opacity-80" />
      <div className="absolute -top-16 -left-8 w-64 h-64 bg-[#7c8cff]/25 blur-[180px] pulse-soft" />
      <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/15 blur-[160px]" />

      <div className="absolute inset-0 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0f0f10] via-[#151515] to-[#1c1c1f] shadow-float overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(124,140,255,0.18),transparent_40%)]" />

        <div className="h-12 border-b border-white/10 bg-white/5 flex items-center px-5 gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <div className="ml-auto text-xs text-white/50 uppercase tracking-[0.3em]">AI interview cockpit</div>
        </div>

        <div className="p-6 grid grid-cols-[1.1fr_0.9fr] gap-6 h-[calc(100%-3rem)]">
          <div className="flex flex-col gap-4">
            <motion.div className="surface-strong p-5 relative overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60 uppercase tracking-[0.3em]">Live session</div>
                <div className="text-xs text-white/40">Voice On</div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="h-2 w-3/4 bg-white/30 rounded-full" />
                <div className="h-2 w-2/3 bg-white/20 rounded-full" />
                <div className="h-2 w-1/2 bg-white/20 rounded-full" />
              </div>
              <motion.div className="absolute -right-6 top-8 glass px-4 py-3 flex items-center gap-3 glow-blue" animate={{ y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity }}>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-white to-[#c7ced9] text-black flex items-center justify-center font-bold">AI</div>
                <div>
                  <div className="h-2 w-20 bg-white/30 rounded-full" />
                  <div className="h-2 w-14 bg-white/20 rounded-full mt-2" />
                </div>
              </motion.div>
            </motion.div>

            <motion.div className="surface p-4 relative overflow-hidden" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60 uppercase tracking-[0.3em]">AI feedback</div>
                <div className="text-xs text-white/40">Latency 0.4s</div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="h-2 w-5/6 bg-white/20 rounded-full" />
                <div className="h-2 w-2/3 bg-white/20 rounded-full" />
                <div className="h-2 w-1/3 bg-white/20 rounded-full" />
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-[#7c8cff]/20 blur-[80px]" />
            </motion.div>
          </div>

          <div className="flex flex-col gap-4">
            <motion.div className="glass p-4 flex-1 relative overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="text-xs text-white/60 uppercase tracking-[0.3em]">Code stream</div>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-4/5 bg-white/25 rounded-full" />
                <div className="h-2 w-2/3 bg-white/20 rounded-full" />
                <div className="h-2 w-1/2 bg-white/20 rounded-full" />
                <div className="h-2 w-3/5 bg-white/15 rounded-full" />
              </div>
              <div className="absolute left-4 bottom-4 px-3 py-1 rounded-full bg-white/10 text-xs text-white/70">C++</div>
            </motion.div>

            <motion.div className="surface-strong p-4 relative overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
              <div className="text-xs text-white/60 uppercase tracking-[0.3em]">Decision layer</div>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-semibold">98</div>
                <div>
                  <div className="h-2 w-24 bg-white/40 rounded-full" />
                  <div className="h-2 w-16 bg-white/20 rounded-full mt-2" />
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/10 blur-[80px]" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
