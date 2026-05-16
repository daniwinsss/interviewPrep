import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { apiUrl } from '../lib/api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simulating API call to /api/auth
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
        // Save token to localStorage (or context in a real app)
        localStorage.setItem('token', data.token);
        navigate('/'); // Redirect to home
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error - Is the backend running?');
    }
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center px-6 py-16 relative page">
      <div className="absolute inset-0 bg-grid opacity-25" />
      <div className="absolute top-0 left-0 right-0 h-48 bg-radial" />

      <Link to="/" className="absolute top-6 left-6 text-white/60 hover:text-white transition-colors flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <Card className="surface-strong p-8 md:p-10">
          <Badge variant="outline" className="mb-6">Secure access</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-white/60 mt-3">
            {isLogin
              ? 'Resume your interview prep with a single sign-in.'
              : 'Start tracking interviews, quizzes, and AI feedback.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {!isLogin && (
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">Full Name</label>
                <div className="relative mt-2">
                  <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input pl-11"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-white/50">Email Address</label>
              <div className="relative mt-2">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-11"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-white/50">Password</label>
              <div className="relative mt-2">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" className="w-full justify-center" size="lg">
              {isLogin ? 'Log in' : 'Create account'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-white/60">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-white font-semibold"
            >
              {isLogin ? 'Create one' : 'Log in'}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
