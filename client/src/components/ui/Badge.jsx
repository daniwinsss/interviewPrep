import React from 'react';
import classNames from 'classnames';

const variants = {
  neutral: 'bg-white/8 text-white/70 border-white/10',
  strong: 'bg-white text-black border-white',
  accent: 'bg-[#7c8cff]/20 text-[#cbd5ff] border-[#7c8cff]/40',
  outline: 'bg-white/5 text-white border-white/20',
};

export default function Badge({ children, className = '', variant = 'neutral', ...props }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em] border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
