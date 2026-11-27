import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { resolveEffectiveAccountStatus } from '@/lib/server/accountstatus';

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
    const { data, error } = await (adminSupabase.from('ownerapplications') as any)
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const [{ data: applicantProfile, error: applicantProfileError }, applicantAuthResult] = data.applicantuserid
      ? await Promise.all([
          auth.adminClient.from('profiles')
            .select('accountstatus, suspendeduntil, statusreason, statusreasontype, statuschangedat, profileimageurl')
            .eq('id', data.applicantuserid)
            .maybeSingle(),
          auth.adminClient.auth.admin.getUserById(data.applicantuserid),
        ])
      : [{ data: null, error: null }, { data: null }];
    if (applicantProfileError) {
      console.error('Unable to load applicant account status:', applicantProfileError);
      return NextResponse.json({ error: 'Unable to load the applicant account status.' }, { status: 500 });
    }
    const effectiveApplicant = data.applicantuserid
      ? resolveEffectiveAccountStatus(applicantProfile as any, applicantAuthResult?.data?.user)
      : null;

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
      const [permit, ownership, idPhoto, validId] = await Promise.all([
        signDocument(data.businesspermitpath, 'owner-application-documents'),
        signDocument(data.proofofownershippath, 'owner-application-documents'),
        signDocument(data.livenesssnapshotpath, 'owner-verification-snapshots'),
        signDocument(data.valididpath, 'owner-application-documents'),
      ]);
      documents = { permit, ownership, id_photo: idPhoto, valid_id: validId };
    } catch {
      return NextResponse.json(
        { error: 'Unable to load application documents.' },
        { status: 500, headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
      );
    }
    const storagePathFields = new Set([
      'businesspermitpath',
      'proofofownershippath',
      'valididpath',
      'ownership_proof_path',
      'liveselfiepath',
      'livenesssnapshotpath',
    ]);
    const applicationData = Object.fromEntries(
      Object.entries(data).filter(([field]) => !storagePathFields.has(field))
    );

    return NextResponse.json(
      {
        application: {
          ...applicationData,
          applicant_profile_image_url: applicantProfile?.profileimageurl || null,
          documents,
          accountstatus: effectiveApplicant ? effectiveApplicant.accountstatus : null,
          account_status_reason: effectiveApplicant?.statusreason || null,
          business_permit_url: documents.permit.full_url,
          proof_of_ownership_url: documents.ownership.full_url,
          valid_id_url: documents.valid_id.full_url,
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
