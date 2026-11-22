import { NextResponse } from 'next/server';
import { updateSessionUser, getCurrentSession } from '@/lib/db/auth';
import { FULL_NAME_MESSAGES, validateFullName } from '@/lib/validation/fullName';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid profile data.' }, { status: 400 });
    }

    const { fullname, profileimageurl, location } = body as {
      fullname?: unknown;
      profileimageurl?: unknown;
      location?: unknown;
    };
    const nameValidation = fullname === undefined ? null : validateFullName(fullname);
    if (nameValidation && !nameValidation.ok) {
      return NextResponse.json({ error: FULL_NAME_MESSAGES.serverRejected }, { status: 400 });
    }

    if (
      (location !== undefined &&
        location !== null &&
        (typeof location !== 'string' || location.trim().length > 160)) ||
      (profileimageurl !== undefined &&
        profileimageurl !== null &&
        (typeof profileimageurl !== 'string' ||
          (!profileimageurl.startsWith('data:image/') && !profileimageurl.startsWith('https://'))))
    ) {
      return NextResponse.json({ error: 'Invalid profile name or image.' }, { status: 400 });
    }
    if (fullname === undefined && profileimageurl === undefined && location === undefined) {
      return NextResponse.json({ error: 'No profile changes were provided.' }, { status: 400 });
    }

    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let finalImageUrl: string | null | undefined = profileimageurl as string | null | undefined;

    // Senior Backend Defense: If client submitted a base64 data URL, upload to storage instead of bloating DB
    if (typeof finalImageUrl === 'string' && finalImageUrl.startsWith('data:image/')) {
      try {
        const matches = finalImageUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const buffer = Buffer.from(matches[2], 'base64');
          const adminSupabase = createAdminClient();
          const objectPath = `${session.id}/general/avatar-${Date.now()}.webp`;

          const { error: uploadErr } = await adminSupabase.storage
            .from('beach-media')
            .upload(objectPath, buffer, {
              contentType: 'image/webp',
              cacheControl: '31536000',
              upsert: true,
            });

          if (!uploadErr) {
            const { data: pubData } = adminSupabase.storage
              .from('beach-media')
              .getPublicUrl(objectPath);
            finalImageUrl = pubData.publicUrl;
          }
        }
      } catch (convErr) {
        console.warn('Base64 avatar conversion warning:', convErr);
      }
    }

    const updated = await updateSessionUser({
      fullname: nameValidation?.value,
      profileimageurl: finalImageUrl,
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
