import React from 'react';
import classNames from 'classnames';

export default function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={classNames(
        'surface p-8 rounded-[40px] border-slate-200 transition-all duration-500',
        hover && 'hover:border-emerald-200 hover:shadow-soft hover:bg-emerald-50/30',
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
        {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">{eyebrow}</p>}
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-slate-600 mt-3 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
