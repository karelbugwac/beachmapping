import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/utils/image-upload-config';
import { detectImageMime } from '@/lib/utils/image-validation';

const bucketName = 'beach-media';

export async function POST(request: Request) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager', 'admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const formData = await request.formData();
    const file = formData.get('file') ?? formData.get('image');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 });

    if (file.size < 1 || file.size > IMAGE_UPLOAD_CONFIG.storage.resortPhotosMaxBytes) {
      return NextResponse.json({ error: 'Compressed images must be no larger than 1 MB.' }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const actualType = detectImageMime(bytes);
    if (
      !actualType ||
      !IMAGE_UPLOAD_CONFIG.storage.allowedOutputTypes.includes(actualType as 'image/webp' | 'image/jpeg') ||
      file.type !== actualType
    ) {
      return NextResponse.json({ error: 'Only compressed WebP or JPEG images are accepted.' }, { status: 400 });
    }

    const requestedBeachId = formData.get('beachid');
    let beachId = 'general';

    if (typeof requestedBeachId === 'string' && requestedBeachId.trim()) {
      beachId = requestedBeachId.trim();
    } else {
      const { data: beach } = await (auth.adminClient.from('beaches') as any)
        .select('id')
        .eq('ownerid', auth.user.id)
        .maybeSingle();
      if (beach?.id) {
        beachId = beach.id;
      }
    }

    const extension = actualType === 'image/webp' ? 'webp' : 'jpg';
    const path = `${auth.user.id}/${beachId}/${randomUUID()}.${extension}`;
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await auth.adminClient.storage.from(bucketName).upload(
      path,
      fileBytes,
      { cacheControl: '31536000', contentType: actualType, upsert: false }
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