'use client';

import { useEffect } from 'react';

function getProtectedPortal(pathname: string): 'admin' | 'owner' | 'user' | null {
  if (pathname === '/admin/login' || pathname === '/owner/login') return null;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  if (pathname === '/owner' || pathname.startsWith('/owner/')) return 'owner';
  if (pathname === '/profile' || pathname.startsWith('/profile/')) return 'user';
  if (pathname === '/apply/status' || pathname.startsWith('/apply/status/')) return 'user';
  if (pathname === '/notifications' || pathname.startsWith('/notifications/')) return 'user';
  return null;
}

function getLoginPath(portal: 'admin' | 'owner' | 'user', pathname: string) {
  const loginPath = portal === 'admin' ? '/admin/login' : portal === 'owner' ? '/owner/login' : '/login';
  const redirect = `${pathname}${window.location.search}`;
  return `${loginPath}?redirect=${encodeURIComponent(redirect)}`;
}

export function PageRestorationGuard() {
  useEffect(() => {
    let active = true;
    let validationSequence = 0;
    const hidePrivatePage = () => {
      document.documentElement.dataset.privatePageHidden = 'true';
      document.documentElement.style.visibility = 'hidden';
    };
    const revealPrivatePage = () => {
      delete document.documentElement.dataset.privatePageHidden;
      document.documentElement.style.removeProperty('visibility');
    };

    const validatePortal = (portal: 'admin' | 'owner' | 'user') => {
      const currentSequence = ++validationSequence;
      hidePrivatePage();
      void fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' })
        .then(async (response) => {
          if (!response.ok) throw new Error('Session verification failed.');
          const result: {
            user?: {
              role?: string;
              status?: string;
              suspensionreason?: string | null;
              statusreasontype?: string | null;
              suspensionendsat?: string | null;
            } | null;
          } = await response.json();
          if (currentSequence !== validationSequence) return;
          if (!result.user) {
            window.location.replace(getLoginPath(portal, window.location.pathname));
            return;
          }
          if (result.user.status === 'suspended') {
            void fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
            const params = new URLSearchParams({ error: 'account_disabled' });
            if (result.user.suspensionreason) params.set('reason', result.user.suspensionreason);
            if (result.user.statusreasontype) params.set('reasontype', result.user.statusreasontype);
            if (result.user.suspensionendsat) params.set('suspendeduntil', result.user.suspensionendsat);
            const targetLogin = portal === 'owner' ? '/owner/login' : '/login';
            window.location.replace(`${targetLogin}?${params.toString()}`);
            return;
          }
          if (portal === 'admin' && result.user.role !== 'admin') {
            window.location.replace('/unauthorized');
            return;
          }
          if (portal === 'owner' && !['beach_owner', 'beach_manager'].includes(result.user.role || '')) {
            window.location.replace('/unauthorized');
            return;
          }
          if (active && currentSequence === validationSequence) revealPrivatePage();
        })
        .catch(() => {
          if (active && currentSequence === validationSequence) {
            window.location.replace(getLoginPath(portal, window.location.pathname));
          }
        });
    };

    const handlePageHide = () => {
      if (getProtectedPortal(window.location.pathname)) hidePrivatePage();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const portal = getProtectedPortal(window.location.pathname);
      if (!portal) {
        if (document.documentElement.dataset.privatePageHidden === 'true') revealPrivatePage();
        return;
      }
      validatePortal(portal);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const portal = getProtectedPortal(window.location.pathname);
      if (portal) validatePortal(portal);
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (document.documentElement.dataset.privatePageHidden === 'true') revealPrivatePage();
    };
  }, []);

  return null;
}
