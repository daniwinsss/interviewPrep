import React, { useState } from 'react';
import { Bot, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Interview() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Welcome to your DSA mock interview! To begin, please introduce yourself and tell me about a challenging algorithm you recently implemented.', rating: null }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    // Mock API call to Gemini
    setTimeout(() => {
      setMessages([...newMessages, { 
        role: 'ai', 
        content: `That sounds like a great experience. You communicated the trade-offs well.\n\nNext question: Can you explain the difference between Breadth-First Search (BFS) and Depth-First Search (DFS), and when you would choose one over the other?`,
        rating: 8
      }]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      {/* Header */}
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
            <p className="text-xs text-blue-400">Topic: Data Structures & Algorithms</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-blue-600/30 border border-blue-500/30 rounded-tr-sm text-blue-50' 
                : 'bg-slate-800 border border-slate-700 rounded-tl-sm text-slate-200'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              
              {msg.rating && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Evaluation Score:</span>
                  <span className={`font-semibold ${msg.rating >= 7 ? 'text-green-400' : 'text-yellow-400'}`}>{msg.rating}/10</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-slate-400">
               <Loader2 className="w-4 h-4 animate-spin" />
               AI is evaluating your answer...
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-800 backdrop-blur-md shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none h-14"
            placeholder="Type your answer here..."
            value={input}
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
            disabled={!input.trim() || isTyping}
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
