import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader } from '../components/Card';
import { AccentHeading } from '../components/AccentHeading';
import { HeroVisual } from '../components/HeroVisual';
import { Terminal, Bot, Database, Code2, ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 h-16 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md z-50 flex items-center px-6">
        <div className="flex items-center gap-2 text-xl font-bold text-slate-100">
          <Code2 className="text-blue-500" />
          interviewPrep
        </div>
        <div className="flex items-center gap-4 ml-auto">
           <Link to="/login" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Log in</Link>
           <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
             Get Started
           </Link>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto flex flex-col gap-24">
        
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-12 pt-12">
          <div className="flex-1 flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium">
               <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
               V1.0 is now live
            </div>
            
            <AccentHeading text="Master your interviews" />
            
            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              The ultimate AI-powered preparation platform. Solve real-world coding challenges, practice mock interviews, and analyze your projects with state-of-the-art LLMs.
            </p>
            
            <div className="flex gap-4 mt-4">
               <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20">
                 Start practicing
                 <ArrowRight className="w-4 h-4" />
               </button>
               <Link to="/problems/1" className="px-6 py-3 rounded-lg flex items-center justify-center font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                 View problems
               </Link>
            </div>
          </div>
          
          <div className="flex-1 w-full flex justify-end">
             <HeroVisual />
          </div>
        </section>

        {/* Features / Modules Section */}
        <section className="flex flex-col gap-12">
           <div className="text-center flex flex-col items-center">
             <AccentHeading text="Everything you need to succeed" className="text-3xl lg:text-4xl" />
             <p className="text-slate-400 mt-4 max-w-2xl">Four purpose-built modules designed to simulate real-world interviews and track your progress.</p>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link to="/problems/1" className="block focus:outline-none">
                <Card>
                   <CardHeader 
                     title="Online Judge" 
                     subtitle="Docker-isolated code execution"
                     action={<Terminal className="text-blue-500" />}
                   />
                   <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      Solve actual company questions in Python and JS. Get real-time execution results with strict security limits.
                   </p>
                   <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-1/3 rounded-full" />
                   </div>
                </Card>
              </Link>

              <Link to="/interview" className="block focus:outline-none">
                <Card>
                   <CardHeader 
                     title="AI Mock Interviews" 
                     subtitle="LLM-based evaluations"
                     action={<Bot className="text-blue-500" />}
                   />
                   <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      Practice DSA and behavioral questions with an AI interviewer. Receive immediate rating and constructive feedback.
                   </p>
                   <div className="mt-auto flex gap-2">
                      <span className="text-xs font-medium px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300">DSA</span>
                      <span className="text-xs font-medium px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300">System Design</span>
                   </div>
                </Card>
              </Link>

              <Link to="/mcq" className="block focus:outline-none">
                <Card>
                   <CardHeader 
                     title="Core Subjects" 
                     subtitle="MCQ Practice mode"
                     action={<Database className="text-blue-500" />}
                   />
                   <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      Test your knowledge on OS, DBMS, Computer Networks, and OOPS with timed constraints.
                   </p>
                    <div className="mt-auto flex gap-2">
                      <span className="text-xs font-medium px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400">DBMS</span>
                      <span className="text-xs font-medium px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300">OS</span>
                   </div>
                </Card>
              </Link>
           </div>
        </section>

      </main>
    </div>
  );
}
