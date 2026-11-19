import { NextResponse } from 'next/server';
import { updateSessionUser, getCurrentSession } from '@/lib/db/auth';
import { FULL_NAME_MESSAGES, validateFullName } from '@/lib/validation/fullName';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid profile data.' }, { status: 400 });
    }

    const { full_name, profile_image_url, location } = body as {
      full_name?: unknown;
      profile_image_url?: unknown;
      location?: unknown;
    };
    const nameValidation = full_name === undefined ? null : validateFullName(full_name);
    if (nameValidation && !nameValidation.ok) {
      return NextResponse.json({ error: FULL_NAME_MESSAGES.serverRejected }, { status: 400 });
    }

    if (
      (location !== undefined &&
        location !== null &&
        (typeof location !== 'string' || location.trim().length > 160)) ||
      (profile_image_url !== undefined &&
        profile_image_url !== null &&
        (typeof profile_image_url !== 'string' ||
          (!profile_image_url.startsWith('data:image/') && !profile_image_url.startsWith('https://'))))
    ) {
      return NextResponse.json({ error: 'Invalid profile name or image.' }, { status: 400 });
    }
    if (full_name === undefined && profile_image_url === undefined && location === undefined) {
      return NextResponse.json({ error: 'No profile changes were provided.' }, { status: 400 });
    }

    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await updateSessionUser({
      full_name: nameValidation?.value,
      profile_image_url: profile_image_url as string | null | undefined,
      location: typeof location === 'string' ? location.trim() || null : location === null ? null : undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Could not save your profile.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: unknown) {
    console.error('Failed to update profile:', error);
    return NextResponse.json(
      { error: 'Could not save your profile. Please try again.' },
      { status: 500 }
    );
  }
}
