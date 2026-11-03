import { NextResponse } from 'next/server';
import { updateSessionUser, getCurrentSession } from '@/lib/db/auth';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid profile data.' }, { status: 400 });
    }

    const { full_name, profile_image_url } = body as {
      full_name?: unknown;
      profile_image_url?: unknown;
    };
    if (
      (full_name !== undefined &&
        (typeof full_name !== 'string' || full_name.trim().length < 2 || full_name.trim().length > 120)) ||
      (profile_image_url !== undefined &&
        profile_image_url !== null &&
        (typeof profile_image_url !== 'string' ||
          (!profile_image_url.startsWith('data:image/') && !profile_image_url.startsWith('https://'))))
    ) {
      return NextResponse.json({ error: 'Invalid profile name or image.' }, { status: 400 });
    }
    if (full_name === undefined && profile_image_url === undefined) {
      return NextResponse.json({ error: 'No profile changes were provided.' }, { status: 400 });
    }

    const updated = await updateSessionUser({
      full_name: typeof full_name === 'string' ? full_name.trim() : undefined,
      profile_image_url: profile_image_url as string | null | undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Could not save your profile.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: unknown) {
    console.error('Failed to update profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 500 }
    );
  }
}
