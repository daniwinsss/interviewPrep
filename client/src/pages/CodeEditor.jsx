import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, Code2, ArrowLeft, Clock, MemoryStick, CheckCircle, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
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
  accepted:    <CheckCircle className="w-5 h-5 text-green-400" />,
  wrong_answer:<XCircle className="w-5 h-5 text-red-400" />,
  error:       <AlertTriangle className="w-5 h-5 text-orange-400" />,
  tle:         <AlertTriangle className="w-5 h-5 text-yellow-400" />,
};

const statusLabel = {
  accepted:     'Accepted',
  wrong_answer: 'Wrong Answer',
  error:        'Runtime / Compile Error',
  tle:          'Time Limit Exceeded',
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
      className="prose prose-invert prose-slate max-w-none text-slate-300 leading-relaxed"
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
  const [activeTab, setActiveTab] = useState('description'); // description | results
  const descriptionRef = useRef(null);
  const formattedDescription = useMemo(
    () => formatPlainTextDescription(problem?.description || ''),
    [problem?.description]
  );

  // Auto-render math when problem content or tab changes
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

  // Load problem from API
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/problems/${id}`);
        if (!res.ok) throw new Error('Problem not found');
        const data = await res.json();
        setProblem(data);
        // Set starter code for the default language
        setCode(data.starterCode?.[language] || '// Write your solution here\n');
        if (data.testCases?.[0]) setCustomInput(data.testCases[0].input);
      } catch (err) {
        setProblem(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Update starter code when language changes
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(problem?.starterCode?.[lang] || '// Write your solution here\n');
  };

  // Run against custom input
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

  // Submit against all test cases
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
    <div className="h-screen page flex flex-col text-white overflow-hidden">

      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center px-4 justify-between bg-[#0f0f10]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/problems" className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <Code2 className="w-4 h-4" />
            <span className="text-white text-sm">{loading ? 'Loading...' : (problem?.title || 'Problem Not Found')}</span>
          </div>
          {problem && (
            <>
              <Badge variant="outline">{problem.difficulty}</Badge>
              {problem.division && (
                <Badge variant="outline">{problem.division}</Badge>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={e => handleLanguageChange(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 text-white text-sm px-3 py-1.5 pr-8 rounded-xl focus:outline-none focus:border-white/30 cursor-pointer"
            >
              {(problem?.languages || ['cpp', 'java', 'python']).map(lang => (
                <option key={lang} value={lang}>{LANG_MAP[lang]?.label || lang}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
          </div>

          <Button size="sm" variant="secondary" onClick={handleRun} disabled={isRunning || isSubmitting} icon={<Play className="w-3.5 h-3.5 fill-current" />}>
            {isRunning ? 'Running...' : 'Run'}
          </Button>

          <Button size="sm" onClick={handleSubmit} disabled={isRunning || isSubmitting} icon={<Send className="w-3.5 h-3.5" />}>
            {isSubmitting ? 'Judging...' : 'Submit'}
          </Button>
        </div>
      </header>

      {/* Main Split */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Problem Description */}
        <div className="w-2/5 border-r border-white/10 flex flex-col overflow-hidden bg-[#0f0f10]/40">
          {/* Tabs */}
          <div className="flex border-b border-white/10 shrink-0">
            {['description', 'results'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'description' ? (
              <div className="flex flex-col gap-6">
                {loading ? (
                  <div className="flex flex-col gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-4 bg-white/10 rounded animate-pulse" style={{ width: `${60 + i * 7}%` }} />
                    ))}
                  </div>
                ) : !problem ? (
                  <p className="text-white/70">Problem not found. Check ID or if backend is running.</p>
                ) : (
                  <>
                    <h1 className="text-2xl font-semibold">{problem.title}</h1>
                    {problem.contest && (
                      <p className="text-sm text-white/50">{problem.contest}</p>
                    )}
                    <div className="flex gap-3 text-sm text-white/60 flex-wrap">
                      {problem.timeLimit && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> {problem.timeLimit / 1000}s
                        </span>
                      )}
                      {problem.memoryLimit && (
                        <span className="flex items-center gap-1.5">
                          <MemoryStick className="w-4 h-4" /> {problem.memoryLimit}MB
                        </span>
                      )}
                      {typeof problem.sampleTestCaseCount === 'number' && (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> {problem.sampleTestCaseCount} sample{problem.sampleTestCaseCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {typeof problem.hiddenTestCaseCount === 'number' && problem.hiddenTestCaseCount > 0 && (
                        <span className="text-white/50">
                          + {problem.hiddenTestCaseCount} hidden test{problem.hiddenTestCaseCount !== 1 ? 's' : ''} used on submit
                        </span>
                      )}
                    </div>

                    <ProblemDescriptionHtml html={formattedDescription} descriptionRef={descriptionRef} />

                    {/* Sample Test Cases */}
                    {problem.testCases?.length > 0 && (
                      <div className="flex flex-col gap-4 mt-8">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Sample Test Cases
                        </h3>
                        {typeof problem.hiddenTestCaseCount === 'number' && (
                          <p className="text-sm text-white/50">
                            Showing {problem.sampleTestCaseCount || problem.testCases.length} sample test case{(problem.sampleTestCaseCount || problem.testCases.length) !== 1 ? 's' : ''}.
                            {problem.hiddenTestCaseCount > 0 ? ` Submit also runs ${problem.hiddenTestCaseCount} hidden test case${problem.hiddenTestCaseCount !== 1 ? 's' : ''}.` : ''}
                          </p>
                        )}
                        <div className="grid grid-cols-1 gap-4">
                          {problem.testCases.map((tc, i) => (
                            <div key={i} className="group flex flex-col gap-0 border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                              <div className="flex divide-x divide-white/10 border-b border-white/10 bg-white/5">
                                <div className="flex-1 p-3">
                                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] pl-1">Input</span>
                                </div>
                                <div className="flex-1 p-3">
                                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] pl-1">Output</span>
                                </div>
                              </div>
                              <div className="flex divide-x divide-white/10 h-full min-h-[80px]">
                                <div className="flex-1 p-4 font-mono text-sm text-white/80 bg-black/30">
                                  <pre className="whitespace-pre-wrap break-all">{tc.input}</pre>
                                </div>
                                <div className="flex-1 p-4 font-mono text-sm text-white bg-black/30">
                                  <pre className="whitespace-pre-wrap break-all">{tc.output}</pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* USACO Link */}
                    {problem.usacoCpid && (
                      <a
                        href={`https://usaco.org/index.php?page=viewproblem2&cpid=${problem.usacoCpid}`}
                        target="_blank" rel="noreferrer"
                        className="text-white/70 hover:text-white text-sm flex items-center gap-1 transition-colors w-fit"
                      >
                        View on USACO ↗
                      </a>
                    )}
                  </>
                )}
              </div>
            ) : (
              // Results Tab
              <div className="flex flex-col gap-4">
                {!output ? (
                  <p className="text-white/60 text-sm">Run or submit your code to see results here.</p>
                ) : output.type === 'run' ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      {output.status === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      {output.status === 'success' ? `Ran in ${output.time}ms` : 'Runtime Error'}
                    </div>
                    {output.stdout && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 font-mono text-sm text-white/80">
                        <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-2">Output</p>
                        <pre className="whitespace-pre-wrap">{output.stdout}</pre>
                      </div>
                    )}
                    {output.stderr && (
                      <div className="bg-white/5 border border-white/20 rounded-2xl p-4 font-mono text-sm text-white/80">
                        <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-2">Error</p>
                        <pre className="whitespace-pre-wrap">{output.stderr}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  // Submit results
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 font-semibold text-lg text-white">
                      {statusIcon[output.status] || <AlertTriangle className="w-5 h-5 text-orange-400" />}
                      {statusLabel[output.status] || output.status}
                    </div>
                    <p className="text-white/60 text-sm">
                      Passed {output.passed} / {output.total} test cases &nbsp;·&nbsp; Total time: {output.time}ms
                    </p>
                    {output.results?.map((r, i) => (
                      <div key={i} className="border border-white/10 rounded-2xl p-4 text-sm font-mono bg-white/5">
                        <div className="flex items-center gap-2 font-semibold mb-3 text-white">
                          {r.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          Test Case {r.testCase} — {r.passed ? 'Passed' : statusLabel[r.status] || r.status} ({r.time}ms)
                        </div>
                        {!r.passed && r.input !== undefined && (
                          <div className="flex flex-col gap-2 text-white/60 text-xs">
                            {r.input && <div><span className="text-white/40">Input:</span><pre className="mt-0.5 text-white/80">{r.input}</pre></div>}
                            {r.expected && <div><span className="text-white/40">Expected:</span><pre className="mt-0.5 text-white/80">{r.expected}</pre></div>}
                            {r.actual && <div><span className="text-white/40">Your output:</span><pre className="mt-0.5 text-white">{r.actual}</pre></div>}
                            {r.stderr && <div><span className="text-white/40">Error:</span><pre className="mt-0.5 text-white">{r.stderr}</pre></div>}
                          </div>
                        )}
                        {!r.passed && r.input === undefined && (
                          <p className="text-white/40 text-xs">Hidden test case</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Editor + Custom Input */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Monaco Editor */}
          <div className="flex-1 bg-[#0f0f10] overflow-hidden">
            <Editor
              height="100%"
              language={LANG_MAP[language]?.monacoLang || 'cpp'}
              theme="vs-dark"
              value={code}
              onChange={val => setCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
              }}
            />
          </div>

          {/* Custom Input / Stdin */}
          <div className="h-40 border-t border-white/10 flex flex-col shrink-0">
            <div className="h-10 border-b border-white/10 flex items-center px-4 bg-white/5 shrink-0">
              <span className="text-sm font-medium text-white/60">Custom Input</span>
            </div>
            <textarea
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="Enter stdin for Run..."
              className="flex-1 bg-[#0f0f10] p-4 font-mono text-sm text-white/80 resize-none outline-none placeholder:text-white/40"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
