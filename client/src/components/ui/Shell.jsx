import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, LogOut, Search, User } from 'lucide-react';
import Button from './Button';
import { motion } from 'framer-motion';

export default function Shell({ children, title, subtitle, showTopBar = true }) {
  const isLogged = Boolean(localStorage.getItem('token'));
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Practice', path: '/problems' },
    { name: 'Mock Interview', path: '/interview' },
    { name: 'MCQ Bank', path: '/mcq' },
  ];

  return (
    <div className="app-shell relative min-h-screen">
      {showTopBar && (
        <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="glass border-slate-200/80 bg-white/70 backdrop-blur-2xl rounded-3xl h-16 px-6 flex items-center gap-8 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-700 p-[1px] transition-transform group-hover:scale-105 active:scale-95">
                  <div className="w-full h-full rounded-[15px] bg-white flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-emerald-700" />
                  </div>
                </div>
                <span className="text-slate-900 font-bold tracking-tight text-xl hidden sm:block">
                  PrepDost
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link 
                      key={item.name} 
                      to={item.path} 
                      className={`relative px-4 py-2 text-sm font-semibold transition-all rounded-xl ${
                        isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {item.name}
                      {isActive && (
                        <motion.div 
                          layoutId="nav-pill" 
                          className="absolute inset-0 bg-emerald-50 rounded-xl -z-10 border border-emerald-100"
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="ml-auto flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <Search className="w-5 h-5" />
                </button>
                <div className="h-6 w-px bg-slate-200 mx-1" />
                {isLogged ? (
                  <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all">
                      <User className="w-5 h-5" />
                    </button>
                    <Button variant="secondary" size="sm" onClick={handleLogout} className="h-10 px-4">
                      <LogOut className="w-4 h-4 mr-2" />
                      Exit
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-5">
                    <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                      Sign in
                    </Link>
                    <Link to="/login">
                      <Button className="h-10 px-6 text-sm">Get Started</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <main className={`max-w-7xl mx-auto px-6 ${showTopBar ? 'pt-32' : 'pt-10'} pb-24`}>
        {(title || subtitle) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            {title && (
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xl text-slate-600 max-w-3xl leading-relaxed font-medium">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}
        {children}
      </main>
    </div>
  );
}
