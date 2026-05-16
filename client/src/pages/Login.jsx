import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, User, Shield, Sparkles, Zap, Cpu } from 'lucide-react';
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
      alert('Neural link disrupted - Check backend connection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
      </div>

      <Link 
        to="/" 
        className="absolute top-8 left-8 text-white/30 hover:text-white transition-all flex items-center gap-2 group z-20"
      >
        <div className="w-8 h-8 rounded-lg border border-white/5 flex items-center justify-center group-hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">Abort Sequence</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
        className="w-full max-w-[440px] z-10"
      >
        <div className="surface-strong p-10 md:p-12 rounded-[48px] border-white/5 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <Shield className="w-48 h-48" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">Security Protocol</span>
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">v4.0.2 Stable</span>
              </div>
            </div>

            <h1 className="text-3xl font-black tracking-tighter mb-3">
              {isLogin ? 'INITIALIZE LINK' : 'PROVISION ACCOUNT'}
            </h1>
            <p className="text-sm text-white/40 leading-relaxed mb-10">
              {isLogin
                ? 'Re-establish neural connection to resume your high-fidelity interview training.'
                : 'Configure your candidate profile and deploy your personalized AI interview ecosystem.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Identity Tag</label>
                    <div className="relative group">
                      <User className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-medium text-white focus:outline-none focus:border-white/20 focus:bg-black/60 transition-all placeholder:text-white/10"
                        placeholder="CANDIDATE NAME"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Communication Vector</label>
                <div className="relative group">
                  <Mail className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-medium text-white focus:outline-none focus:border-white/20 focus:bg-black/60 transition-all placeholder:text-white/10"
                    placeholder="EMAIL@PROTO.COL"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Access Cipher</label>
                <div className="relative group">
                  <Lock className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-medium text-white focus:outline-none focus:border-white/20 focus:bg-black/60 transition-all placeholder:text-white/10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-14 rounded-2xl shadow-[0_0_20px_rgba(124,140,255,0.2)]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    AUTHENTICATING...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {isLogin ? 'ESTABLISH LINK' : 'PROVISION SYSTEM'}
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                {isLogin ? "NEW OPERATIVE DETECTED?" : "RECOGNIZED CLEARANCE?"}
              </p>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-black text-white hover:text-accent uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                {isLogin ? <Sparkles className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                {isLogin ? 'CREATE NEW IDENTITY' : 'RESTORE ACCESS'}
              </button>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[9px] font-bold text-white/10 uppercase tracking-[0.5em] animate-pulse">
          Encrypted Neural Bridge Active
        </p>
      </motion.div>
    </div>
  );
}
