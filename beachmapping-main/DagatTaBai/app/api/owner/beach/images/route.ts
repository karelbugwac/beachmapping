import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

const bucketName = 'beach-media';
const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export async function POST(request: Request) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const formData = await request.formData();
    const file = formData.get('image');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 });
    const extension = allowedTypes.get(file.type);
    if (!extension) return NextResponse.json({ error: 'Images must be JPEG, PNG, or WebP.' }, { status: 400 });
    if (file.size < 1 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be no larger than 10 MB.' }, { status: 400 });
    }

    const { data: beach, error: beachError } = await (auth.adminClient.from('beaches') as any)
      .select('id')
      .eq('owner_id', auth.user.id)
      .maybeSingle();
    if (beachError) throw beachError;
    if (!beach) return NextResponse.json({ error: 'Create your beach listing before uploading images.' }, { status: 409 });

    const path = `${auth.user.id}/${beach.id}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await auth.adminClient.storage.from(bucketName).upload(
      path,
      new Uint8Array(await file.arrayBuffer()),
      { contentType: file.type, upsert: false }
    );
    if (uploadError) throw uploadError;

    const { data } = auth.adminClient.storage.from(bucketName).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Image upload failed.';
    console.error('Owner beach image upload failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}