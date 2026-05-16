import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, Code2, ArrowLeft, Clock, MemoryStick, CheckCircle, XCircle, AlertTriangle, ChevronDown, Terminal, Info, Zap, TerminalSquare } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import { apiUrl } from '../lib/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const API = apiUrl('/api/judge');

const LANG_MAP = {
  java: { label: 'Java', monacoLang: 'java' },
  python: { label: 'Python', monacoLang: 'python' },
  cpp: { label: 'C++', monacoLang: 'cpp' },
};

const statusIcon = {
  accepted:    <CheckCircle className="w-5 h-5 text-emerald-400" />,
  wrong_answer:<XCircle className="w-5 h-5 text-rose-400" />,
  error:       <AlertTriangle className="w-5 h-5 text-amber-400" />,
  tle:         <Clock className="w-5 h-5 text-yellow-400" />,
};

const statusLabel = {
  accepted:     'System Accepted',
  wrong_answer: 'Logic Mismatch',
  error:        'Runtime Exception',
  tle:          'Latency Threshold Exceeded',
};

function escapeHtml(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPlainTextDescription(text = '') {
  const normalized = String(text).replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';
  if (/<[a-z][\s\S]*>/i.test(normalized)) return normalized;

  const sectionNames = [
    'INPUT FORMAT',
    'OUTPUT FORMAT',
    'SAMPLE INPUT',
    'SAMPLE OUTPUT',
    'SCORING'
  ];

  const lines = normalized.split('\n');
  let html = '';
  let inPre = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isSection = sectionNames.some(name => trimmed.startsWith(name));
    const isAllCapsLine = trimmed.length > 0 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
    const nextTrimmed = (lines[i + 1] || '').trim();
    const looksLikeSampleData = /^-?\d+(\s+-?\d+)*$/.test(trimmed) || (/^[01]+$/.test(trimmed) && trimmed.length > 1);

    if (isSection || isAllCapsLine) {
      if (inPre) {
        html += '</pre>';
        inPre = false;
      }
      html += `<h4>${escapeHtml(trimmed)}</h4>`;
      continue;
    }

    if (!trimmed) {
      if (inPre) {
        html += '</pre>';
        inPre = false;
      }
      continue;
    }

    if (
      looksLikeSampleData ||
      (inPre && trimmed) ||
      (nextTrimmed && /^-?\d+(\s+-?\d+)*$/.test(nextTrimmed) && trimmed.length < 120)
    ) {
      if (!inPre) {
        html += '<pre>';
        inPre = true;
      } else {
        html += '\n';
      }
      html += escapeHtml(line);
      continue;
    }

    if (inPre) {
      html += '</pre>';
      inPre = false;
    }

    html += `<p>${escapeHtml(trimmed)}</p>`;
  }

  if (inPre) html += '</pre>';
  return html;
}

