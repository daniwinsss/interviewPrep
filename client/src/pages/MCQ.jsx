import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Circle, RotateCcw, Trophy, BookOpen, Cpu, Globe, Binary, Search, Shuffle, ChevronRight, ChevronDown, Tag, Monitor, Layers, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import { apiUrl } from '../lib/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// ─── API Config ────────────────────────────────────────────────────────────────
const API = apiUrl('/api/mcq');
const ANSWER_MAP = { A: 0, B: 1, C: 2, D: 3 };
const QUESTIONS_PER_QUIZ = 10;

// ─── Subject Config ─────────────────────────────────────────────────────────────
const SUBJECTS = [
  {
    id: 'dsa',
    label: 'DATA STRUCTURES & ALGORITHMS',
    domain: 'Data Structure and Algorithm',
    icon: Binary,
    description: 'Master the fundamental logic of computation.',
    accent: 'emerald'
  },
  {
    id: 'arch',
    label: 'COMPUTER ORGANIZATION',
    domain: 'Computer Organization',
    icon: Cpu,
    description: 'Deconstruct the architecture of silicon.',
    accent: 'purple'
  },
  {
    id: 'cn',
    label: 'COMPUTER NETWORKS',
    domain: 'Computer Network',
    icon: Globe,
    description: 'Map the global neural infrastructure.',
    accent: 'blue'
  },
  {
    id: 'os',
    label: 'OPERATING SYSTEMS',
    domain: 'Operating System',
    icon: Monitor,
    description: 'Interface with the core system kernel.',
    accent: 'rose'
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cleanText(raw) {
  if (!raw) return '';
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&le;/g, '≤')
    .replace(/&ge;/g, '≥')
    .replace(/&ne;/g, '≠')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&infin;/g, '∞')
    .trim();
}

function transformRow(row) {
  return {
    id: row.ID,
    question: cleanText(row.Question),
    options: [row.A, row.B, row.C, row.D].map(cleanText),
    correct: ANSWER_MAP[row.Answer],
    explanation: cleanText(row.Explanation || ''),
    subDomain: row.SubDomain || '',
  };
}

