import React from 'react';
import { Link } from 'react-router-dom';
import { Command, LogOut } from 'lucide-react';
import Button from './Button';

export default function Shell({ children, title, subtitle, showTopBar = true }) {
  const isLogged = Boolean(localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="app-shell">
      {showTopBar && (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 text-white font-semibold tracking-tight">
              <span className="w-9 h-9 rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center">
                <Command className="w-4 h-4" />
              </span>
              interviewPrep
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/problems" className="nav-link">Problems</Link>
              <Link to="/interview" className="nav-link">AI Interview</Link>
              <Link to="/mcq" className="nav-link">Core Subjects</Link>
            </nav>
            <div className="ml-auto flex items-center gap-3">
              {isLogged ? (
                <Button variant="secondary" size="sm" onClick={handleLogout} icon={<LogOut className="w-4 h-4" />}>
                  Log out
                </Button>
              ) : (
                <>
                  <Link to="/login" className="nav-link">Log in</Link>
                  <Link to="/login" className="btn-primary text-sm">Get started</Link>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10">
        {(title || subtitle) && (
          <div className="mb-10">
            {title && <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">{title}</h1>}
            {subtitle && <p className="text-white/60 mt-4 max-w-2xl">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
