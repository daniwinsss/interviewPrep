import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Shell from '../components/ui/Shell';
import { apiUrl } from '../lib/api';

const API = apiUrl('/api/judge');

const DIVISIONS = ['All', 'Bronze', 'Silver', 'Gold'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

const difficultyStyle = {
  Easy: 'text-white bg-white/10 border-white/15',
  Medium: 'text-white bg-white/10 border-white/15',
  Hard: 'text-white bg-white/10 border-white/15',
};

const divisionStyle = {
  Bronze: { badge: 'text-white bg-white/10 border-white/15', dot: 'bg-white/60' },
  Silver: { badge: 'text-white bg-white/10 border-white/15', dot: 'bg-white/60' },
  Gold: { badge: 'text-white bg-white/10 border-white/15', dot: 'bg-white/60' },
  Platinum: { badge: 'text-white bg-white/10 border-white/15', dot: 'bg-white/60' },
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
      className="grid grid-cols-[2.5rem_1fr_7rem_6rem_6rem_6rem] gap-3 items-center px-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all group"
    >
      <span className="text-white/40 text-sm font-mono text-right">{idx}</span>

      <div className="flex flex-col min-w-0">
        <span className="font-medium text-white group-hover:text-white transition-colors truncate text-sm">
          {problem.title}
        </span>
        {problem.topic && (
          <span className="text-[10px] text-white/50 font-semibold uppercase tracking-[0.2em] mt-1">
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

      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-white/10 border border-white/15 text-white/70 font-bold uppercase truncate">
        {problem.topic || 'Misc'}
      </span>

      <span className="text-xs text-white/50 uppercase tracking-wide">
        {problem.source === 'usaco' ? (
          <span className="flex items-center gap-1 text-white/70 font-medium">
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
    <div className="mb-4">
      {/* Group header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group mb-1"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${dStyle.dot || 'bg-slate-500'}`} />
        <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors flex-1 text-left tracking-[0.2em]">
          {title}
        </span>
        <span className="text-xs text-white/40">{problems.length} problem{problems.length !== 1 ? 's' : ''}</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-white/50 shrink-0" />
        }
      </button>

      {open && (
        <div className="flex flex-col gap-2 pl-4">
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
    <Shell
      title="Problem library"
      subtitle="Curated, high-signal problems organized for interview readiness. Filter by division, difficulty, or topic."
    >
      <div className="flex items-center gap-3 text-white/60 mb-8">
        <Link to="/" className="hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <Badge variant="outline">{problems.length} problems</Badge>
      </div>

      <main className="flex flex-col gap-8">

        {/* Division Stats Bar */}
        {!loading && !error && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['Bronze', 'Silver', 'Gold', 'Platinum'].map(div => {
                const count = divisionCounts[div] || 0;
                if (count === 0) return null;
                const ds = divisionStyle[div];
                return (
                  <button
                    key={div}
                    onClick={() => setDivision(division === div ? 'All' : div)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                      division === div
                        ? `${ds.badge} ring-1 ring-white/40`
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-white/70'
                    }`}
                  >
                    <span className="text-xl leading-none">{divisionIcon[div]}</span>
                    <div className="text-left">
                      <p className="text-xs font-bold uppercase tracking-[0.2em]">{div}</p>
                      <p className="text-lg font-bold leading-tight text-white">{count}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        {/* Search + Filters */}
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search problems, topics, or contests"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-11"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
              {DIVISIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDivision(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    division === d ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    difficulty === d ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
              {[
                { id: 'none', label: 'Flat' },
                { id: 'contest', label: 'Contest' },
                { id: 'topic', label: 'Topic' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setGroupMode(mode.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    groupMode === mode.id ? 'bg-white text-black' : 'text-white/60 hover:text-white'
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
          <div className="grid gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <Card hover={false} className="text-center py-16">
            <h3 className="text-lg font-semibold">Failed to load problems</h3>
            <p className="text-white/60 mt-2">{error} — Ensure the backend is running.</p>
            <div className="mt-6">
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <Card hover={false} className="text-center py-16">
            <h3 className="text-lg font-semibold">No problems found</h3>
            <p className="text-white/60 mt-2">Try adjusting your filters or search.</p>
          </Card>
        ) : groupMode !== 'none' ? (
          /* Grouped view */
          <div>
            {/* Column headers */}
            <div className="grid grid-cols-[2.5rem_1fr_7rem_6rem_6rem_6rem] gap-3 px-4 py-2 mb-3 text-xs font-semibold text-white/40 uppercase tracking-[0.3em]">
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
            <div className="grid grid-cols-[2.5rem_1fr_7rem_6rem_6rem_6rem] gap-3 px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-[0.3em]">
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
    </Shell>
  );
}
