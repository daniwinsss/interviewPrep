import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, ExternalLink, ChevronDown, ChevronRight, Filter, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Shell from '../components/ui/Shell';
import { apiUrl } from '../lib/api';

const API = apiUrl('/api/judge');

const DIVISIONS = ['All', 'Bronze', 'Silver', 'Gold', 'Platinum'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

const difficultyStyle = {
  Easy: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  Hard: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

const divisionIcon = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold:   '🥇',
  Platinum: '💎',
};

function ProblemRow({ problem, idx }) {
  const diffStyle = difficultyStyle[problem.difficulty] || 'bg-white/5 text-white/60 border-white/10';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
    >
      <Link
        to={`/problems/${problem._id}`}
        className="group relative flex items-center gap-6 px-6 py-4 surface hover:surface-strong border-white/5 hover:border-white/10 rounded-2xl transition-all"
      >
        <div className="w-8 text-white/20 font-mono text-sm group-hover:text-white/40 transition-colors">
          {String(idx).padStart(2, '0')}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white group-hover:text-accent transition-colors truncate">
              {problem.title}
            </span>
            {problem.source === 'usaco' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 font-bold uppercase tracking-widest group-hover:border-white/20">
                USACO <ExternalLink className="w-2.5 h-2.5" />
              </div>
            )}
          </div>
          <div className="mt-1 flex items-center gap-4">
            <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">
              {problem.topic || 'General Practice'}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <div className="flex flex-col items-end w-24">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Division</span>
            <div className="flex items-center gap-2 text-sm font-bold text-white/80">
              <span className="text-base">{divisionIcon[problem.division] || '⚡'}</span>
              {problem.division || 'Custom'}
            </div>
          </div>

          <div className="flex flex-col items-end w-24">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Complexity</span>
            <Badge className={`px-2 py-0 border ${diffStyle}`}>
              {problem.difficulty}
            </Badge>
          </div>
          
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
            <ChevronRight className="w-5 h-5 text-white/60" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ProblemGroup({ title, problems, globalStartIdx }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all group"
      >
        <div className={`p-1 rounded-lg transition-transform ${open ? 'rotate-0' : '-rotate-90 text-white/20'}`}>
          <ChevronDown className="w-4 h-4 text-white/60" />
        </div>
        <span className="text-xs font-bold text-white uppercase tracking-[0.3em] flex-1 text-left">
          {title}
        </span>
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
          {problems.length} ENTRIES
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {problems.map((problem, i) => (
              <ProblemRow key={problem._id} problem={problem} idx={globalStartIdx + i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProblemsList() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [division, setDivision] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [groupMode, setGroupMode] = useState('contest'); 

  useEffect(() => {
    async function fetchProblems() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (division !== 'All') params.set('division', division);
        if (difficulty !== 'All') params.set('difficulty', difficulty);

        const res = await fetch(`${API}/problems?${params}`);
        if (!res.ok) throw new Error('Failed to fetch problems');
        const data = await res.json();
        setProblems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProblems();
  }, [division, difficulty]);

  const filtered = useMemo(() =>
    problems.filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.contest || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.topic || '').toLowerCase().includes(search.toLowerCase())
    ),
    [problems, search]
  );

  const groups = useMemo(() => {
    if (groupMode === 'none') return [];
    
    const map = {};
    filtered.forEach(p => {
      const key = groupMode === 'contest' ? (p.contest || 'USACO Archive') : (p.topic || 'General Practice');
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });

    const entries = Object.entries(map);

    if (groupMode === 'contest') {
      return entries.sort(([a], [b]) => {
        const yearA = parseInt(a.match(/\d{4}/)?.[0] || '0');
        const yearB = parseInt(b.match(/\d{4}/)?.[0] || '0');
        return yearB - yearA;
      });
    }

    return entries.sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, groupMode]);

  return (
    <Shell
      title="Architecture Library"
      subtitle="The ultimate collection of high-fidelity engineering problems."
    >
      <div className="space-y-12">
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between pb-8 border-b border-white/5">
          <div className="relative w-full lg:max-w-md group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-white/30 group-focus-within:text-accent transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search library..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 text-white placeholder:text-white/20 focus:bg-white/10 focus:border-accent/40 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
              {['contest', 'topic', 'none'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setGroupMode(mode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    groupMode === mode ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="relative group">
                <select 
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="appearance-none h-12 pl-5 pr-12 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white/80 focus:outline-none focus:border-white/20 cursor-pointer"
                >
                  {DIVISIONS.map(d => <option key={d} value={d}>{d} Division</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>

              <div className="relative group">
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="appearance-none h-12 pl-5 pr-12 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white/80 focus:outline-none focus:border-white/20 cursor-pointer"
                >
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d} Complexity</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="py-24 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-6">
                <Filter className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Execution Error</h3>
              <p className="text-white/50 mt-2 max-w-sm mx-auto">{error}</p>
              <Button variant="secondary" onClick={() => window.location.reload()} className="mt-8">
                Refresh Interface
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-32 text-center">
              <h3 className="text-2xl font-bold text-white/40">No entries matched your signal</h3>
              <p className="text-white/20 mt-2 tracking-widest uppercase text-xs font-bold">Try broadening your search parameters</p>
            </div>
          ) : groupMode !== 'none' ? (
            <div className="space-y-10">
              {(() => {
                let runningIdx = 1;
                return groups.map(([key, groupProblems]) => {
                  const startIdx = runningIdx;
                  runningIdx += groupProblems.length;
                  return (
                    <ProblemGroup
                      key={key}
                      title={key}
                      problems={groupProblems}
                      globalStartIdx={startIdx}
                    />
                  );
                });
              })()}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((problem, idx) => (
                <ProblemRow key={problem._id} problem={problem} idx={idx + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
