"use client";

import { useState } from "react";

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

export function CollapsibleSection({ title, subtitle, defaultOpen = true, children, badge }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="section-card">
      <button
        type="button"
        className="section-header w-full text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="section-title">{title}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {badge && <div className="ml-2">{badge}</div>}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-6 pb-6 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}
