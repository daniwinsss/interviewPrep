import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import classNames from 'classnames';

export default function Select({ options, value, onChange, label, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={classNames("relative", className)} ref={containerRef}>
      {label && (
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1 block ml-1">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none"
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown className={classNames("w-4 h-4 text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 mt-2 p-2 bg-white border border-slate-200 rounded-2xl shadow-soft z-[100] backdrop-blur-2xl"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={classNames(
                    "w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-widest transition-all",
                    value === opt.value 
                      ? "bg-emerald-600 text-white shadow-[0_0_20px_rgba(15,157,88,0.25)]" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
