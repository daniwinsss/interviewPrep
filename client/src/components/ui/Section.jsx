import React from 'react';
import classNames from 'classnames';

export default function Section({ title, subtitle, action, className = '', children }) {
  return (
    <section className={classNames('flex flex-col gap-6', className)}>
      {(title || subtitle || action) && (
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="max-w-2xl">
            {title && <h2 className="section-title">{title}</h2>}
            {subtitle && <p className="section-subtitle mt-3">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
