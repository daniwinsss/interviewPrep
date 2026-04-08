import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';

const mockQuestions = [
  {
    id: 1,
    question: "What is a deadlock in Operating Systems?",
    options: [
      "A situation where a process cannot be executed because it requires a resource held by another process.",
      "A section of code where a process modifies shared variables.",
      "A situation where two or more processes are waiting indefinitely for an event that can be caused by only one of the waiting processes.",
      "A condition where a process executes without encountering any blocking operations."
    ],
    correct: 2,
    explanation: "Deadlock is a specific state where a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process."
  },
  {
    id: 2,
    question: "Which of the following sorting algorithms has the best average-case time complexity?",
    options: ["Selection Sort", "Insertion Sort", "Merge Sort", "Bubble Sort"],
    correct: 2,
    explanation: "Merge Sort has an average-case time complexity of O(N log N), while the others are generally O(N^2)."
  }
];

export default function MCQ() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const question = mockQuestions[currentIdx];

  const handleSelect = (idx) => {
    if (isAnswered) return;
    setSelected(idx);
    setIsAnswered(true);
    if (idx === question.correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < mockQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
      setIsAnswered(false);
    } else {
      setIsDone(true);
    }
  };

  if (isDone) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
        <Card className="max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-2">Practice Complete</h2>
          <p className="text-slate-400 mb-6">You scored <span className="text-blue-500 font-bold">{score}</span> out of {mockQuestions.length}.</p>
          <Link to="/" className="inline-block bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 px-6 py-2 rounded-lg transition-colors">
            Return Home
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      <header className="h-16 border-b border-slate-800 flex items-center px-6 bg-slate-900/50">
        <Link to="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="ml-4 flex-1">
          <h1 className="font-semibold text-lg text-slate-100">Core Subjects Practice</h1>
        </div>
        <div className="text-sm font-medium text-slate-400">
          Question {currentIdx + 1} of {mockQuestions.length}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <Card className="bg-slate-900/80 p-8">
            <h2 className="text-xl font-medium mb-6 leading-relaxed text-slate-100">{question.question}</h2>
            
            <div className="flex flex-col gap-3">
              {question.options.map((opt, idx) => {
                let borderClass = 'border-slate-800 hover:border-slate-700 bg-slate-950';
                
                if (isAnswered) {
                  if (idx === question.correct) {
                    borderClass = 'border-green-500/50 bg-green-500/10 text-green-100';
                  } else if (idx === selected) {
                    borderClass = 'border-red-500/50 bg-red-500/10 text-red-100';
                  } else {
                    borderClass = 'border-slate-800 bg-slate-950 opacity-50';
                  }
                } else if (selected === idx) {
                   borderClass = 'border-blue-500/50 bg-blue-500/10 text-blue-100';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={isAnswered}
                    className={`text-left p-4 rounded-xl border flex items-center gap-3 transition-all ${borderClass}`}
                  >
                    {isAnswered && idx === question.correct ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <Circle className={`w-5 h-5 shrink-0 ${selected === idx ? 'text-blue-500 fill-blue-500/20' : 'text-slate-700'}`} />
                    )}
                    <span className="leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="mt-8 pt-6 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-slate-300 text-sm mb-4 leading-relaxed"><strong className="text-slate-100 font-medium">Explanation:</strong> {question.explanation}</p>
                <div className="flex justify-end">
                  <button 
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
                  >
                    {currentIdx < mockQuestions.length - 1 ? 'Next Question' : 'Finish Practice'}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
