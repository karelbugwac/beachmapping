'use client';

import React from 'react';

export function TideLineDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full overflow-hidden py-1 opacity-70 flex justify-center ${className}`} aria-hidden="true">
      <svg
        className="w-full max-w-4xl h-3 text-[var(--color-sand-300)]"
        viewBox="0 0 1200 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 6C150 11 300 1 450 6C600 11 750 1 900 6C1050 11 1125 3 1200 6"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeDasharray="4 6"
        />
      </svg>
    </div>
  );
}
