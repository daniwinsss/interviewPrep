import React from 'react';

export function AccentHeading({ text, className = "" }) {
  // Split text by spaces and make the last word blue
  const words = text.split(" ");
  const lastWord = words.pop();
  const rest = words.join(" ");

  return (
    <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-100 ${className}`}>
      {rest} <span className="text-blue-500">{lastWord}</span>
    </h2>
  );
}
