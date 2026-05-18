import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Trophy, Cpu, Globe, Binary, Search, Shuffle, ChevronRight, Monitor, Layers, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
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
    description: 'Strengthen core DSA and problem solving fundamentals.',
    accent: 'emerald'
  },
  {
    id: 'arch',
    label: 'COMPUTER ORGANIZATION',
    domain: 'Computer Organization',
    icon: Cpu,
    description: 'Understand computer architecture and low-level systems.',
    accent: 'purple'
  },
  {
    id: 'cn',
    label: 'COMPUTER NETWORKS',
    domain: 'Computer Network',
    icon: Globe,
    description: 'Build strong networking fundamentals for interviews.',
    accent: 'blue'
  },
  {
    id: 'os',
    label: 'OPERATING SYSTEMS',
    domain: 'Operating System',
    icon: Monitor,
    description: 'Practice OS concepts with interview-focused questions.',
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-20 border-b border-slate-200 flex items-center px-8 bg-white relative z-20 shadow-soft">
        <Link to="/" className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="ml-6">
          <h1 className="font-bold text-slate-900 tracking-tight uppercase text-sm">PrepDost MCQ Bank</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Core CS prep</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background Depth */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-emerald-100 blur-[180px] rounded-full" />
        </div>

        <div className="max-w-5xl w-full z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Choose your topic</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.4em]">Practice MCQs by subject area</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SUBJECTS.map((subject, idx) => (
              <motion.button
                key={subject.id}
                onClick={() => onSelect(subject)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group surface-strong p-8 rounded-[40px] border-slate-200 text-left transition-all hover:border-emerald-200 hover:shadow-soft relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.06] group-hover:opacity-[0.12] transition-all group-hover:scale-110">
                  <subject.icon className="w-32 h-32" />
                </div>
                
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-soft group-hover:scale-110 transition-transform">
                  <subject.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight group-hover:text-emerald-700 transition-colors">{subject.label}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">{subject.description}</p>
                
                <div className="flex items-center gap-3">
                  <Badge className="bg-white text-slate-500 border-slate-200 uppercase tracking-widest text-[9px] font-bold">Full set</Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-widest text-[9px] font-bold">10Q sprint</Badge>
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
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="h-20 border-b border-slate-200 flex items-center px-8 bg-white gap-6 z-20 shadow-soft">
        <button onClick={onBack} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{subject.label}</span>
          <span className="text-sm font-bold text-slate-900">{allQuestions.length} QUESTIONS</span>
        </div>
        
        <div className="flex-1" />
        
        <Button onClick={onStartQuiz} className="h-10 px-6">
          <Shuffle className="w-4 h-4 mr-2" />
          Start random quiz
        </Button>
      </header>

      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by topic or content..."
            className="w-full bg-white border border-slate-200 rounded-2xl px-12 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-400 transition-all placeholder:text-slate-400 uppercase tracking-widest"
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {topicGroups.map(([topic, qs]) => (
            <div key={topic} className="space-y-4">
              <div className="flex items-center gap-4 ml-2">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">{topic}</span>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[9px] font-bold text-slate-400">{qs.length}</span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {qs.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => onStartFromQuestion(q)}
                    className="group surface p-6 rounded-3xl border-slate-200 flex items-start gap-6 text-left transition-all hover:bg-emerald-50 hover:border-emerald-200"
                  >
                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">QID</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">{q.question}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
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
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="h-20 border-b border-slate-200 flex items-center px-8 bg-white gap-6 relative z-30 shadow-soft">
        <button onClick={onBack} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{subject.label}</span>
          <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Practice quiz</span>
        </div>
        <div className="flex-1" />
        <div className="h-10 px-4 rounded-xl border border-slate-200 bg-white flex items-center justify-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question</span>
          <span className="text-sm font-bold text-slate-900">{currentIdx + 1} / {questions.length}</span>
        </div>
      </header>

      {/* Cinematic Progress Bar */}
      <div className="h-1 bg-slate-200 relative z-30">
        <motion.div
          className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(15,157,88,0.3)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Background Visuals */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-200/60 blur-[150px] rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIdx}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            className="max-w-3xl w-full z-10"
          >
            <div ref={containerRef} className="surface-strong p-12 rounded-[50px] border-slate-200 relative overflow-hidden shadow-soft">
              <div className="absolute top-0 right-0 p-12 opacity-[0.06]">
                <Layers className="w-48 h-48" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(15,157,88,0.3)]" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">{question.subDomain || 'CORE TOPIC'}</span>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-12 tracking-tight">{question.question}</h3>

                <div className="grid grid-cols-1 gap-4">
                  {question.options.map((opt, idx) => {
                    const letter = ['A', 'B', 'C', 'D'][idx];
                    let style = 'border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-slate-900';
                    
                    if (isAnswered) {
                      if (idx === question.correct) {
                        style = 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-soft';
                      } else if (idx === selected) {
                        style = 'border-rose-200 bg-rose-50 text-rose-700 shadow-soft';
                      } else {
                        style = 'border-slate-200 bg-slate-50 text-slate-300 opacity-60';
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
                          isAnswered && idx === question.correct ? 'bg-emerald-600 text-white shadow-soft' :
                          isAnswered && idx === selected ? 'bg-rose-500 text-white' :
                          'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                        }`}>
                          {letter}
                        </div>
                        <span className="flex-1 text-sm font-medium leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 pt-8 border-t border-slate-200">
                    {question.explanation && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 mb-8 relative">
                        <div className="flex items-center gap-2 mb-4">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Explanation</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{question.explanation}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${selected === question.correct ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${selected === question.correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {selected === question.correct ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <Button onClick={handleNext} className="h-14 px-8 rounded-2xl">
                        {currentIdx < questions.length - 1 ? 'Next question' : 'View results'}
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
  const grade = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Fair' : 'Needs work';

  return (
    <div className="h-screen flex flex-col items-center justify-center p-8 bg-slate-50 relative overflow-hidden">
      {/* Background Depth */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
        <Trophy className="w-[40vw] h-[40vw]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="max-w-md w-full surface-strong p-12 rounded-[60px] border-slate-200 text-center shadow-soft relative z-10"
      >
        <div className="w-20 h-20 rounded-[32px] bg-emerald-600 text-white flex items-center justify-center mx-auto mb-8 shadow-soft">
          <Zap className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Quiz completed</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-12">{subject.label}</p>

        <div className="mb-12">
          <div className="text-8xl font-black text-slate-900 tracking-tighter mb-4">
            {score}<span className="text-slate-300 text-4xl">/{total}</span>
          </div>
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-[0.3em]">{grade}</div>
          <div className="text-[9px] font-bold text-slate-400 mt-2">Accuracy: {pct}%</div>
        </div>

        <div className="h-1.5 bg-slate-200 rounded-full mb-12 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(15,157,88,0.3)]"
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Button onClick={onRetry} className="h-14 rounded-2xl">
            Start another quiz
          </Button>
          <Button variant="secondary" onClick={onBrowse} className="h-14 rounded-2xl">
            Browse all questions
          </Button>
          <Button variant="secondary" onClick={onChangeSubject} className="h-14 rounded-2xl">
            Change subject
          </Button>
          <Link to="/" className="text-[9px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest mt-6 transition-colors">
            Return to PrepDost
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
      if (all.length < 3) throw new Error(`Not enough questions for "${selectedSubject.label}".`);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-emerald-100 blur-xl rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.4em] mb-2 animate-pulse">Loading questions</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fetching practice set</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-2xl shadow-soft backdrop-blur-xl flex items-center gap-3">
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
