import { NextResponse } from 'next/server';
import { updateSessionUser, getCurrentSession } from '@/lib/db/auth';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, profile_image_url } = body;

    const updated = await updateSessionUser({
      full_name: typeof full_name === 'string' ? full_name.trim() : undefined,
      profile_image_url: profile_image_url !== undefined ? profile_image_url : undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Could not save your profile.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
