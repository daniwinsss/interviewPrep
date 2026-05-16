import React from 'react';
import classNames from 'classnames';

export default function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={classNames(
        'surface p-6 transition-all',
        hover && 'hover:-translate-y-1 hover:border-white/25 hover:shadow-float',
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
    <div className="flex items-start justify-between gap-6">
      <div>
        {eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-2">{eyebrow}</p>}
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-white/60 mt-2">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
