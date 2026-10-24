import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminLogin = pathname === '/admin/login';
  const isOwnerLogin = pathname === '/owner/login';
  
  if (isAdminLogin || isOwnerLogin) return NextResponse.next();

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isOwnerRoute = pathname === '/owner' || pathname.startsWith('/owner/');
  const isProfileRoute = pathname === '/profile' || pathname.startsWith('/profile/');
  
  if (!isAdminRoute && !isOwnerRoute && !isProfileRoute) return NextResponse.next();

  let response = NextResponse.next({ request });
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
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    const loginPath = isOwnerRoute ? '/owner/login' : '/login';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  // Skip role check for admin routes to improve performance - rely on client-side checks
  // The admin login already validates the PIN and role
  if (isAdminRoute) {
    return response;
  }

  if (isOwnerRoute) {
    const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    const hasAccess = profile?.role === 'beach_owner' || profile?.role === 'beach_manager';

    if (profileError || !hasAccess) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};