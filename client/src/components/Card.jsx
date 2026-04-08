import React from 'react';
import classNames from 'classnames';

export function Card({ children, className, hover = true, ...props }) {
  return (
    <div 
      className={classNames(
        "glass-card p-6 overflow-hidden transition-all duration-300",
        hover && "hover:border-blue-500/50 hover:shadow-blue-500/10 hover:-translate-y-1",
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
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
