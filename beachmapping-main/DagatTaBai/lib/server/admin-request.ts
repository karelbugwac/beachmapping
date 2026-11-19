import { NextResponse } from 'next/server';
import { ADMIN_MESSAGES } from '@/lib/validation/admin-messages';

export function validateAdminMutationRequest(request: Request): NextResponse | null {
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const expectedOrigin = configuredOrigin ? new URL(configuredOrigin).origin : requestOrigin;
  const origin = request.headers.get('origin');

  if (origin !== expectedOrigin || !['POST', 'PATCH', 'DELETE'].includes(request.method)) {
    return NextResponse.json({ error: ADMIN_MESSAGES.notAllowed }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return NextResponse.json({ error: ADMIN_MESSAGES.notAllowed }, { status: 415 });
  }
  return null;
}

export function noStoreHeaders() {
  return { 'Cache-Control': 'private, no-store, max-age=0' };
}

export function isAdministratorAccount(profile: { role?: string | null; email?: string | null }): boolean {
  if (profile.role === 'admin') return true;
  const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || 'official.dagattabai@gmail.com,admin@dagattabai.ph')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(profile.email && allowedEmails.includes(profile.email.trim().toLowerCase()));
}
