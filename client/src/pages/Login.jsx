import React, { useMemo, useState } from 'react';
import { ArrowLeft, Lock, Mail, User, Shield, Sparkles, Zap, Cpu, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { apiUrl } from '../lib/api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin ? { email, password } : { name, email, password };
      
      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user?.name || name || 'Candidate');
        navigate('/');
      } else {
        alert(data.error || 'Authentication sequence failed');
      }
    } catch (err) {
      console.error(err);
      alert('Unable to connect. Please check the server and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordScore = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'][passwordScore] || 'Weak';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold">PrepDost</p>
            <p className="text-xs text-white/70">AI Interview Prep Platform</p>
          </div>
        </div>

        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">
            {isLogin ? 'Welcome back to PrepDost' : 'Build your PrepDost profile'}
          </h1>
          <p className="text-white/80">
            Practice interviews, track progress, and stay placement ready with AI-backed insights.
          </p>
          <div className="grid gap-4">
            {[
              'AI-driven mock interviews and feedback',
              'Daily challenge and streak tracking',
              'Topic mastery and placement readiness'
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-white/70">
          Trusted by student communities and campus hiring teams.
        </div>
      </div>

      <div className="relative flex items-center justify-center p-8">
        <Link 
          to="/" 
          className="absolute top-8 left-8 text-slate-500 hover:text-slate-900 transition-all flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center group-hover:bg-slate-100 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold">Back to home</span>
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
          className="w-full max-w-[480px]"
        >
          <div className="surface-strong p-10 md:p-12 rounded-[36px] border-slate-200 shadow-soft bg-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">PrepDost Access</span>
                <span className="text-xs text-slate-500">Secure sign in</span>
              </div>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight mb-2">
              {isLogin ? 'Sign in to PrepDost' : 'Create your PrepDost account'}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">
              {isLogin
                ? 'Continue your placement prep with AI feedback and daily challenges.'
                : 'Start practicing with mock interviews, MCQs, and curated problem sets.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-semibold text-slate-600">Full name</label>
                    <div className="relative group">
                      <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-400 transition-all placeholder:text-slate-400"
                        placeholder="Your name"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Email address</label>
                <div className="relative group">
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-400 transition-all placeholder:text-slate-400"
                    placeholder="you@college.edu"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Password</label>
                <div className="relative group">
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-400 transition-all placeholder:text-slate-400"
                    placeholder="Create a strong password"
                  />
                </div>
                {!isLogin && (
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Password strength: {strengthLabel}</span>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3].map((idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 w-6 rounded-full ${passwordScore > idx ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 rounded-2xl"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Working...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {isLogin ? 'Sign in' : 'Create account'}
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button className="h-11 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                  Continue with Google
                </button>
                <button className="h-11 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                  Continue with GitHub
                </button>
              </div>
              <div className="pt-4 border-t border-slate-200 flex flex-col items-center gap-3">
                <p className="text-xs text-slate-500">
                  {isLogin ? "New to PrepDost?" : "Already have an account?"}
                </p>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-2"
                >
                  {isLogin ? <Sparkles className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                  {isLogin ? 'Create account' : 'Go to sign in'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
