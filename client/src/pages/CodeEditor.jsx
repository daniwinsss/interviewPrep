import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, Code2, ArrowLeft, Clock, MemoryStick, CheckCircle, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import { apiUrl } from '../lib/api';

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

  const diffColor = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' };
  const divColor = { Bronze: 'text-amber-400', Silver: 'text-slate-300', Gold: 'text-yellow-300' };

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans text-slate-100 overflow-hidden">

      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/problems" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <Code2 className="w-4 h-4 text-blue-500" />
            <span className="text-slate-200 text-sm">{loading ? 'Loading...' : (problem?.title || 'Problem Not Found')}</span>
          </div>
          {problem && (
            <>
              <span className={`text-xs font-medium px-2 py-0.5 rounded border border-current/20 bg-current/10 ${diffColor[problem.difficulty]}`}>
                {problem.difficulty}
              </span>
              {problem.division && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded border border-current/20 bg-current/10 ${divColor[problem.division]}`}>
                  {problem.division}
                </span>
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
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-1.5 pr-8 rounded-lg focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              {(problem?.languages || ['cpp', 'java', 'python']).map(lang => (
                <option key={lang} value={lang}>{LANG_MAP[lang]?.label || lang}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all border border-slate-700"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunning ? 'Running...' : 'Run'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Judging...' : 'Submit'}
          </button>
        </div>
      </header>

      {/* Main Split */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Problem Description */}
        <div className="w-2/5 border-r border-slate-800 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 shrink-0">
            {['description', 'results'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-slate-500 hover:text-slate-300'
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
                      <div key={i} className="h-4 bg-slate-800 rounded animate-pulse" style={{ width: `${60 + i * 7}%` }} />
                    ))}
                  </div>
                ) : !problem ? (
                  <p className="text-red-400">Problem not found. Check ID or if backend is running.</p>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold">{problem.title}</h1>
                    {problem.contest && (
                      <p className="text-sm text-slate-500">{problem.contest}</p>
                    )}
                    <div className="flex gap-3 text-sm text-slate-400 flex-wrap">
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
                        <span className="text-slate-500">
                          + {problem.hiddenTestCaseCount} hidden test{problem.hiddenTestCaseCount !== 1 ? 's' : ''} used on submit
                        </span>
                      )}
                    </div>

                    <ProblemDescriptionHtml html={formattedDescription} descriptionRef={descriptionRef} />

                    {/* Sample Test Cases */}
                    {problem.testCases?.length > 0 && (
                      <div className="flex flex-col gap-4 mt-8">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                          Sample Test Cases
                        </h3>
                        {typeof problem.hiddenTestCaseCount === 'number' && (
                          <p className="text-sm text-slate-500">
                            Showing {problem.sampleTestCaseCount || problem.testCases.length} sample test case{(problem.sampleTestCaseCount || problem.testCases.length) !== 1 ? 's' : ''}.
                            {problem.hiddenTestCaseCount > 0 ? ` Submit also runs ${problem.hiddenTestCaseCount} hidden test case${problem.hiddenTestCaseCount !== 1 ? 's' : ''}.` : ''}
                          </p>
                        )}
                        <div className="grid grid-cols-1 gap-4">
                          {problem.testCases.map((tc, i) => (
                            <div key={i} className="group flex flex-col gap-0 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                              <div className="flex divide-x divide-slate-800 border-b border-slate-800 bg-slate-900/80">
                                <div className="flex-1 p-3">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Input</span>
                                </div>
                                <div className="flex-1 p-3">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Output</span>
                                </div>
                              </div>
                              <div className="flex divide-x divide-slate-800 h-full min-h-[80px]">
                                <div className="flex-1 p-4 font-mono text-sm text-slate-300 bg-slate-950/30">
                                  <pre className="whitespace-pre-wrap break-all">{tc.input}</pre>
                                </div>
                                <div className="flex-1 p-4 font-mono text-sm text-green-400 bg-slate-950/30">
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
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors w-fit"
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
                  <p className="text-slate-500 text-sm">Run or submit your code to see results here.</p>
                ) : output.type === 'run' ? (
                  <div className="flex flex-col gap-4">
                    <div className={`flex items-center gap-2 font-semibold ${output.status === 'success' ? 'text-green-400' : 'text-orange-400'}`}>
                      {output.status === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      {output.status === 'success' ? `Ran in ${output.time}ms` : 'Runtime Error'}
                    </div>
                    {output.stdout && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-sm text-slate-300">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Output</p>
                        <pre className="whitespace-pre-wrap">{output.stdout}</pre>
                      </div>
                    )}
                    {output.stderr && (
                      <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4 font-mono text-sm text-red-300">
                        <p className="text-red-500 text-xs uppercase tracking-wide mb-2">Error</p>
                        <pre className="whitespace-pre-wrap">{output.stderr}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  // Submit results
                  <div className="flex flex-col gap-4">
                    <div className={`flex items-center gap-2 font-semibold text-lg ${output.status === 'accepted' ? 'text-green-400' : 'text-red-400'}`}>
                      {statusIcon[output.status] || <AlertTriangle className="w-5 h-5 text-orange-400" />}
                      {statusLabel[output.status] || output.status}
                    </div>
                    <p className="text-slate-400 text-sm">
                      Passed {output.passed} / {output.total} test cases &nbsp;·&nbsp; Total time: {output.time}ms
                    </p>
                    {output.results?.map((r, i) => (
                      <div key={i} className={`border rounded-xl p-4 text-sm font-mono ${r.passed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                        <div className={`flex items-center gap-2 font-semibold mb-3 ${r.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {r.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          Test Case {r.testCase} — {r.passed ? 'Passed' : statusLabel[r.status] || r.status} ({r.time}ms)
                        </div>
                        {!r.passed && r.input !== undefined && (
                          <div className="flex flex-col gap-2 text-slate-400 text-xs">
                            {r.input && <div><span className="text-slate-500">Input:</span><pre className="mt-0.5 text-slate-300">{r.input}</pre></div>}
                            {r.expected && <div><span className="text-slate-500">Expected:</span><pre className="mt-0.5 text-slate-300">{r.expected}</pre></div>}
                            {r.actual && <div><span className="text-slate-500">Your output:</span><pre className="mt-0.5 text-red-300">{r.actual}</pre></div>}
                            {r.stderr && <div><span className="text-slate-500">Error:</span><pre className="mt-0.5 text-orange-300">{r.stderr}</pre></div>}
                          </div>
                        )}
                        {!r.passed && r.input === undefined && (
                          <p className="text-slate-500 text-xs">Hidden test case</p>
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
          <div className="flex-1 bg-[#020617] overflow-hidden">
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
          <div className="h-40 border-t border-slate-800 flex flex-col shrink-0">
            <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-slate-900/50 shrink-0">
              <span className="text-sm font-medium text-slate-400">Custom Input</span>
            </div>
            <textarea
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="Enter stdin for Run..."
              className="flex-1 bg-slate-950 p-4 font-mono text-sm text-slate-300 resize-none outline-none placeholder:text-slate-700"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
