import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { isSuspensionActive } from '@/lib/utils/account-status';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }
    const resolvedParams = await params;
    const adminSupabase = createAdminClient();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      resolvedParams.id
    );

    if (!isUuid) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase.from('owner_applications') as any)
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const { data: applicantProfile, error: applicantProfileError } = data.applicant_user_id
      ? await auth.adminClient.from('profiles')
        .select('account_status, suspended_until, status_reason, profile_image_url')
        .eq('id', data.applicant_user_id)
        .maybeSingle()
      : { data: null, error: null };
    if (applicantProfileError) {
      console.error('Unable to load applicant account status:', applicantProfileError);
      return NextResponse.json({ error: 'Unable to load the applicant account status.' }, { status: 500 });
    }

    const signDocument = async (path: string | null | undefined, bucket: string) => {
      if (!path) return { thumbnail_url: null, full_url: null, download_url: null, file_type: null };
      const fileName = path.split('?')[0];
      const extension = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase();
      const fileType = ['jpg', 'jpeg', 'png', 'webp'].includes(extension)
        ? 'image'
        : extension === 'pdf' ? 'pdf' : 'unknown';
      const storage = adminSupabase.storage.from(bucket);
      const [preview, download] = await Promise.all([
        storage.createSignedUrl(path, 600),
        storage.createSignedUrl(path, 600, { download: true }),
      ]);
      if (preview.error || download.error || !preview.data?.signedUrl || !download.data?.signedUrl) {
        console.error('Unable to sign owner application document URL:', preview.error || download.error);
        throw new Error('Unable to load application documents.');
      }
      return {
        thumbnail_url: fileType === 'image' ? preview.data.signedUrl : null,
        full_url: preview.data.signedUrl,
        download_url: download.data.signedUrl,
        file_type: fileType,
      };
    };

    let documents;
    try {
      const [permit, ownership, idPhoto] = await Promise.all([
        signDocument(data.business_permit_path, 'owner-application-documents'),
        signDocument(data.proof_of_ownership_path, 'owner-application-documents'),
        signDocument(data.liveness_snapshot_path, 'owner-verification-snapshots'),
      ]);
      documents = { permit, ownership, id_photo: idPhoto };
    } catch {
      return NextResponse.json(
        { error: 'Unable to load application documents.' },
        { status: 500, headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
      );
    }
    const storagePathFields = new Set([
      'business_permit_path',
      'proof_of_ownership_path',
      'ownership_proof_path',
      'live_selfie_path',
      'liveness_snapshot_path',
    ]);
    const applicationData = Object.fromEntries(
      Object.entries(data).filter(([field]) => !storagePathFields.has(field))
    );

    return NextResponse.json(
      {
        application: {
          ...applicationData,
          applicant_profile_image_url: applicantProfile?.profile_image_url || null,
          documents,
          account_status: applicantProfile
            ? isSuspensionActive(applicantProfile.account_status, applicantProfile.suspended_until)
              ? 'suspended'
              : applicantProfile.account_status === 'suspended' ? 'active' : applicantProfile.account_status
            : null,
          account_status_reason: applicantProfile?.status_reason || null,
          business_permit_url: documents.permit.full_url,
          proof_of_ownership_url: documents.ownership.full_url,
          liveness_snapshot_url: documents.id_photo.full_url,
          live_selfie_url: documents.id_photo.full_url,
        },
      },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    );
  } catch (error: unknown) {
    console.error('Unable to load admin application details:', error);
    return NextResponse.json(
      { error: 'Could not load application details.' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    );
  }
}
