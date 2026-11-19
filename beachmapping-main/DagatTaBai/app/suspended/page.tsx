import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isAccountStatus, isSuspensionActive } from '@/lib/utils/account-status';

export const dynamic = 'force-dynamic';

export default async function SuspendedPage() {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect('/login');

  const { data, error } = await supabase.from('profiles')
    .select('account_status, status_reason, status_reason_type, suspended_until')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (error) throw error;
  const account = data as { account_status: string; status_reason: string | null; status_reason_type: string | null; suspended_until: string | null } | null;
  if (!account || !isAccountStatus(account.account_status) || !isSuspensionActive(account.account_status, account.suspended_until)) redirect('/');

  const endDate = account.suspended_until
    ? `until ${new Date(account.suspended_until).toLocaleDateString()}`
    : 'until further notice';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-neutral-950">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold text-brand-navy-900 dark:text-white">Your account is suspended.</h1>
        {account.status_reason_type && <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-neutral-200">{account.status_reason_type}</p>}
        {account.status_reason && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-neutral-300">
            {account.status_reason}
          </p>
        )}
        <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">
          This suspension is in effect {endDate}.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex rounded-full bg-brand-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-teal-700"
        >
          Contact us
        </Link>
      </section>
    </main>
  );
}
