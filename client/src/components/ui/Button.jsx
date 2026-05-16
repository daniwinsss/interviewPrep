import React from 'react';
import classNames from 'classnames';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  outline: 'bg-white/5 text-white border border-white/15 hover:border-white/40 rounded-2xl px-5 py-2.5 font-semibold transition-all',
};

const sizes = {
  sm: 'text-xs px-3 py-2 rounded-xl',
  md: 'text-sm px-5 py-2.5 rounded-2xl',
  lg: 'text-base px-6 py-3 rounded-2xl',
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
      className={classNames(variants[variant], sizes[size], 'inline-flex items-center justify-center gap-2 transition-all', className)}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
