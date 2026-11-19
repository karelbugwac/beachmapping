'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock3, FileText, Loader2, RotateCcw, XCircle } from 'lucide-react';

interface ApplicationStatus {
  id: string;
  applicant_full_name: string;
  business_name: string;
  beach_name: string;
  status: string;
  status_note: string | null;
  status_updated_at: string;
  rejection_reason: string | null;
  created_at: string;
}

interface StatusHistoryItem {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
}

const steps = [
  { status: 'in_progress', label: 'In progress' },
  { status: 'review', label: 'Review' },
  { status: 'approved', label: 'Approved' },
];

export default function ApplicationStatusPage() {
  const [application, setApplication] = useState<ApplicationStatus | null>(null);
  const [history, setHistory] = useState<StatusHistoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');

  const loadApplication = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/applications/status', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load your application status.');
      setApplication(data.application || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your application status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadApplication);
  }, [loadApplication]);

  const loadHistory = async () => {
    if (!application || history !== null) return;
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const response = await fetch(
        `/api/applications/status/history?applicationId=${encodeURIComponent(application.id)}`,
        { cache: 'no-store' }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load application history.');
      setHistory(Array.isArray(data.history) ? data.history : []);
    } catch (loadError) {
      setHistoryError(loadError instanceof Error ? loadError.message : 'Could not load application history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const currentStep = application?.status === 'approved'
    ? 2
    : application?.status === 'pending' || application?.status === 'under_review'
      ? 1
      : 0;
  const isRejected = application?.status === 'rejected';
  const isNeedsChanges = application?.status === 'needs_changes';
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 dark:bg-black dark:text-zinc-100">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal-100 text-brand-teal-700 dark:bg-brand-teal-700/30 dark:text-brand-teal-300">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-brand-navy-700 dark:text-white">My application</h1>
            <p className="text-sm text-slate-500 dark:text-neutral-400">Track your beach owner application.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-12 text-slate-500" role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Loading your application…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200" role="alert">
            <p>{error}</p>
            {error.includes('sign in') && (
              <Link href="/login" className="mt-3 inline-block font-bold underline">
                Sign in
              </Link>
            )}
            <button type="button" onClick={() => void loadApplication()} className="mt-3 font-bold underline">
              Try again
            </button>
          </div>
        ) : !application ? (
          <div className="rounded-2xl bg-slate-50 p-6 dark:bg-neutral-800/50">
            <h2 className="font-bold">No submitted application yet</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">
              Start your application to become a beach owner.
            </p>
            <Link href="/apply" className="mt-4 inline-flex rounded-full bg-brand-navy-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-navy-600 dark:bg-brand-teal-600 dark:hover:bg-brand-teal-500">
              Apply as Beach Owner
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 rounded-2xl bg-slate-50 p-4 dark:bg-neutral-800/50">
              <p className="font-bold">{application.beach_name || application.business_name}</p>
              <p className="text-sm text-slate-500 dark:text-neutral-400">{application.business_name}</p>
            </div>

            {isRejected ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30" role="status">
                <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200">
                  <XCircle className="h-5 w-5" aria-hidden="true" />
                  Application not approved
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-rose-900 dark:text-rose-100">
                  {application.rejection_reason || application.status_note || 'Your application was not approved.'}
                </p>
              </div>
            ) : (
              <>
                <ol aria-label="Application progress" className="grid grid-cols-3 gap-2">
                  {steps.map((step, index) => {
                    const complete = index <= currentStep;
                    const current = index === currentStep;
                    return (
                      <li key={step.status} className="flex flex-col items-center text-center">
                        <span className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${
                          complete
                            ? 'bg-brand-teal-600 text-white dark:bg-brand-teal-500'
                            : 'bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500'
                        }`} aria-current={current ? 'step' : undefined}>
                          {complete ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <Clock3 className="h-5 w-5" aria-hidden="true" />}
                        </span>
                        <span className={`text-xs font-bold sm:text-sm ${current ? 'text-brand-navy-700 dark:text-brand-teal-300' : 'text-slate-500 dark:text-neutral-400'}`}>
                          {step.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                {isNeedsChanges && (
                  <div className="mt-6 rounded-2xl border border-brand-sun-200 bg-brand-sun-50 p-5 text-sm text-brand-navy-700 dark:border-brand-sun-700/50 dark:bg-brand-sun-900/20 dark:text-brand-sun-100">
                    <p className="font-bold">Changes requested</p>
                    <p className="mt-1 whitespace-pre-wrap">{application.status_note}</p>
                    <Link
                      href={`/apply?applicationId=${encodeURIComponent(application.id)}`}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-navy-500 px-5 py-2.5 font-bold text-white hover:bg-brand-navy-600 dark:bg-brand-teal-600 dark:hover:bg-brand-teal-500"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Continue application
                    </Link>
                  </div>
                )}
                {!isNeedsChanges && application.status_note && (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-neutral-800/50">
                    <p className="font-bold">Message from the review team</p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-neutral-300">{application.status_note}</p>
                  </div>
                )}
              </>
            )}

            <div className="mt-8 border-t border-slate-100 pt-5 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  if (history === null) void loadHistory();
                  else setHistory(null);
                }}
                aria-expanded={history !== null || historyLoading}
                className="text-sm font-bold text-brand-navy-600 underline underline-offset-4 dark:text-brand-teal-300"
              >
                {history !== null || historyLoading ? 'Hide application history' : 'View application history'}
              </button>
              {(history !== null || historyLoading || historyError) && (
                <div className="mt-4 space-y-3">
                  {historyLoading && <p className="text-sm text-slate-500" role="status">Loading history…</p>}
                  {historyError && <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">{historyError}</p>}
                  {history?.map((item) => (
                    <div key={item.id} className="border-l-2 border-brand-teal-400 pl-4 text-sm">
                      <p className="font-semibold capitalize">{item.to_status.replaceAll('_', ' ')}</p>
                      {item.note && <p className="whitespace-pre-wrap text-slate-600 dark:text-neutral-300">{item.note}</p>}
                      <time className="text-xs text-slate-500 dark:text-neutral-400" dateTime={item.created_at}>
                        {new Date(item.created_at).toLocaleString()}
                      </time>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
