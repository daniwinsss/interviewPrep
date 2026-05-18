import React from 'react';
import classNames from 'classnames';

export function Card({ children, className, hover = true, ...props }) {
  return (
    <div
      className={classNames(
        'surface p-6 overflow-hidden transition-all duration-300',
        hover && 'hover:-translate-y-1 hover:border-emerald-200 hover:shadow-float',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-4 gap-4">
      <div>
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-600 mt-2">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
