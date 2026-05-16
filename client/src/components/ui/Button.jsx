import React from 'react';
import classNames from 'classnames';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  outline: 'bg-transparent text-white border border-white/10 hover:border-accent/50 hover:text-accent hover:bg-accent/5',
};

const sizes = {
  sm: 'text-[10px] px-4 py-2 rounded-xl tracking-widest',
  md: 'text-xs px-6 py-3 rounded-2xl tracking-widest',
  lg: 'text-sm px-8 py-4 rounded-3xl tracking-[0.2em]',
};

export default function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  icon,
  ...props
}) {
  return (
    <button
      className={classNames(
        'inline-flex items-center justify-center gap-2 font-bold uppercase transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], 
        sizes[size], 
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
}
