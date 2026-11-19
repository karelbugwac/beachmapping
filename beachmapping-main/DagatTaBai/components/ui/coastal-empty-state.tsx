import type { ReactNode } from 'react';

export type CoastalIllustrationVariant = 'empty' | 'not-found' | 'error';

export function CoastalIllustration({
  variant = 'empty',
  className = '',
}: {
  variant?: CoastalIllustrationVariant;
  className?: string;
}) {
  const label = {
    empty: 'A quiet shoreline with a seashell',
    'not-found': 'A coastal route ending at a missing location',
    error: 'A coastal route interrupted by an alert marker',
  }[variant];

  return (
    <svg
      viewBox="0 0 240 160"
      role="img"
      aria-label={label}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="185" cy="39" r="20" fill="var(--color-sun)" opacity=".9" />
      <path
        d="M8 105c28-19 48-19 76 0 27 19 47 19 75 0s47-19 73 0v42H8v-42Z"
        fill="var(--color-seafoam-100)"
      />
      <path
        d="M8 112c28-18 48-18 76 0 27 18 47 18 75 0s47-18 73 0"
        stroke="var(--color-brand-teal)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 130c27-14 48-14 76 0s49 14 76 0 47-14 72 0"
        stroke="var(--color-brand-teal)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".65"
      />
      <path
        d="M8 147c31-7 54-7 81 0 28 7 52 7 80 0 23-6 44-6 63 0"
        stroke="var(--color-sand-300)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m31 95 25-20 25 20M38 91v17h36V91M51 108v-12h11v12"
        stroke="var(--color-brand-navy)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M97 108c20-17 38-25 58-26"
        stroke="var(--color-brand-navy)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 6"
        opacity=".75"
      />
      {variant === 'empty' ? (
        <g stroke="var(--color-brand-teal)" strokeWidth="2" strokeLinecap="round">
          <path d="M158 77c-8 1-12 8-11 15 1 6 6 10 13 10s12-4 13-10c1-7-3-14-11-15" />
          <path d="M160 79v20M154 81l6 18M166 81l-6 18" />
        </g>
      ) : (
        <g>
          <circle
            cx="174"
            cy="82"
            r="16"
            fill={variant === 'error' ? 'var(--color-danger)' : 'var(--color-brand-navy)'}
          />
          <text
            x="174"
            y="88"
            textAnchor="middle"
            fill="var(--color-surface)"
            fontSize="18"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            {variant === 'error' ? '!' : '?'}
          </text>
        </g>
      )}
    </svg>
  );
}

export function CoastalEmptyState({
  title,
  description,
  variant = 'empty',
  action,
  className = '',
}: {
  title: string;
  description?: string;
  variant?: CoastalIllustrationVariant;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <CoastalIllustration variant={variant} className="h-32 w-48 max-w-full" />
      <div className="mt-3 max-w-md">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-neutral-400">
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
