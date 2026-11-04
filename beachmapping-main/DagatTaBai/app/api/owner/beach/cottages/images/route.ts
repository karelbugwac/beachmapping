import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

const bucketName = 'beach-media';
const maxImageSizeBytes = 5 * 1024 * 1024;
const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const beachId = formData.get('beach_id');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose a cottage image.' }, { status: 400 });
    }
    if (typeof beachId !== 'string' || !beachId.trim()) {
      return NextResponse.json({ error: 'A beach listing is required before uploading cottage images.' }, { status: 400 });
    }

    const { data: beach, error: beachError } = await (auth.adminClient.from('beaches') as any)
      .select('id, owner_id')
      .eq('id', beachId)
      .maybeSingle();
    if (beachError) throw beachError;
    if (!beach || (auth.role !== 'admin' && beach.owner_id !== auth.user.id)) {
      return NextResponse.json({ error: 'Beach not found or unauthorized.' }, { status: 404 });
    }

    const extension = allowedTypes.get(file.type);
    if (!extension) {
      return NextResponse.json({ error: 'Cottage images must be JPG, PNG, or WebP.' }, { status: 400 });
    }
    if (file.size < 1 || file.size > maxImageSizeBytes) {
      return NextResponse.json({ error: 'Cottage images must be no larger than 5 MB.' }, { status: 400 });
    }

    const path = `${beach.owner_id}/${beach.id}/cottages/${randomUUID()}.${extension}`;
    const storage = auth.adminClient.storage.from(bucketName);
    const { error: uploadError } = await storage.upload(
      path,
      new Uint8Array(await file.arrayBuffer()),
      { contentType: file.type, upsert: false }
    );
    if (uploadError) throw uploadError;

    const { data } = storage.getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cottage image upload failed.';
    console.error('Cottage image upload failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const beachId = request.nextUrl.searchParams.get('beach_id');
    const imageUrl = request.nextUrl.searchParams.get('url');
    if (!beachId || !imageUrl) {
      return NextResponse.json({ error: 'A beach ID and cottage image URL are required.' }, { status: 400 });
    }

    const { data: beach, error: beachError } = await (auth.adminClient.from('beaches') as any)
      .select('id, owner_id')
      .eq('id', beachId)
      .maybeSingle();
    if (beachError) throw beachError;
    if (!beach || (auth.role !== 'admin' && beach.owner_id !== auth.user.id)) {
      return NextResponse.json({ error: 'Beach not found or unauthorized.' }, { status: 404 });
    }

    const publicUrl = auth.adminClient.storage.from(bucketName).getPublicUrl('').data.publicUrl;
    const allowedPrefix = `${publicUrl}${beach.owner_id}/${beach.id}/cottages/`;
    if (!imageUrl.startsWith(allowedPrefix)) {
      return NextResponse.json({ error: 'Image does not belong to this beach.' }, { status: 400 });
    }

    const path = imageUrl.slice(publicUrl.length);
    const { error: removeError } = await auth.adminClient.storage.from(bucketName).remove([path]);
    if (removeError) throw removeError;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cottage image removal failed.';
    console.error('Cottage image removal failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