const ProblemDescriptionHtml = memo(function ProblemDescriptionHtml({ html, descriptionRef }) {
  return (
    <div
      ref={descriptionRef}
      className="prose prose-invert prose-slate max-w-none prose-h4:text-xs prose-h4:uppercase prose-h4:tracking-[0.2em] prose-h4:font-bold prose-h4:text-white/40 prose-p:text-white/70 prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export default function CodeEditor() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('description'); 
  const descriptionRef = useRef(null);
  const formattedDescription = useMemo(
    () => formatPlainTextDescription(problem?.description || ''),
    [problem?.description]
  );

  useEffect(() => {
    if (activeTab === 'description' && descriptionRef.current) {
      renderMathInElement(descriptionRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        ignoredTags: ["script", "noscript", "style", "textarea", "code", "option"],
        throwOnError: false,
      });
    }
  }, [formattedDescription, activeTab, loading]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/problems/${id}`);
        if (!res.ok) throw new Error('Problem not found');
        const data = await res.json();
        setProblem(data);
        setCode(data.starterCode?.[language] || '// Initialize solution pattern\n');
        if (data.testCases?.[0]) setCustomInput(data.testCases[0].input);
      } catch (err) {
        setProblem(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(problem?.starterCode?.[lang] || '// Initialize solution pattern\n');
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActiveTab('results');
    setOutput(null);
    try {
      const res = await fetch(`${API}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, stdin: customInput })
      });
      const data = await res.json();
      setOutput({ type: 'run', ...data });
    } catch (err) {
      setOutput({ type: 'run', status: 'error', stderr: err.message, stdout: '' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setActiveTab('results');
    setOutput(null);
    try {
      const res = await fetch(`${API}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, problemId: id, userId: localStorage.getItem('token') || 'anonymous' })
      });
      const data = await res.json();
      setOutput({ type: 'submit', ...data });
    } catch (err) {
      setOutput({ type: 'submit', status: 'error', stderr: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden">
      {/* Cinematic Header */}
      <header className="h-16 border-b border-white/5 flex items-center px-6 justify-between bg-[#0b0b0c] relative z-20">
        <div className="flex items-center gap-6">
          <Link to="/problems" className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">Workspace</span>
              <div className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-sm font-bold text-white">
                {loading ? 'Decrypting signal...' : (problem?.title || 'Signal Lost')}
              </span>
            </div>
          </div>
          {problem && (
            <div className="flex items-center gap-2">
              <Badge className="bg-white/5 text-white/40 border-white/10 uppercase tracking-widest text-[9px] font-bold">
                {problem.difficulty}
              </Badge>
              {problem.division && (
                <Badge className="bg-accent/10 text-accent border-accent/20 uppercase tracking-widest text-[9px] font-bold">
                  {problem.division}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <select
              value={language}
              onChange={e => handleLanguageChange(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 text-white/80 text-xs font-bold uppercase tracking-widest px-4 py-2 pr-10 rounded-xl focus:outline-none focus:border-white/20 cursor-pointer"
            >
              {(problem?.languages || ['cpp', 'java', 'python']).map(lang => (
                <option key={lang} value={lang}>{LANG_MAP[lang]?.label || lang}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>

          <div className="h-6 w-px bg-white/10 mx-2" />

          <Button 
            variant="secondary" 
            onClick={handleRun} 
            disabled={isRunning || isSubmitting} 
            className="h-10 px-5 border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isRunning ? 'Executing...' : 'Run Signal'}
          </Button>

          <Button 
            onClick={handleSubmit} 
            disabled={isRunning || isSubmitting} 
            className="h-10 px-6"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Validating...' : 'Commit Signal'}
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Problem Content */}
        <div className="w-[450px] border-r border-white/5 flex flex-col bg-[#0b0b0c] relative z-10 shadow-2xl">
          <div className="flex border-b border-white/5 bg-white/[0.02]">
            {[
              { id: 'description', label: 'Briefing', icon: Info },
              { id: 'results', label: 'Diagnostics', icon: TerminalSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === tab.id ? 'text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="tab-active" className="absolute bottom-0 inset-x-0 h-[2px] bg-accent shadow-[0_0_10px_rgba(124,140,255,0.5)]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'description' ? (
                <motion.div 
                  key="desc"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8"
                >
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-3 bg-white/5 rounded-full animate-pulse" style={{ width: `${80 - i * 10}%` }} />
                      ))}
                    </div>
                  ) : !problem ? (
                    <div className="py-12 text-center text-white/30 uppercase tracking-widest text-[10px] font-bold">Signal Encrypted / Lost</div>
                  ) : (
                    <>
                      <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{problem.title}</h1>
                        <p className="text-xs font-bold text-accent uppercase tracking-widest">{problem.contest || 'Independent Core'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="surface p-4 rounded-2xl border-white/5">
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-2">Time Limit</span>
                          <div className="flex items-center gap-2 text-white font-bold">
                            <Clock className="w-4 h-4 text-white/40" />
                            {problem.timeLimit / 1000}s
                          </div>
                        </div>
                        <div className="surface p-4 rounded-2xl border-white/5">
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-2">Memory</span>
                          <div className="flex items-center gap-2 text-white font-bold">
                            <MemoryStick className="w-4 h-4 text-white/40" />
                            {problem.memoryLimit}MB
                          </div>
                        </div>
                      </div>

                      <ProblemDescriptionHtml html={formattedDescription} descriptionRef={descriptionRef} />

                      {/* Sample IO */}
                      {problem.testCases?.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-white/5" />
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Training Samples</span>
                            <div className="h-px flex-1 bg-white/5" />
                          </div>
                          {problem.testCases.map((tc, i) => (
                            <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                              <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5">
                                <div className="p-3 text-[9px] font-bold text-white/30 uppercase tracking-widest text-center">Input</div>
                                <div className="p-3 text-[9px] font-bold text-white/30 uppercase tracking-widest text-center">Expected</div>
                              </div>
                              <div className="grid grid-cols-2 divide-x divide-white/5 font-mono text-[11px]">
                                <pre className="p-4 text-white/70 whitespace-pre-wrap">{tc.input}</pre>
                                <pre className="p-4 text-white whitespace-pre-wrap">{tc.output}</pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  {!output ? (
                    <div className="py-32 text-center">
                      <Terminal className="w-12 h-12 text-white/5 mx-auto mb-4" />
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Awaiting diagnostic signal...</p>
                    </div>
                  ) : output.type === 'run' ? (
                    <div className="space-y-6">
                      <div className={`p-6 rounded-3xl border flex items-center gap-4 ${output.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        {output.status === 'success' ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest">{output.status === 'success' ? 'Execution Complete' : 'Pattern Mismatch'}</p>
                          <p className="text-xl font-bold">{output.status === 'success' ? `${output.time}ms` : 'System Error'}</p>
                        </div>
                      </div>
                      
                      {output.stdout && (
                        <div className="space-y-3">
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest ml-4">Terminal Output</span>
                          <pre className="surface p-6 rounded-3xl border-white/5 font-mono text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
                            {output.stdout}
                          </pre>
                        </div>
                      )}
                      
                      {output.stderr && (
                        <div className="space-y-3">
                          <span className="text-[9px] font-bold text-rose-500/50 uppercase tracking-widest ml-4">Error Stream</span>
                          <pre className="bg-rose-500/5 p-6 rounded-3xl border border-rose-500/10 font-mono text-xs text-rose-300/80 whitespace-pre-wrap leading-relaxed">
                            {output.stderr}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className={`p-6 rounded-3xl border flex items-center gap-5 ${output.status === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                          {statusIcon[output.status] || <AlertTriangle className="w-8 h-8" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-1">{statusLabel[output.status] || output.status}</p>
                          <p className="text-2xl font-bold text-white">
                            {output.passed} <span className="text-white/20">/</span> {output.total}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {output.results?.map((r, i) => (
                          <div key={i} className="surface-strong p-4 rounded-2xl border-white/5 group hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${r.passed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Probe {r.testCase}</span>
                              </div>
                              <span className={`text-[10px] font-bold ${r.passed ? 'text-emerald-400' : 'text-rose-400'}`}>{r.time}ms</span>
                            </div>
                            {!r.passed && r.input !== undefined && (
                              <div className="mt-4 space-y-3 border-t border-white/5 pt-4 font-mono text-[10px] text-white/40">
                                {r.input && <div><span className="text-accent/50 uppercase">Signal Input</span><pre className="mt-1 text-white/70 bg-black/40 p-2 rounded-lg">{r.input}</pre></div>}
                                {r.expected && <div><span className="text-emerald-500/50 uppercase">Expected Pattern</span><pre className="mt-1 text-white/70 bg-black/40 p-2 rounded-lg">{r.expected}</pre></div>}
                                {r.actual && <div><span className="text-rose-500/50 uppercase">Observed Signal</span><pre className="mt-1 text-white/70 bg-black/40 p-2 rounded-lg">{r.actual}</pre></div>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Content: IDE */}
        <div className="flex-1 flex flex-col bg-[#050505]">
          <div className="flex-1 relative">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 blur-[180px] rounded-full" />
            </div>
            <div className="h-full relative z-10">
              <Editor
                height="100%"
                language={LANG_MAP[language]?.monacoLang || 'cpp'}
                theme="vs-dark"
                value={code}
                onChange={val => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 32, bottom: 32 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  backgroundColor: '#050505',
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  contextmenu: false,
                }}
              />
            </div>
          </div>

          {/* Input Panel */}
          <div className="h-64 border-t border-white/5 flex flex-col bg-[#0b0b0c]">
            <div className="h-12 border-b border-white/5 flex items-center px-6 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-white/30" />
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Input Stream</span>
              </div>
            </div>
            <textarea
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="Inject custom stdin signal here..."
              className="flex-1 bg-transparent p-8 font-mono text-xs text-white/60 resize-none outline-none placeholder:text-white/10 leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
