import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Circle, RotateCcw, Trophy, BookOpen, Cpu, Globe, Binary, Search, Shuffle, ChevronRight, ChevronDown, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import { apiUrl } from '../lib/api';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

// ─── API Config ────────────────────────────────────────────────────────────────
const API = apiUrl('/api/mcq');
const ANSWER_MAP = { A: 0, B: 1, C: 2, D: 3 };
const QUESTIONS_PER_QUIZ = 10;

// ─── Subject Config ─────────────────────────────────────────────────────────────
const SUBJECTS = [
  {
    id: 'dsa',
    label: 'Data Structures & Algorithms',
    domain: 'Data Structure and Algorithm',
    offsets: [0, 100, 200, 300],
    icon: Binary,
    color: 'from-white/10 to-white/5',
    border: 'border-white/15 hover:border-white/30',
    badge: 'bg-white/10 text-white',
    iconColor: 'text-white',
    ring: 'ring-white/20',
  },
  {
    id: 'arch',
    label: 'Computer Organization',
    domain: 'Computer Organization',
    offsets: [400, 500, 600, 700, 800, 900],
    icon: Cpu,
    color: 'from-white/10 to-white/5',
    border: 'border-white/15 hover:border-white/30',
    badge: 'bg-white/10 text-white',
    iconColor: 'text-white',
    ring: 'ring-white/20',
  },
  {
    id: 'cn',
    label: 'Computer Networks',
    domain: 'Computer Network',
    offsets: [1000],
    icon: Globe,
    color: 'from-white/10 to-white/5',
    border: 'border-white/15 hover:border-white/30',
    badge: 'bg-white/10 text-white',
    iconColor: 'text-white',
    ring: 'ring-white/20',
  },
  {
    id: 'os',
    label: 'Operating Systems',
    domain: 'Operating System',
    offsets: [1100, 1200, 1236],
    icon: BookOpen,
    color: 'from-white/10 to-white/5',
    border: 'border-white/15 hover:border-white/30',
    badge: 'bg-white/10 text-white',
    iconColor: 'text-white',
    ring: 'ring-white/20',
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

/**
 * Clean question / option text coming from the HuggingFace dataset.
 * - Decode common HTML entities
 * - Remove stray LaTeX artifacts like \( \) wrappers when possible
 * - Collapse excessive whitespace
 */
function cleanText(raw) {
  if (!raw) return '';
  return raw
    // HTML entities
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
    .replace(/&alpha;/g, 'α')
    .replace(/&beta;/g, 'β')
    .replace(/&gamma;/g, 'γ')
    .replace(/&theta;/g, 'θ')
    .replace(/&lambda;/g, 'λ')
    .replace(/&pi;/g, 'π')
    .replace(/&sigma;/g, 'σ')
    .replace(/&Sigma;/g, 'Σ')
    .replace(/&omega;/g, 'ω')
    // Unescape backslash-escaped common chars
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '  ')
    // Repeated whitespace / newlines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
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
    <div className="min-h-screen page flex flex-col">
      <header className="h-16 border-b border-white/10 flex items-center px-6 bg-[#0f0f10]/80 backdrop-blur-xl">
        <Link to="/" className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="ml-4">
          <h1 className="font-semibold text-lg text-white">Core Subjects Practice</h1>
          <p className="text-xs text-white/60">Choose a subject to begin</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-gradient mb-3">Pick a subject</h2>
            <p className="text-white/60">Browse all questions or start a 10-question sprint.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {SUBJECTS.map((subject, idx) => {
              const Icon = subject.icon;
              return (
                <motion.button
                  key={subject.id}
                  onClick={() => onSelect(subject)}
                  className={`group relative bg-gradient-to-br ${subject.color} border ${subject.border} rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-float cursor-pointer`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-white text-black">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-white text-base leading-snug mb-2">{subject.label}</h3>
                  <Badge variant="outline">MCQ · Browse + Quiz</Badge>
                </motion.button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Topic Group (inside QuestionList) ────────────────────────────────────────
function TopicGroup({ topic, questions, allQuestions, onStartFromQuestion, globalStart, subject }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/50 transition-all group mb-1"
      >
        <Tag className={`w-3.5 h-3.5 shrink-0 ${subject.iconColor}`} />
        <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors flex-1 text-left tracking-wide">
          {topic}
        </span>
        <span className="text-xs text-slate-500">{questions.length} Q</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        }
      </button>
      {open && (
        <div className="flex flex-col gap-1 pl-5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => onStartFromQuestion(q)}
              className="group/row w-full text-left flex items-start gap-3 bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800/60 hover:border-slate-700/60 rounded-xl px-4 py-3 transition-all"
            >
              <span className="text-xs font-bold text-slate-600 w-7 shrink-0 text-right mt-0.5">
                {globalStart + i}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 leading-relaxed group-hover/row:text-white transition-colors">
                  {q.question}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover/row:text-slate-400 shrink-0 transition-colors mt-0.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Phase 2: Question List (topic-grouped) ────────────────────────────────────
function QuestionList({ subject, allQuestions, onStartQuiz, onStartFromQuestion, onBack }) {
  const [search, setSearch] = useState('');
  const [groupByTopic, setGroupByTopic] = useState(true);
  const Icon = subject.icon;

  const filtered = useMemo(() => {
    if (!search.trim()) return allQuestions;
    const q = search.toLowerCase();
    return allQuestions.filter(q_ =>
      q_.question.toLowerCase().includes(q) ||
      q_.subDomain.toLowerCase().includes(q)
    );
  }, [allQuestions, search]);

  // Group by subDomain
  const topicGroups = useMemo(() => {
    const groups = {};
    filtered.forEach(q => {
      const key = q.subDomain || 'General';
      if (!groups[key]) groups[key] = [];
      groups[key].push(q);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="min-h-screen page flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center px-6 bg-[#0f0f10]/80 backdrop-blur-xl gap-4 shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Badge variant="outline">{subject.label}</Badge>
        <span className="text-white/50 text-sm">{allQuestions.length} questions</span>
        <div className="flex-1" />
        <button
          onClick={() => setGroupByTopic(g => !g)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all mr-2 ${
            groupByTopic
              ? 'bg-white text-black border-white'
              : 'bg-white/5 border-white/15 text-white/60 hover:text-white'
          }`}
        >
          <Tag className="w-3 h-3" />
          Topics
        </button>
        <Button size="sm" onClick={onStartQuiz} icon={<Shuffle className="w-4 h-4" />}>
          Random 10-Q Quiz
        </Button>
      </header>

      {/* Search */}
      <div className="px-6 py-4 border-b border-white/10 shrink-0">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions or topics…"
            className="input pl-9"
          />
        </div>
      </div>

      {/* Topic summary chips */}
      {groupByTopic && (
        <div className="px-6 py-3 border-b border-white/10 flex flex-wrap gap-2 shrink-0">
          {topicGroups.map(([topic, qs]) => (
            <Badge key={topic} variant="outline">
              {topic} <span className="opacity-60">({qs.length})</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Question List */}
      <main className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {filtered.length === 0 && (
            <Card hover={false} className="text-center py-12">
              <h3 className="text-lg font-semibold">No questions match your search.</h3>
              <p className="text-white/60 mt-2">Try a broader keyword.</p>
            </Card>
          )}

          {groupByTopic ? (
            (() => {
              let running = 1;
              return topicGroups.map(([topic, qs]) => {
                const start = running;
                running += qs.length;
                return (
                  <TopicGroup
                    key={topic}
                    topic={topic}
                    questions={qs}
                    allQuestions={allQuestions}
                    onStartFromQuestion={onStartFromQuestion}
                    globalStart={start}
                    subject={subject}
                  />
                );
              });
            })()
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => onStartFromQuestion(q)}
                  className="group w-full text-left flex items-start gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl px-4 py-3.5 transition-all"
                >
                  <span className="text-xs font-bold text-white/40 w-8 shrink-0 text-right mt-0.5">
                    {allQuestions.indexOf(q) + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-relaxed group-hover:text-white transition-colors">
                      {q.question}
                    </p>
                    {q.subDomain && (
                      <Badge className="mt-2" variant="outline">
                        {q.subDomain}
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white shrink-0 transition-colors mt-0.5" />
                </button>
              ))}
            </div>
          )}
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

  // Auto-render math when question changes
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

  const progress = ((currentIdx) / questions.length) * 100;

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
      onFinish(null, score + (selected === question.correct ? 1 : 0));
    }
  };

  const Icon = subject.icon;

  return (
    <div className="min-h-screen page flex flex-col">
      <header className="h-16 border-b border-white/10 flex items-center px-6 bg-[#0f0f10]/80 backdrop-blur-xl gap-4">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Badge variant="outline">{subject.label}</Badge>
        <div className="flex-1" />
        <span className="text-sm font-medium text-white/60">
          {currentIdx + 1} <span className="text-white/30">/</span> {questions.length}
        </span>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-white transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div ref={containerRef} className="surface-strong p-8">

            {/* Question meta */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-[0.3em]">
                  Question {currentIdx + 1}
                </span>
                {question.subDomain && (
                  <Badge variant="outline">{question.subDomain}</Badge>
                )}
              </div>

            {/* Question text — styled with proper readability */}
            <div className="mb-7">
              <p className="text-base font-medium text-white leading-relaxed whitespace-pre-wrap">
                {question.question}
              </p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3">
              {question.options.map((opt, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx];
                let style = 'border-white/10 hover:border-white/30 bg-white/5 text-white/70 hover:text-white';

                if (isAnswered) {
                  if (idx === question.correct) {
                    style = 'border-white bg-white text-black';
                  } else if (idx === selected) {
                    style = 'border-white/40 bg-white/10 text-white';
                  } else {
                    style = 'border-white/10 bg-white/5 opacity-50 text-white/40';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={isAnswered}
                    className={`text-left p-4 rounded-xl border flex items-start gap-3 transition-all duration-200 ${style} ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className={`text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      isAnswered && idx === question.correct ? 'bg-black text-white' :
                      isAnswered && idx === selected ? 'bg-white/20 text-white' :
                      'bg-white/10 text-white/50'
                    }`}>{letter}</span>
                    {isAnswered && idx === question.correct ? (
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    ) : isAnswered && idx === selected ? (
                      <XCircle className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed text-sm whitespace-pre-wrap">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Explanation + Next */}
            {isAnswered && (
              <div className="mt-7 pt-6 border-t border-white/10">
                {question.explanation && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5">
                    <p className="text-xs font-bold text-white/50 uppercase tracking-[0.3em] mb-2">Explanation</p>
                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                      {question.explanation}
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">
                    {selected === question.correct ? 'Correct' : 'Incorrect'}
                  </span>
                  <Button onClick={handleNext} size="sm">
                    {currentIdx < questions.length - 1 ? 'Next Question →' : 'See Results'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Phase 4: Results ──────────────────────────────────────────────────────────
function Results({ subject, score, total, onRetry, onBrowse, onChangeSubject }) {
  const pct = Math.round((score / total) * 100);
  const grade = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Needs Work' : 'Keep Practicing';
  const gradeColor = 'text-white';
  const barColor = 'bg-white';

  return (
    <div className="min-h-screen page flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full surface-strong p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-semibold mb-1">Practice Complete</h2>
        <p className="text-white/60 text-sm mb-8">{subject.label}</p>

        <div className="mb-8">
          <div className="text-6xl font-bold mb-2">
            <span className="text-white">{score}</span>
            <span className="text-slate-600 text-3xl">/{total}</span>
          </div>
          <div className={`text-lg font-semibold ${gradeColor}`}>{grade}</div>
          <div className="text-white/60 text-sm">{pct}% correct</div>
        </div>

        <div className="h-2 bg-white/10 rounded-full mb-8 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={onRetry} icon={<RotateCcw className="w-4 h-4" />}>
            Random Quiz Again
          </Button>
          <Button variant="secondary" onClick={onBrowse}>
            Browse Questions
          </Button>
          <Button variant="secondary" onClick={onChangeSubject}>
            Choose Another Subject
          </Button>
          <Link to="/" className="text-white/50 hover:text-white text-sm py-1 transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Root MCQ Page ─────────────────────────────────────────────────────────────
export default function MCQ() {
  const [phase, setPhase] = useState('select'); // 'select' | 'loading' | 'list' | 'quiz' | 'results'
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
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const all = (data.rows || [])
        .map(transformRow);

      if (all.length < 3) {
        throw new Error(`Not enough questions found for "${selectedSubject.label}".`);
      }

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
      <div className="min-h-screen page flex flex-col items-center justify-center text-white gap-4">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Loading questions from HuggingFace…</p>
      </div>
    );
  }

  if (phase === 'list') {
    return (
      <QuestionList
        subject={subject}
        allQuestions={allQuestions}
        onStartQuiz={startRandomQuiz}
        onStartFromQuestion={startFromQuestion}
        onBack={() => setPhase('select')}
      />
    );
  }

  if (phase === 'quiz') {
    return (
      <Quiz
        subject={subject}
        questions={quizQuestions}
        onFinish={handleFinish}
        onBack={() => setPhase('list')}
      />
    );
  }

  if (phase === 'results') {
    return (
      <Results
        subject={subject}
        score={score}
        total={quizQuestions.length}
        onRetry={startRandomQuiz}
        onBrowse={() => setPhase('list')}
        onChangeSubject={() => setPhase('select')}
      />
    );
  }

  // Phase: select
  return (
    <>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/10 border border-white/20 text-white text-sm px-4 py-2 rounded-2xl shadow-lg">
          {error}
        </div>
      )}
      <SubjectSelection onSelect={fetchAllForSubject} />
    </>
  );
}
