import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Code2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CodeEditor() {
  const [code, setCode] = useState('function solution(input) {\n  // Write your code here\n  return input;\n}');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running execution process...');
    // Real API integration would go here
    setTimeout(() => {
      setOutput('Execution completed in 45ms.\n\nOutput:\nHello World');
      setIsRunning(false);
    }, 1500);
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900/50">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <Code2 className="w-5 h-5 text-blue-500" />
            <span className="text-slate-300">Two Sum</span>
            <span className="ml-2 px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 border border-slate-700">Easy</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
          <button className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-700">
            Submit
          </button>
        </div>
      </header>

      {/* Main Content Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem Description */}
        <div className="w-1/3 border-r border-slate-800 bg-slate-900/30 overflow-y-auto p-6 scrollbar-hide flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold mb-4">1. Two Sum</h1>
            <div className="prose prose-invert prose-slate max-w-none">
              <p className="text-slate-300">Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
              <p className="text-slate-300 mt-2">You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
              
              <div className="mt-6 bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-sm">
                <span className="text-slate-400">Input:</span> nums = [2,7,11,15], target = 9<br/>
                <span className="text-slate-400">Output:</span> [0,1]<br/>
                <span className="text-slate-400">Explanation:</span> Because nums[0] + nums[1] == 9, we return [0, 1].
              </div>
            </div>
          </div>
        </div>

        {/* Editor & Terminal */}
        <div className="w-2/3 flex flex-col">
          {/* Editor */}
          <div className="flex-1 relative pt-2 bg-[#020617]"> {/* Custom dark slate matches Monaco's theme */}
             <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={setCode}
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  padding: { top: 16 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  scrollBeyondLastLine: false,
                }}
              />
          </div>

          {/* Test Results / Terminal */}
          <div className="h-64 border-t border-slate-800 bg-slate-950 flex flex-col">
             <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-slate-900/50">
                <span className="text-sm font-medium text-slate-300">Test Output</span>
             </div>
             <div className="flex-1 p-4 overflow-auto font-mono text-sm text-slate-400 whitespace-pre-wrap">
                {output || "Run your code to see output here."}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
