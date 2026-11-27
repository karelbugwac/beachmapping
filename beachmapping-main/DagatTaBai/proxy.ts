import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSuspensionActive } from '@/lib/utils/account-status';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminLogin = pathname === '/admin/login';
  const isOwnerLogin = pathname === '/owner/login';
  
  if (isAdminLogin || isOwnerLogin) return NextResponse.next();

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isOwnerRoute = pathname === '/owner' || pathname.startsWith('/owner/');
  const isProfileRoute = pathname === '/profile' || pathname.startsWith('/profile/');
  const isApplicationStatusRoute = pathname === '/apply/status' || pathname.startsWith('/apply/status/');
  const isNotificationsPage = pathname === '/notifications' || pathname.startsWith('/notifications/');
  const isApiRoute = pathname.startsWith('/api/');
  const isAdminApiRoute = pathname === '/api/admin' || pathname.startsWith('/api/admin/');
  const isOwnerApiRoute = pathname === '/api/owner' || pathname.startsWith('/api/owner/');
  const isProtectedApiRoute = isAdminApiRoute || isOwnerApiRoute ||
    pathname === '/api/profile' || pathname.startsWith('/api/profile/') ||
    pathname === '/api/notifications' || pathname.startsWith('/api/notifications/') ||
    pathname === '/api/assistant/history' ||
    pathname === '/api/auth/profile' || pathname === '/api/auth/track-device';
  const isAdminApplicationsRequest = pathname === '/api/applications' && request.method === 'GET';
  const isSuspendedPage = pathname === '/suspended';
  if (isAdminApiRoute && ['POST', 'PATCH', 'DELETE'].includes(request.method)) {
    const configuredOrigin = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
    const expectedOrigin = configuredOrigin ? new URL(configuredOrigin).origin : request.nextUrl.origin;
    if (request.headers.get('origin') !== expectedOrigin) {
      return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 });
    }
    if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
      return NextResponse.json({ error: "You don't have permission to do that." }, { status: 415 });
    }
  }
  const suspensionExemptApiRoutes = new Set([
    '/api/auth/session',
    '/api/auth/login',
    '/api/auth/pin-login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/google',
    '/api/auth/callback/google',
  ]);
  const checkSuspension = !isAdminRoute &&
    !isSuspendedPage &&
    pathname !== '/login' &&
    pathname !== '/register' &&
    !isAdminApiRoute &&
    !isAdminApplicationsRequest &&
    !suspensionExemptApiRoutes.has(pathname);
  
  if (!isAdminRoute && !isOwnerRoute && !isProfileRoute && !isApplicationStatusRoute &&
    !isNotificationsPage && !checkSuspension && !isProtectedApiRoute) {
    return NextResponse.next();
  }

  // Avoid burst-loading and rate-limiting during Next.js background prefetching
  const isPrefetch =
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('x-purpose') === 'prefetch' ||
    request.headers.get('sec-purpose') === 'prefetch';
  if (isPrefetch) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const setPrivateHeaders = (target: NextResponse) => {
    target.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
    target.headers.set('Pragma', 'no-cache');
    target.headers.set('Expires', '0');
    return target;
  };
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    if (isProtectedApiRoute) {
      return setPrivateHeaders(NextResponse.json({ error: 'Authentication required.' }, { status: 401 }));
    }
    if (isApiRoute || (!isAdminRoute && !isOwnerRoute && !isProfileRoute && !isApplicationStatusRoute && !isNotificationsPage)) {
      return NextResponse.next();
    }
    if (isAdminRoute) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
      return setPrivateHeaders(NextResponse.redirect(loginUrl));
    }
    const loginUrl = new URL(isOwnerRoute ? '/owner/login' : '/login', request.url);
    loginUrl.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
    return setPrivateHeaders(NextResponse.redirect(loginUrl));
  }

  let profileStatus: {
    role?: string;
    pinresetrequired?: boolean;
    accountstatus?: string;
    statusreason?: string | null;
    statusreasontype?: string | null;
    suspendeduntil?: string | null;
    statuschangedat?: string | null;
    status?: string;
    suspensionreason?: string | null;
    suspendedat?: string | null;
    suspensionendsat?: string | null;
  } | null = null;
  let adminAuthUser: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null = null;
  if (checkSuspension || isOwnerRoute || isAdminRoute || isOwnerApiRoute ||
    isApplicationStatusRoute || isNotificationsPage) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const queryClient = serviceRoleKey
      ? createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
          serviceRoleKey,
          { cookies: { getAll: () => [], setAll: () => {} } }
        )
      : supabase;
    if (serviceRoleKey) {
      try {
        const { data: freshAuth } = await queryClient.auth.admin.getUserById(data.user.id);
        if (freshAuth?.user) adminAuthUser = freshAuth.user as any;
      } catch {
        // Fallback to session user
      }
    }
    const profileColumnSets = [
      'role, accountstatus, statusreason, statusreasontype, suspendeduntil, statuschangedat, pinresetrequired, status, suspensionreason, suspendedat, suspensionendsat',
      'role, accountstatus, statusreason, suspendeduntil, pinresetrequired, status, suspensionreason, suspendedat, suspensionendsat',
      'role, status, suspensionreason, suspendedat, suspensionendsat',
      'role',
    ] as const;
    let profileError: { code?: string } | null = null;
    for (const columns of profileColumnSets) {
      const result = await (queryClient.from('profiles') as any)
        .select(columns)
        .eq('id', data.user.id)
        .maybeSingle();
      if (!result.error) {
        profileStatus = result.data;
        profileError = null;
        break;
      }
      profileError = result.error;
      if (result.error.code !== '42703' && result.error.code !== 'PGRST204') break;
    }
    if (profileError && (
      isApiRoute ||
      isOwnerRoute ||
      isAdminRoute ||
      isProfileRoute ||
      isApplicationStatusRoute ||
      isNotificationsPage
    )) {
      const metaRole = (data.user.user_metadata?.role as string) || (data.user.app_metadata?.role as string);
      if (isAdminRoute && (metaRole === 'admin' || data.user.email?.toLowerCase() === 'official.dagattabai@gmail.com')) {
        profileStatus = { role: 'admin', status: 'active' };
      } else {
        return setPrivateHeaders(NextResponse.json({ error: 'Could not verify account permissions.' }, { status: 503 }));
      }
    }
  }

  const metadata = ((adminAuthUser?.user_metadata || data.user.user_metadata) || {}) as Record<string, unknown>;
  const appMetadata = ((adminAuthUser?.app_metadata || data.user.app_metadata) || {}) as Record<string, unknown>;
  const profileChangedAt = profileStatus?.statuschangedat || profileStatus?.suspendedat || null;
  const appChangedAt = typeof appMetadata.statuschangedat === 'string' ? appMetadata.statuschangedat : null;
  const useAppMeta = Boolean(
    appMetadata.accountstatus &&
    (!profileChangedAt || (appChangedAt && Date.parse(appChangedAt) >= Date.parse(profileChangedAt)))
  );
  const rawAccountStatus = useAppMeta
    ? appMetadata.accountstatus
    : profileStatus?.accountstatus || profileStatus?.status || appMetadata.accountstatus || appMetadata.status || metadata.status || 'active';
  const accountStatus = rawAccountStatus === 'suspended' ? 'suspended' : 'active';
  const suspendedUntil = useAppMeta
    ? (typeof appMetadata.suspendeduntil === 'string' ? appMetadata.suspendeduntil : null)
    : profileStatus?.suspendeduntil ||
      profileStatus?.suspensionendsat ||
      (typeof appMetadata.suspendeduntil === 'string' ? appMetadata.suspendeduntil : null) ||
      (typeof metadata.suspensionendsat === 'string' ? metadata.suspensionendsat : null);
  if (checkSuspension && isSuspensionActive(accountStatus, suspendedUntil)) {
    const resolvedReason = (useAppMeta && typeof appMetadata.statusreason === 'string' ? appMetadata.statusreason : null) ||
      profileStatus?.statusreason ||
      profileStatus?.suspensionreason ||
      (typeof appMetadata.statusreason === 'string' ? appMetadata.statusreason : null) ||
      (typeof metadata.statusreason === 'string' ? metadata.statusreason : null) ||
      null;
    const resolvedReasonType = (useAppMeta && typeof appMetadata.statusreasontype === 'string' ? appMetadata.statusreasontype : null) ||
      profileStatus?.statusreasontype ||
      (typeof appMetadata.statusreasontype === 'string' ? appMetadata.statusreasontype : null) ||
      null;
    if (isApiRoute) {
      return NextResponse.json({
        code: 'ACCOUNT_SUSPENDED',
        reason: resolvedReason,
        reasontype: resolvedReasonType,
        suspendeduntil: suspendedUntil,
      }, {
        status: 403,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      });
    }
    const targetLoginPath = (isOwnerRoute || profileStatus?.role === 'beach_owner' || profileStatus?.role === 'beach_manager')
      ? '/owner/login'
      : '/login';
    const loginRedirectUrl = new URL(targetLoginPath, request.url);
    loginRedirectUrl.searchParams.set('error', 'account_disabled');
    if (resolvedReason) loginRedirectUrl.searchParams.set('reason', resolvedReason);
    if (resolvedReasonType) loginRedirectUrl.searchParams.set('reasontype', resolvedReasonType);
    if (suspendedUntil) loginRedirectUrl.searchParams.set('suspendeduntil', suspendedUntil);
    const redirectResponse = NextResponse.redirect(loginRedirectUrl);
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith('sb-')) {
        redirectResponse.cookies.delete(cookie.name);
      }
    }
    return setPrivateHeaders(redirectResponse);
  }

  const isOwnerProfile = profileStatus?.role === 'beach_owner' || profileStatus?.role === 'beach_manager';
  if (isOwnerProfile && profileStatus?.pinresetrequired) {
    if (isApiRoute && pathname !== '/api/owner/reset-pin') {
      return NextResponse.json({ error: 'Please create a new PIN to continue.' }, {
        status: 403,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      });
    }
    if (isOwnerRoute && pathname !== '/owner/reset-pin') {
      return setPrivateHeaders(NextResponse.redirect(new URL('/owner/reset-pin', request.url)));
    }
  }

  if (isAdminRoute) {
    const isMetaAdmin =
      metadata.role === 'admin' ||
      data.user.app_metadata?.role === 'admin' ||
      data.user.email?.toLowerCase() === 'official.dagattabai@gmail.com';
    if (profileStatus?.role !== 'admin' && !isMetaAdmin) {
      return setPrivateHeaders(NextResponse.redirect(new URL('/unauthorized', request.url)));
    }
    return setPrivateHeaders(response);
  }

  if (isOwnerRoute) {
    const hasAccess = profileStatus?.role === 'beach_owner' || profileStatus?.role === 'beach_manager';

    if (!hasAccess) {
      return setPrivateHeaders(NextResponse.redirect(new URL('/unauthorized', request.url)));
    }
  }

  if (isOwnerRoute || isProfileRoute || isProtectedApiRoute || isApplicationStatusRoute || isNotificationsPage) {
    return setPrivateHeaders(response);
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};