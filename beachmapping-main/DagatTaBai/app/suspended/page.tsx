import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveEffectiveAccountStatus } from '@/lib/utils/account-status';

export const dynamic = 'force-dynamic';

export default async function SuspendedPage() {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect('/login');

  const adminSupabase = createAdminClient();
  const [{ data }, { data: freshAuthData }] = await Promise.all([
    (adminSupabase.from('profiles') as any)
      .select('accountstatus, status, statusreason, suspensionreason, statusreasontype, suspendeduntil, suspensionendsat, statuschangedat, suspendedat')
      .eq('id', authData.user.id)
      .maybeSingle(),
    adminSupabase.auth.admin.getUserById(authData.user.id),
  ]);
  const effective = resolveEffectiveAccountStatus(data as any, freshAuthData?.user || authData.user);
  if (effective.accountstatus !== 'suspended') redirect('/');

  const endDate = effective.suspendeduntil
    ? `until ${new Date(effective.suspendeduntil).toLocaleDateString()}`
    : 'until further notice';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-neutral-950">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold text-brand-navy-900 dark:text-white">Your account has been disabled.</h1>
        {effective.statusreasontype && <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-neutral-200">{effective.statusreasontype}</p>}
        {effective.statusreason && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-neutral-300">
            {effective.statusreason}
          </p>
        )}
        <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">
          This restriction is in effect {endDate}.
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
