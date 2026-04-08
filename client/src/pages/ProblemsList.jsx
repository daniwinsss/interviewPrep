import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code2, ArrowLeft, Search, Filter, ExternalLink } from 'lucide-react';

const API = 'http://localhost:5000/api/judge';

const DIVISIONS = ['All', 'Bronze', 'Silver'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

const difficultyColor = {
  Easy: 'text-green-400 bg-green-400/10 border-green-400/20',
  Medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Hard: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const divisionColor = {
  Bronze: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Silver: 'text-slate-300 bg-slate-300/10 border-slate-300/20',
  Gold: 'text-yellow-300 bg-yellow-300/10 border-yellow-300/20',
};

export default function ProblemsList() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [division, setDivision] = useState('All');
  const [difficulty, setDifficulty] = useState('All');

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

  const filtered = problems.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

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

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-100 placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
            />
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {DIVISIONS.map(d => (
              <button
                key={d}
                onClick={() => setDivision(d)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
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
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  difficulty === d
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col gap-3">
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
        ) : (
          <div className="flex flex-col gap-2">
            {/* Column Headers */}
            <div className="grid grid-cols-[2rem_1fr_6rem_6rem_6rem] gap-4 px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>#</span>
              <span>Title</span>
              <span>Division</span>
              <span>Difficulty</span>
              <span>Source</span>
            </div>

            {filtered.map((problem, idx) => (
              <Link
                key={problem._id}
                to={`/problems/${problem._id}`}
                className="grid grid-cols-[2rem_1fr_6rem_6rem_6rem] gap-4 items-center px-4 py-3.5 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/60 hover:border-slate-700/60 rounded-xl transition-all group"
              >
                <span className="text-slate-600 text-sm font-mono">{idx + 1}</span>
                <span className="font-medium text-slate-200 group-hover:text-white transition-colors truncate">
                  {problem.title}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border w-fit ${divisionColor[problem.division] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                  {problem.division || 'Custom'}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border w-fit ${difficultyColor[problem.difficulty] || ''}`}>
                  {problem.difficulty}
                </span>
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                  {problem.source === 'usaco' ? (
                    <span className="flex items-center gap-1 text-blue-400">
                      USACO <ExternalLink className="w-3 h-3" />
                    </span>
                  ) : 'Custom'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
