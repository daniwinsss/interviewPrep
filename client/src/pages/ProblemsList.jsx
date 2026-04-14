import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Code2, ArrowLeft, Search, ExternalLink, ChevronDown, ChevronRight, Trophy } from 'lucide-react';
import { apiUrl } from '../lib/api';

const API = apiUrl('/api/judge');

const DIVISIONS = ['All', 'Bronze', 'Silver', 'Gold'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

const difficultyStyle = {
  Easy:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
  Medium: 'text-amber-400   bg-amber-400/10   border-amber-400/25',
  Hard:   'text-rose-400   bg-rose-400/10    border-rose-400/25',
};

const divisionStyle = {
  Bronze:  { badge: 'text-amber-500 bg-amber-500/10 border-amber-500/25',      dot: 'bg-amber-500'  },
  Silver:  { badge: 'text-slate-300 bg-slate-300/10 border-slate-300/25',       dot: 'bg-slate-400'  },
  Gold:    { badge: 'text-yellow-300 bg-yellow-300/10 border-yellow-300/25',    dot: 'bg-yellow-400' },
  Platinum:{ badge: 'text-cyan-300  bg-cyan-300/10  border-cyan-300/25',        dot: 'bg-cyan-400'   },
};

const divisionIcon = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold:   '🥇',
  Platinum: '💎',
};

function ProblemRow({ problem, idx }) {
  const dStyle = divisionStyle[problem.division] || { badge: 'text-slate-400 bg-slate-800 border-slate-700', dot: 'bg-slate-500' };
  const diffStyle = difficultyStyle[problem.difficulty] || '';
  return (
    <Link
      to={`/problems/${problem._id}`}
      className="grid grid-cols-[2.5rem_1fr_7rem_6rem_6rem_6rem] gap-3 items-center px-4 py-3.5 bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800/60 hover:border-slate-700 rounded-xl transition-all group"
    >
      <span className="text-slate-600 text-sm font-mono text-right">{idx}</span>

      <div className="flex flex-col min-w-0">
        <span className="font-medium text-slate-200 group-hover:text-white transition-colors truncate text-sm">
          {problem.title}
        </span>
        {problem.topic && (
          <span className="text-[10px] text-blue-400/80 font-semibold uppercase tracking-wider mt-0.5">
            {problem.topic}
          </span>
        )}
      </div>

      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border w-fit ${dStyle.badge}`}>
        <span className="text-base leading-none">{divisionIcon[problem.division] || ''}</span>
        {problem.division || 'Custom'}
      </span>

      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border w-fit ${diffStyle}`}>
        {problem.difficulty}
      </span>

      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-slate-800 border border-slate-700 text-slate-400 font-bold uppercase truncate">
        {problem.topic || 'Misc'}
      </span>

      <span className="text-xs text-slate-500 uppercase tracking-wide">
        {problem.source === 'usaco' ? (
          <span className="flex items-center gap-1 text-blue-400 font-medium">
            USACO <ExternalLink className="w-3 h-3" />
          </span>
        ) : 'Custom'}
      </span>
    </Link>
  );
}

function ProblemGroup({ title, problems, globalStartIdx }) {
  const [open, setOpen] = useState(true);
  const divName = problems[0]?.division;
  const dStyle = divisionStyle[divName] || {};

  return (
    <div className="mb-3">
      {/* Group header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800/40 transition-all group mb-1"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${dStyle.dot || 'bg-slate-500'}`} />
        <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors flex-1 text-left tracking-wide">
          {title}
        </span>
        <span className="text-xs text-slate-500">{problems.length} problem{problems.length !== 1 ? 's' : ''}</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        }
      </button>

      {open && (
        <div className="flex flex-col gap-1 pl-4">
          {problems.map((problem, i) => (
            <ProblemRow key={problem._id} problem={problem} idx={globalStartIdx + i} />
          ))}
        </div>
      )}
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
  const [groupMode, setGroupMode] = useState('contest'); // 'contest' | 'topic' | 'none'

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

  // Grouping logic
  const groups = useMemo(() => {
    if (groupMode === 'none') return [];
    
    const map = {};
    filtered.forEach(p => {
      const key = groupMode === 'contest' ? (p.contest || 'Custom') : (p.topic || 'Misc');
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

    // Sort topics alphabetically
    return entries.sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, groupMode]);

  // Division stats
  const divisionCounts = useMemo(() => {
    const counts = {};
    problems.forEach(p => {
      counts[p.division] = (counts[p.division] || 0) + 1;
    });
    return counts;
  }, [problems]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl flex items-center px-6 gap-4">
        <Link to="/" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Code2 className="text-blue-500 w-5 h-5" />
          Problem Set
        </div>
        <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400">
          {problems.length} problems
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Division Stats Bar */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Bronze', 'Silver', 'Gold', 'Platinum'].map(div => {
              const count = divisionCounts[div] || 0;
              if (count === 0) return null;
              const ds = divisionStyle[div];
              return (
                <button
                  key={div}
                  onClick={() => setDivision(division === div ? 'All' : div)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    division === div
                      ? `${ds.badge} ring-1 ring-current`
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-xl leading-none">{divisionIcon[div]}</span>
                  <div className="text-left">
                    <p className={`text-xs font-bold ${division === div ? '' : 'text-slate-300'}`}>{div}</p>
                    <p className={`text-lg font-bold leading-tight ${division === div ? '' : 'text-slate-100'}`}>{count}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search problems or contests..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-100 placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Division Filter */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              {DIVISIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDivision(d)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    division === d
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    difficulty === d
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Grouping Filter */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              {[
                { id: 'none', label: 'Flat' },
                { id: 'contest', label: 'Contest' },
                { id: 'topic', label: 'Topic' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setGroupMode(mode.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    groupMode === mode.id
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-900/50 rounded-xl border border-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">
            <p className="text-lg font-medium">Failed to load problems</p>
            <p className="text-sm text-slate-500 mt-2">{error} — Is the backend running on port 5000?</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">No problems found</p>
            <p className="text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : groupMode !== 'none' ? (
          /* Grouped view */
          <div>
            {/* Column headers */}
            <div className="grid grid-cols-[2.5rem_1fr_7rem_6rem_6rem_6rem] gap-3 px-4 py-2 mb-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
              <span className="text-right">#</span>
              <span>Title</span>
              <span>Division</span>
              <span>Difficulty</span>
              <span>Topic</span>
              <span>Source</span>
            </div>
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
          /* Flat list */
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[2.5rem_1fr_7rem_6rem_6rem_6rem] gap-3 px-4 py-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
              <span className="text-right">#</span>
              <span>Title</span>
              <span>Division</span>
              <span>Difficulty</span>
              <span>Topic</span>
              <span>Source</span>
            </div>
            {filtered.map((problem, idx) => (
              <ProblemRow key={problem._id} problem={problem} idx={idx + 1} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
