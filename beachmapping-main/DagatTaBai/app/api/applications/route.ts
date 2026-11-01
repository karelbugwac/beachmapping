import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { ownerApplicationSchema } from '@/lib/validation/ownerApplication';
import { authorizeRoles } from '@/lib/supabase/authorization';

const DOCUMENT_BUCKET = 'owner-application-documents';
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function GET() {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {

      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { data, error } = await (auth.adminClient.from('owner_applications') as any)
      .select('*')
      .order('created_at', { ascending: false });




    if (error) {
      console.error('Failed to fetch applications:', error);
      return NextResponse.json({ error: 'Failed to load applications.' }, { status: 500 });
    }

    return NextResponse.json(
      { applications: data || [] },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    console.error('Applications GET error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminSupabase = createAdminClient();
  const uploadedPaths: string[] = [];
  try {
    const formData = await request.formData();
    const permit = formData.get('business_permit');
    const ownershipProof = formData.get('proof_of_ownership');
    if (!(permit instanceof File) || !(ownershipProof instanceof File)) {
      return NextResponse.json({ error: 'Upload both the business permit and ownership document.' }, { status: 400 });
    }
    for (const file of [permit, ownershipProof]) {
      if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
        return NextResponse.json({ error: 'Documents must be PDF, PNG, or JPEG files.' }, { status: 400 });
      }
      if (file.size === 0 || file.size > MAX_DOCUMENT_SIZE) {
        return NextResponse.json({ error: 'Each document must be smaller than 10 MB.' }, { status: 400 });
      }
    }

    const parsed = ownerApplicationSchema.safeParse({
      applicant_full_name: getFormValue(formData, 'applicant_full_name'),
      applicant_email: getFormValue(formData, 'applicant_email').trim().toLowerCase(),
      business_name: getFormValue(formData, 'business_name'),
      beach_name: getFormValue(formData, 'beach_name'),
      beach_location: getFormValue(formData, 'beach_location'),
      contact_phone: getFormValue(formData, 'contact_phone'),
      agreeToTerms: getFormValue(formData, 'agreeToTerms') === 'true',
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid application details.' }, { status: 400 });
    }

    const uploadDocument = async (file: File, label: string) => {
      const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg';
      const path = `${randomUUID()}/${label}.${extension}`;
      const { error } = await adminSupabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(path, new Uint8Array(await file.arrayBuffer()), { contentType: file.type, upsert: false });
      if (error) throw error;
      uploadedPaths.push(path);
      return path;
    };

    const businessPermitPath = await uploadDocument(permit, 'business-permit');
    const ownershipProofPath = await uploadDocument(ownershipProof, 'ownership-proof');

    // Insert new application record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase.from('owner_applications') as any)
      .insert({
        applicant_full_name: parsed.data.applicant_full_name,
        applicant_email: parsed.data.applicant_email,
        business_name: parsed.data.business_name,
        beach_name: parsed.data.beach_name,
        applicant_location: null,
        contact_phone: parsed.data.contact_phone,
        beach_location: parsed.data.beach_location,
        business_permit_path: businessPermitPath,
        proof_of_ownership_path: ownershipProofPath,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to submit application:', error);
      await adminSupabase.storage.from(DOCUMENT_BUCKET).remove(uploadedPaths);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    console.error('Application submission error:', msg);
    if (uploadedPaths.length) await adminSupabase.storage.from(DOCUMENT_BUCKET).remove(uploadedPaths);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
