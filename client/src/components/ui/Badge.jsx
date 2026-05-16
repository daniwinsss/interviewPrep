import React from 'react';
import classNames from 'classnames';

const variants = {
  neutral: 'bg-white/[0.03] text-white/40 border-white/[0.05]',
  strong: 'bg-white text-black border-white shadow-lg',
  accent: 'bg-accent/10 text-accent border-accent/20',
  outline: 'bg-transparent text-white/50 border-white/10 hover:text-white hover:border-white/20',
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
