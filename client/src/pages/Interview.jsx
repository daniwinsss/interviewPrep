import React, { useEffect, useState } from 'react';
import { Bot, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000/api/ai/interview';
const TOPICS = ['DSA', 'Behavioral', 'System Design', 'Project Experience'];

export default function Interview() {
  const [topic, setTopic] = useState('DSA');
  const [interviewId, setInterviewId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStarting, setIsStarting] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function startInterview() {
      setIsStarting(true);
      setError('');
      setInput('');
      setIsComplete(false);

      try {
        const res = await fetch(`${API}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: localStorage.getItem('token') || 'anonymous',
            topic
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to start interview');
        if (ignore) return;

        setInterviewId(data._id);
        setMessages(data.messages || []);
        setIsComplete(Boolean(data.completed));
      } catch (err) {
        if (ignore) return;
        setInterviewId(null);
        setMessages([]);
        setIsComplete(false);
        setError(err.message || 'Failed to start interview');
      } finally {
        if (!ignore) setIsStarting(false);
      }
    }

    startInterview();
    return () => {
      ignore = true;
    };
  }, [topic]);

  async function handleSend() {
    const answer = input.trim();
    if (!answer || !interviewId || isTyping) return;

    const optimisticMessages = [...messages, { role: 'user', content: answer }];
    setMessages(optimisticMessages);
    setInput('');
    setError('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, answer })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to continue interview');

      setMessages(data.interview?.messages || optimisticMessages);
      setIsComplete(Boolean(data.interview?.completed));
    } catch (err) {
      setMessages(messages);
      setInput(answer);
      setError(err.message || 'Failed to continue interview');
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center px-6 gap-4 shrink-0">
        <Link to="/" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-100">AI Interviewer</h1>
            <p className="text-xs text-blue-400">Interactive mock interview</p>
          </div>
        </div>
        <div className="ml-auto">
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isStarting || isTyping}
            className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            {TOPICS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </header>

      {error && (
        <div className="px-6 pt-4">
          <div className="max-w-4xl mx-auto bg-red-900/30 border border-red-500/30 text-red-200 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        </div>
      )}

      {isComplete && (
        <div className="px-6 pt-4">
          <div className="max-w-4xl mx-auto bg-emerald-900/20 border border-emerald-500/30 text-emerald-200 text-sm px-4 py-3 rounded-xl">
            You have completed this interview set. Change topic to start a fresh session.
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
        {isStarting ? (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting your interview...
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user'
                  ? 'bg-blue-600/30 border border-blue-500/30 rounded-tr-sm text-blue-50'
                  : 'bg-slate-800 border border-slate-700 rounded-tl-sm text-slate-200'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {typeof msg.rating === 'number' && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Evaluation Score:</span>
                    <span className={`font-semibold ${msg.rating >= 7 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {msg.rating}/10
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              AI is evaluating your answer...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900/80 border-t border-slate-800 backdrop-blur-md shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none h-14"
            placeholder={
              isStarting
                ? 'Wait for the interview to start...'
                : isComplete
                  ? 'This interview set is complete. Change topic to continue.'
                  : 'Type your answer here...'
            }
            value={input}
            disabled={isStarting || isTyping || !interviewId || isComplete}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || isStarting || !interviewId || isComplete}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-3 px-6 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
