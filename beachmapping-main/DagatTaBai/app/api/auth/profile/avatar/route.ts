import { NextResponse } from 'next/server';
import { getCurrentSession, updateSessionUser } from '@/lib/db/auth';
import { createAdminClient } from '@/lib/supabase/server';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No image file was provided.' }, { status: 400 });
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { error: 'Avatar file size must be 2MB or less.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const adminSupabase = createAdminClient();
    const objectPath = `${session.id}/general/avatar-${Date.now()}.webp`;

    const { error: uploadError } = await adminSupabase.storage
      .from('beach-media')
      .upload(objectPath, buffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar storage upload failed:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload photo to storage.' },
        { status: 500 }
      );
    }

    const { data: publicData } = adminSupabase.storage
      .from('beach-media')
      .getPublicUrl(objectPath);

    const publicUrl = publicData.publicUrl;

    // Save ONLY the public URL in PostgreSQL
    const updated = await updateSessionUser({
      profile_image_url: publicUrl,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update profile image in database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile_image_url: publicUrl,
      user: updated,
    });
  } catch (error: unknown) {
    console.error('Avatar upload route error:', error);
    const msg = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
