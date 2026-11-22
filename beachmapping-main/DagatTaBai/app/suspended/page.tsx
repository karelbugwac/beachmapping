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
    .select('accountstatus, statusreason, statusreasontype, suspendeduntil')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (error) throw error;
  const account = data as { accountstatus: string; statusreason: string | null; statusreasontype: string | null; suspendeduntil: string | null } | null;
  if (!account || !isAccountStatus(account.accountstatus) || !isSuspensionActive(account.accountstatus, account.suspendeduntil)) redirect('/');

  const endDate = account.suspendeduntil
    ? `until ${new Date(account.suspendeduntil).toLocaleDateString()}`
    : 'until further notice';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-neutral-950">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold text-brand-navy-900 dark:text-white">Your account is suspended.</h1>
        {account.statusreasontype && <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-neutral-200">{account.statusreasontype}</p>}
        {account.statusreason && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-neutral-300">
            {account.statusreason}
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
