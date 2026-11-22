import { createClient } from '@/lib/supabase/client';
import { publishAuthSession } from '@/lib/client/session';

export async function signOutAndClearClientState(userId?: string | null) {
  const supabase = createClient();
  let failure: Error | null = null;
  let resolvedUserId = userId || null;

  try {
    if (!resolvedUserId) {
      const { data } = await supabase.auth.getUser();
      resolvedUserId = data.user?.id || null;
    }
    const { error } = await supabase.auth.signOut();
    if (error) failure = error;
  } catch (error: unknown) {
    failure = error instanceof Error ? error : new Error('Could not sign out.');
  }

  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok && !failure) failure = new Error('Could not clear the server session.');
  } catch (error: unknown) {
    if (!failure) failure = error instanceof Error ? error : new Error('Could not clear the server session.');
  }

  if (resolvedUserId) {
    try {
      window.localStorage.removeItem(`owner-application-draft:${resolvedUserId}`);
    } catch (error: unknown) {
      console.error('Could not clear the saved application draft:', error);
    }
  }
  publishAuthSession(null);
  window.dispatchEvent(new CustomEvent('dtb_logout_completed'));

  if (failure) throw failure;
}
