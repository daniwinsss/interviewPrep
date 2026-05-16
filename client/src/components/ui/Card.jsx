import React from 'react';
import classNames from 'classnames';

export default function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={classNames(
        'surface p-8 rounded-[40px] border-white/[0.05] transition-all duration-500',
        hover && 'hover:border-accent/20 hover:shadow-[0_0_50px_rgba(124,140,255,0.05)] hover:bg-white/[0.01]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, eyebrow }) {
  return (
    <div className="flex items-start justify-between gap-8 mb-8">
      <div>
        {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-3">{eyebrow}</p>}
        <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-white/40 mt-3 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
