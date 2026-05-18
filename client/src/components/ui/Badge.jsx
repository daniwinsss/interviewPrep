import React from 'react';
import classNames from 'classnames';

const variants = {
  neutral: 'bg-white text-slate-500 border-slate-200',
  strong: 'bg-slate-900 text-white border-slate-900 shadow-lg',
  accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  outline: 'bg-transparent text-slate-500 border-slate-200 hover:text-slate-900 hover:border-slate-300',
};

export default function Badge({ children, className = '', variant = 'neutral', ...props }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.3em] border transition-all duration-300',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