// ─── Phase 1: Subject Selection ────────────────────────────────────────────────
function SubjectSelection({ onSelect }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      <header className="h-20 border-b border-white/5 flex items-center px-8 bg-[#0b0b0c] relative z-20 shadow-xl">
        <Link to="/" className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="ml-6">
          <h1 className="font-bold text-white tracking-tight uppercase text-sm">Theory Terminal</h1>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Intellectual Core</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background Depth */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-accent/10 blur-[180px] rounded-full" />
        </div>

        <div className="max-w-5xl w-full z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h2 className="text-5xl font-black text-white tracking-tighter mb-4">CHOOSE YOUR SECTOR</h2>
            <p className="text-sm font-bold text-white/30 uppercase tracking-[0.4em]">Initialize comprehensive theoretical practice</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SUBJECTS.map((subject, idx) => (
              <motion.button
                key={subject.id}
                onClick={() => onSelect(subject)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group surface-strong p-8 rounded-[40px] border-white/5 text-left transition-all hover:border-accent/30 hover:shadow-[0_0_50px_rgba(124,140,255,0.1)] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110">
                  <subject.icon className="w-32 h-32" />
                </div>
                
                <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <subject.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-accent transition-colors">{subject.label}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-6">{subject.description}</p>
                
                <div className="flex items-center gap-3">
                  <Badge className="bg-white/5 text-white/40 border-white/10 uppercase tracking-widest text-[9px] font-bold">Comprehensive Browse</Badge>
                  <Badge className="bg-accent/10 text-accent border-accent/20 uppercase tracking-widest text-[9px] font-bold">10-Q Sprint</Badge>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Phase 2: Question List ────────────────────────────────────────────────────
function QuestionList({ subject, allQuestions, onStartQuiz, onStartFromQuestion, onBack }) {
  const [search, setSearch] = useState('');
  const [groupByTopic, setGroupByTopic] = useState(true);

  const filtered = useMemo(() => {
    if (!search.trim()) return allQuestions;
    const q = search.toLowerCase();
    return allQuestions.filter(q_ => q_.question.toLowerCase().includes(q) || q_.subDomain.toLowerCase().includes(q));
  }, [allQuestions, search]);

  const topicGroups = useMemo(() => {
    const groups = {};
    filtered.forEach(q => {
      const key = q.subDomain || 'CORE';
      if (!groups[key]) groups[key] = [];
      groups[key].push(q);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="h-screen flex flex-col bg-[#050505]">
      <header className="h-20 border-b border-white/5 flex items-center px-8 bg-[#0b0b0c] gap-6 z-20 shadow-xl">
        <button onClick={onBack} className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{subject.label}</span>
          <span className="text-sm font-bold text-white">{allQuestions.length} DATA POINTS</span>
        </div>
        
        <div className="flex-1" />
        
        <Button onClick={onStartQuiz} className="h-10 px-6">
          <Shuffle className="w-4 h-4 mr-2" />
          START RANDOM SPRINT
        </Button>
      </header>

      <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01]">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="FILTER BY TOPIC OR CONTENT SIGNAL..."
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-12 py-3 text-xs font-bold text-white/80 focus:outline-none focus:border-white/20 transition-all placeholder:text-white/10 uppercase tracking-widest"
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {topicGroups.map(([topic, qs]) => (
            <div key={topic} className="space-y-4">
              <div className="flex items-center gap-4 ml-2">
                <span className="text-[10px] font-black text-accent uppercase tracking-[0.4em]">{topic}</span>
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[9px] font-bold text-white/20">{qs.length}</span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {qs.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => onStartFromQuestion(q)}
                    className="group surface p-6 rounded-3xl border-white/5 flex items-start gap-6 text-left transition-all hover:bg-white/[0.02] hover:border-white/10"
                  >
                    <span className="text-[10px] font-bold text-white/20 mt-1 uppercase">QID</span>
                    <div className="flex-1">
                      <p className="text-sm text-white/70 leading-relaxed group-hover:text-white transition-colors">{q.question}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-accent transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Phase 3: Quiz ─────────────────────────────────────────────────────────────
function Quiz({ subject, questions, onFinish, onBack }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const containerRef = useRef(null);
  const question = questions[currentIdx];

  useEffect(() => {
    if (containerRef.current) {
      renderMathInElement(containerRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
      });
    }
  }, [question, isAnswered]);

  const progress = ((currentIdx + (isAnswered ? 1 : 0)) / questions.length) * 100;

  const handleSelect = (idx) => {
    if (isAnswered) return;
    setSelected(idx);
    setIsAnswered(true);
    if (idx === question.correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setIsAnswered(false);
    } else {
      onFinish(null, score);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#050505]">
      <header className="h-20 border-b border-white/5 flex items-center px-8 bg-[#0b0b0c] gap-6 relative z-30 shadow-xl">
        <button onClick={onBack} className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{subject.label}</span>
          <span className="text-sm font-bold text-white uppercase tracking-widest">SPRINT EVALUATION</span>
        </div>
        <div className="flex-1" />
        <div className="h-10 px-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center gap-2">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Signal</span>
          <span className="text-sm font-bold text-white">{currentIdx + 1} / {questions.length}</span>
        </div>
      </header>

      {/* Cinematic Progress Bar */}
      <div className="h-1 bg-white/5 relative z-30">
        <motion.div
          className="h-full bg-accent shadow-[0_0_15px_rgba(124,140,255,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Background Visuals */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 blur-[150px] rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIdx}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            className="max-w-3xl w-full z-10"
          >
            <div ref={containerRef} className="surface-strong p-12 rounded-[50px] border-white/5 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                <Layers className="w-48 h-48" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(124,140,255,0.5)]" />
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">{question.subDomain || 'CORE LOGIC'}</span>
                </div>

                <h3 className="text-2xl font-bold text-white leading-tight mb-12 tracking-tight">{question.question}</h3>

                <div className="grid grid-cols-1 gap-4">
                  {question.options.map((opt, idx) => {
                    const letter = ['A', 'B', 'C', 'D'][idx];
                    let style = 'border-white/5 bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:border-white/10 hover:text-white';
                    
                    if (isAnswered) {
                      if (idx === question.correct) {
                        style = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]';
                      } else if (idx === selected) {
                        style = 'border-rose-500/50 bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]';
                      } else {
                        style = 'border-white/5 bg-white/[0.01] text-white/20 opacity-40';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        disabled={isAnswered}
                        className={`group p-6 rounded-[32px] border flex items-center gap-6 text-left transition-all duration-300 ${style}`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                          isAnswered && idx === question.correct ? 'bg-emerald-500 text-black shadow-lg' :
                          isAnswered && idx === selected ? 'bg-rose-500 text-white' :
                          'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white'
                        }`}>
                          {letter}
                        </div>
                        <span className="flex-1 text-sm font-medium leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 pt-8 border-t border-white/5">
                    {question.explanation && (
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-8 relative">
                        <div className="flex items-center gap-2 mb-4">
                          <ShieldCheck className="w-4 h-4 text-accent" />
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Logic Validation</span>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed italic">{question.explanation}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${selected === question.correct ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${selected === question.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {selected === question.correct ? 'Pattern Matches' : 'Anomaly Detected'}
                        </span>
                      </div>
                      <Button onClick={handleNext} className="h-14 px-8 rounded-2xl">
                        {currentIdx < questions.length - 1 ? 'PROCEED TO NEXT SIGNAL' : 'ANALYZE RESULTS'}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Phase 4: Results ──────────────────────────────────────────────────────────
function Results({ subject, score, total, onRetry, onBrowse, onChangeSubject }) {
  const pct = Math.round((score / total) * 100);
  const grade = pct >= 80 ? 'OPTIMIZED' : pct >= 60 ? 'STABLE' : pct >= 40 ? 'FRAGMENTED' : 'UNSTABLE';

  return (
    <div className="h-screen flex flex-col items-center justify-center p-8 bg-[#050505] relative overflow-hidden">
      {/* Background Depth */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
        <Trophy className="w-[40vw] h-[40vw]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="max-w-md w-full surface-strong p-12 rounded-[60px] border-white/5 text-center shadow-2xl relative z-10"
      >
        <div className="w-20 h-20 rounded-[32px] bg-white text-black flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
          <Zap className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-black text-white tracking-tighter mb-2">SYSTEM SCAN COMPLETE</h2>
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mb-12">{subject.label}</p>

        <div className="mb-12">
          <div className="text-8xl font-black text-white tracking-tighter mb-4">
            {score}<span className="text-white/10 text-4xl">/{total}</span>
          </div>
          <div className="text-xs font-bold text-accent uppercase tracking-[0.5em]">{grade} OUTPUT</div>
          <div className="text-[9px] font-bold text-white/20 mt-2">EFFICIENCY: {pct}%</div>
        </div>

        <div className="h-1.5 bg-white/5 rounded-full mb-12 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            className="h-full bg-accent shadow-[0_0_15px_rgba(124,140,255,0.5)]"
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Button onClick={onRetry} className="h-14 rounded-2xl">
            INITIALIZE NEW SPRINT
          </Button>
          <Button variant="secondary" onClick={onBrowse} className="h-14 rounded-2xl">
            BROWSE DATA CORE
          </Button>
          <Button variant="secondary" onClick={onChangeSubject} className="h-14 rounded-2xl">
            SWITCH SECTOR
          </Button>
          <Link to="/" className="text-[9px] font-bold text-white/20 hover:text-white uppercase tracking-widest mt-6 transition-colors">
            RETURN TO COMMAND CENTER
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Root MCQ Page ─────────────────────────────────────────────────────────────
export default function MCQ() {
  const [phase, setPhase] = useState('select'); 
  const [subject, setSubject] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [score, setScore] = useState(0);
  const [error, setError] = useState(null);

  const fetchAllForSubject = useCallback(async (selectedSubject) => {
    setSubject(selectedSubject);
    setPhase('loading');
    setError(null);

    try {
      const response = await fetch(`${API}/questions?subject=${selectedSubject.id}`);
      if (!response.ok) throw new Error(`Handshake failed: ${response.status}`);
      const data = await response.json();
      const all = (data.rows || []).map(transformRow);
      if (all.length < 3) throw new Error(`Insufficient data for sector "${selectedSubject.label}".`);
      setAllQuestions(all);
      setPhase('list');
    } catch (e) {
      setError(e.message);
      setPhase('select');
    }
  }, []);

  const startRandomQuiz = useCallback(() => {
    const picked = shuffle(allQuestions).slice(0, QUESTIONS_PER_QUIZ);
    setQuizQuestions(picked);
    setScore(0);
    setPhase('quiz');
  }, [allQuestions]);

  const startFromQuestion = useCallback((q) => {
    const rest = shuffle(allQuestions.filter(x => x.id !== q.id)).slice(0, QUESTIONS_PER_QUIZ - 1);
    setQuizQuestions([q, ...rest]);
    setScore(0);
    setPhase('quiz');
  }, [allQuestions]);

  const handleFinish = useCallback((_, finalScore) => {
    setScore(finalScore);
    setPhase('results');
  }, []);

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
          <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] mb-2 animate-pulse">Synchronizing Neural Link</p>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Retrieving data vectors from sector core</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === 'select' && <SubjectSelection key="select" onSelect={fetchAllForSubject} />}
        {phase === 'list' && (
          <QuestionList
            key="list"
            subject={subject}
            allQuestions={allQuestions}
            onStartQuiz={startRandomQuiz}
            onStartFromQuestion={startFromQuestion}
            onBack={() => setPhase('select')}
          />
        )}
        {phase === 'quiz' && (
          <Quiz
            key="quiz"
            subject={subject}
            questions={quizQuestions}
            onFinish={handleFinish}
            onBack={() => setPhase('list')}
          />
        )}
        {phase === 'results' && (
          <Results
            key="results"
            subject={subject}
            score={score}
            total={quizQuestions.length}
            onRetry={startRandomQuiz}
            onBrowse={() => setPhase('list')}
            onChangeSubject={() => setPhase('select')}
          />
        )}
      </AnimatePresence>
    </>
  );
}
