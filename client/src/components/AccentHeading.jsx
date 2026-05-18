import React from 'react';

export function AccentHeading({ text, className = '' }) {
  const words = text.split(' ');
  const lastWord = words.pop();
  const rest = words.join(' ');

  return (
    <h2 className={`text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 ${className}`}>
      {rest} <span className="text-gradient">{lastWord}</span>
    </h2>
  );
}
