import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ChevronDown, ChevronRight, Filter, LayoutGrid, List, Zap, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Shell from '../components/ui/Shell';
import { apiUrl } from '../lib/api';

const API = apiUrl('/api/judge');

const DIVISIONS = [
  { value: 'All', label: 'All Divisions' },
  { value: 'Bronze', label: 'Bronze' },
  { value: 'Silver', label: 'Silver' },
  { value: 'Gold', label: 'Gold' },
  { value: 'Platinum', label: 'Platinum' },
];

const DIFFICULTIES = [
  { value: 'All', label: 'All Complexity' },
  { value: 'Easy', label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard', label: 'Hard' },
];

const difficultyStyle = {
  Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-rose-50 text-rose-700 border-rose-200',
};

const divisionIcon = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold:   '🥇',
  Platinum: '💎',
};

function ProblemRow({ problem, idx }) {
  const diffStyle = difficultyStyle[problem.difficulty] || 'bg-white text-slate-500 border-slate-200';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.02 }}
    >
      <Link
        to={`/problems/${problem._id}`}
        className="group relative flex items-center gap-6 px-8 py-5 surface hover:surface-strong border-slate-200 hover:border-emerald-200 rounded-3xl transition-all duration-500"
      >
        <div className="w-10 text-slate-300 font-black text-xs tracking-tighter group-hover:text-emerald-600 transition-colors">
          {String(idx).padStart(2, '0')}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-bold text-slate-900 text-lg group-hover:text-emerald-700 transition-colors truncate tracking-tight">
              {problem.title}
            </span>
            {problem.source === 'usaco' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[8px] text-emerald-700 font-black uppercase tracking-widest">
                USACO <ExternalLink className="w-2.5 h-2.5" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black group-hover:text-slate-600 transition-colors">
              {problem.topic || 'General Practice'}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-12">
          <div className="flex flex-col items-end min-w-[100px]">
            <span className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1.5">Division</span>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
              <span className="text-base">{divisionIcon[problem.division] || '⚡'}</span>
              {problem.division || 'Custom'}
            </div>
          </div>

          <div className="flex flex-col items-end min-w-[100px]">
            <span className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1.5">Difficulty</span>
            <Badge className={`px-3 py-0.5 border text-[10px] font-black tracking-widest ${diffStyle}`}>
              {problem.difficulty?.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-slate-200 group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all duration-500">
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-all" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ProblemGroup({ title, problems, globalStartIdx }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-6 px-8 py-4 rounded-[32px] hover:bg-emerald-50 transition-all group border border-transparent hover:border-emerald-100"
      >
        <div className={`p-2 rounded-xl transition-all duration-500 ${open ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400 rotate-[-90deg]'}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
        <span className="text-xs font-black text-slate-900 uppercase tracking-[0.5em] flex-1 text-left">
          {title}
        </span>
        <div className="h-px flex-1 bg-slate-200" />
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
            {problems.length} PROBLEMS
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div 
            initial={{ opacity: 0, height: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
            exit={{ opacity: 0, height: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2">
              {problems.map((problem, i) => (
                <ProblemRow key={problem._id} problem={problem} idx={globalStartIdx + i} />
              ))}
            </div>
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
        if (!res.ok) throw new Error('Failed to load problems');
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
      const key = groupMode === 'contest' ? (p.contest || 'Independent Core') : (p.topic || 'General Practice');
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
      title="Problem Library"
      subtitle="Curated DSA practice sets with clean filters, difficulty tags, and contest grouping."
    >
      <div className="space-y-16">
        {/* Cinematic Filter Bar */}
        <div className="flex flex-col xl:flex-row gap-8 items-end justify-between pb-10 border-b border-slate-200">
          <div className="w-full xl:max-w-xl group">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 block ml-1">Search problems</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-600">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by title, topic, or contest..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-16 bg-white border border-slate-200 rounded-[32px] pl-16 pr-8 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-400 focus:outline-none transition-all duration-500 shadow-soft"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-6 w-full xl:w-auto">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Grouping</span>
              <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-[24px]">
                {['contest', 'topic', 'none'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setGroupMode(mode)}
                    className={`px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                      groupMode === mode ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(15,157,88,0.2)]' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden xl:block h-10 w-px bg-slate-200 mx-2" />

            <div className="flex items-center gap-4 flex-1 xl:flex-none">
              <Select 
                label="Division"
                options={DIVISIONS}
                value={division}
                onChange={setDivision}
                className="flex-1 xl:w-48"
              />
              <Select 
                label="Difficulty"
                options={DIFFICULTIES}
                value={difficulty}
                onChange={setDifficulty}
                className="flex-1 xl:w-48"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="min-h-[500px]">
          {loading ? (
            <div className="space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-[32px] border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="py-32 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-[40px] bg-rose-50 border border-rose-200 text-rose-600 mb-8 shadow-soft">
                <Terminal className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Unable to load problems</h3>
              <p className="text-slate-500 mt-4 max-w-sm mx-auto font-medium leading-relaxed">{error}</p>
              <Button variant="secondary" onClick={() => window.location.reload()} className="mt-10 rounded-2xl px-10">
                Reload library
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-40 text-center">
               <div className="inline-flex items-center justify-center w-24 h-24 rounded-[40px] bg-white border border-slate-200 text-slate-400 mb-8">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">No problems found</h3>
              <p className="text-slate-500 mt-4 tracking-[0.2em] uppercase text-[10px] font-black">Adjust your search or filters</p>
            </div>
          ) : groupMode !== 'none' ? (
            <div className="space-y-12">
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
            <div className="space-y-4">
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
