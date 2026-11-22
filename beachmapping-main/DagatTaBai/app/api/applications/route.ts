import { NextResponse } from 'next/server';
import { createHash, createHmac, randomUUID } from 'crypto';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { ownerApplicationSchema } from '@/lib/validation/ownerApplication';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/utils/image-upload-config';
import { detectImageMime } from '@/lib/utils/image-validation';
import { FULL_NAME_MESSAGES, validateFullName } from '@/lib/validation/fullName';
import { isSuspensionActive, type AccountStatus } from '@/lib/utils/account-status';
import {
  isPendingApplicationConflict,
  PENDING_APPLICATION_MESSAGE,
} from '@/lib/validation/application-submission';
import { LIVE_VERIFICATION_MESSAGES } from '@/lib/verification/liveVerification';
import { recordFailedLiveness } from '@/lib/verification/serverLiveness';
import { validateVerificationSnapshot } from '@/lib/verification/serverSnapshot';

const DOCUMENT_BUCKET = 'owner-application-documents';
const SNAPSHOT_BUCKET = 'owner-verification-snapshots';
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/webp']);

function requestHashes(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwardedFor || request.headers.get('x-real-ip') || 'unknown';
  const hashSecret = process.env.LIVENESS_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return {
    ipHash: createHmac('sha256', hashSecret).update(address).digest('hex'),
    userAgentHash: createHash('sha256').update(request.headers.get('user-agent') || 'unknown').digest('hex'),
  };
}

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (auth.adminClient.from('ownerapplications') as any)
      .select('*')
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Failed to fetch applications:', error);
      return NextResponse.json({ error: 'Failed to load applications.' }, { status: 500 });
    }

    const applications = (data || []) as Array<{ applicantuserid?: string | null; [key: string]: unknown }>;
    const applicantIds = [...new Set(
      applications
        .map((application) => application.applicantuserid)
        .filter((id): id is string => Boolean(id))
    )];
    const { data: profiles, error: profilesError } = applicantIds.length
      ? await auth.adminClient.from('profiles')
        .select('id, accountstatus, suspendeduntil, statusreason')
        .in('id', applicantIds)
      : { data: [], error: null };
    if (profilesError) {
      console.error('Failed to fetch applicant account statuses:', profilesError);
      return NextResponse.json({ error: 'Failed to load applications.' }, { status: 500 });
    }

    const profileById = new Map<string, { accountstatus: AccountStatus; statusreason: string | null }>(
      (profiles || []).map((profile) => [
        profile.id,
        {
          accountstatus: isSuspensionActive(profile.accountstatus, profile.suspendeduntil)
            ? 'suspended'
            : profile.accountstatus === 'suspended' ? 'active' : profile.accountstatus,
          statusreason: profile.statusreason,
        },
      ])
    );
    const applicationsWithAccountStatus = applications.map((application) => ({
      ...application,
      accountstatus: application.applicantuserid
        ? profileById.get(application.applicantuserid)?.accountstatus || null
        : null,
      account_status_reason: application.applicantuserid
        ? profileById.get(application.applicantuserid)?.statusreason || null
        : null,
    }));

    return NextResponse.json(
      { applications: applicationsWithAccountStatus },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    );
  } catch (err: unknown) {
    console.error('Applications GET error:', err);
    return NextResponse.json(
      { error: 'Could not load applications.' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    );
  }
}

export async function POST(request: Request) {
  let adminSupabase: ReturnType<typeof createAdminClient> | null = null;
  const uploadedPaths: string[] = [];
  try {
    const formData = await request.formData();
    const applicationId = getFormValue(formData, 'applicationid');
    const expectedStatusUpdatedAt = getFormValue(formData, 'expected_status_updated_at');
    const isRevision = Boolean(applicationId || expectedStatusUpdatedAt);
    const nameValidation = validateFullName(getFormValue(formData, 'applicantfullname'));
    if (!nameValidation.ok) {
      return NextResponse.json({ error: FULL_NAME_MESSAGES.serverRejected }, { status: 400 });
    }

    const permit = formData.get('business_permit');
    const ownershipProof = formData.get('proof_of_ownership');
    const validId = formData.get('valid_id');
    if (!(permit instanceof File) || !(ownershipProof instanceof File) || !(validId instanceof File)) {
      return NextResponse.json({ error: 'Upload the business permit, ownership document, and valid ID.' }, { status: 400 });
    }
    for (const file of [permit, ownershipProof, validId]) {
      if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
        return NextResponse.json({ error: 'Documents must be PDF, JPEG, or WebP files.' }, { status: 400 });
      }
      if (file.size === 0 || file.size > MAX_DOCUMENT_SIZE) {
        return NextResponse.json({ error: 'Each document must be smaller than 10 MB.' }, { status: 400 });
      }
      if (file.type === 'application/pdf') {
        const header = new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer()));
        if (header !== '%PDF-') {
          return NextResponse.json({ error: 'The PDF content does not match its file type.' }, { status: 400 });
        }
      } else {
        const actualType = detectImageMime(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
        if (actualType !== file.type || file.size > IMAGE_UPLOAD_CONFIG.storage.resortPhotosMaxBytes) {
          return NextResponse.json(
            { error: 'Application images must be compressed JPEG or WebP files no larger than 1 MB.' },
            { status: 400 }
          );
        }
      }
    }

    const parsed = ownerApplicationSchema.safeParse({
      applicantfullname: nameValidation.value,
      applicantemail: getFormValue(formData, 'applicantemail').trim().toLowerCase(),
      businessname: getFormValue(formData, 'businessname'),
      beachname: getFormValue(formData, 'beachname'),
      beachlocation: getFormValue(formData, 'beachlocation'),
      contactphone: getFormValue(formData, 'contactphone'),
      agreeToTerms: getFormValue(formData, 'agreeToTerms') === 'true',
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid application details.' }, { status: 400 });
    }

    const userSupabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError && userError.name !== 'AuthSessionMissingError') {
      return NextResponse.json({ error: 'We could not verify your account. Please try again.' }, { status: 500 });
    }
    if (isRevision && (!user || !applicationId || !expectedStatusUpdatedAt ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId))) {
      return NextResponse.json({ error: 'You do not have permission to continue this application.' }, { status: 403 });
    }

    const adminClient = createAdminClient();
    adminSupabase = adminClient;
    let previousDocumentPaths: string[] = [];
    const normalizedEmail = parsed.data.applicantemail.trim().toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingEmailApplications, error: pendingEmailLookupError } = await (adminClient.from('ownerapplications') as any)
      .select('applicantemail')
      .eq('status', 'pending');
    if (pendingEmailLookupError) {
      console.error('Unable to check for a pending owner application by email:', pendingEmailLookupError);
      return NextResponse.json({ error: 'We could not submit your application. Please try again.' }, { status: 500 });
    }
    const hasPendingEmailApplication = (pendingEmailApplications || []).some(
      (application: { applicantemail?: unknown }) =>
        typeof application.applicantemail === 'string' &&
        application.applicantemail.trim().toLowerCase() === normalizedEmail
    );
    if (hasPendingEmailApplication) {
      return NextResponse.json({ error: PENDING_APPLICATION_MESSAGE }, { status: 409 });
    }

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pendingApplication, error: pendingLookupError } = await (adminClient.from('ownerapplications') as any)
        .select('id')
        .eq('applicantuserid', user.id)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();
      if (pendingLookupError) {
        console.error('Unable to check for a pending owner application:', pendingLookupError);
        return NextResponse.json({ error: 'We could not submit your application. Please try again.' }, { status: 500 });
      }
      if (pendingApplication) {
        return NextResponse.json({ error: PENDING_APPLICATION_MESSAGE }, { status: 409 });
      }
    }

    if (isRevision && user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: currentApplication, error: currentApplicationError } = await (adminClient.from('ownerapplications') as any)
        .select('id, status, statusupdatedat, businesspermitpath, proofofownershippath, valididpath')
        .eq('id', applicationId)
        .eq('applicantuserid', user.id)
        .maybeSingle();
      if (currentApplicationError) {
        console.error('Unable to verify application revision:', currentApplicationError);
        return NextResponse.json({ error: 'We could not load your application. Please try again.' }, { status: 500 });
      }
      if (!currentApplication || currentApplication.status !== 'needs_changes') {
        return NextResponse.json({ error: 'This application is not available to continue.' }, { status: 404 });
      }
      if (currentApplication.statusupdatedat !== expectedStatusUpdatedAt) {
        return NextResponse.json({ error: 'Someone else already updated this application. Refresh and try again.' }, { status: 409 });
      }
      previousDocumentPaths = [
        currentApplication.businesspermitpath,
        currentApplication.proofofownershippath,
        currentApplication.valididpath,
      ].filter((path): path is string => typeof path === 'string' && path.length > 0);
    }
    const livenessNonce = getFormValue(formData, 'liveness_nonce');
    if (!livenessNonce) {
      return NextResponse.json({ error: 'Please complete the live selfie check before submitting your application.' }, { status: 400 });
    }
    const { ipHash, userAgentHash } = requestHashes(request);
    const nonceHash = createHash('sha256').update(livenessNonce).digest('hex');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: livenessSession, error: livenessError } = await (adminClient.from('livenesssessions') as any)
      .select('noncehash,iphash,useragenthash,userid,expiresat,completedat,consumedat,status,snapshotpath,attempts,flaggedreasons')
      .eq('noncehash', nonceHash)
      .maybeSingle();
    if (livenessError) {
      console.error('Unable to verify owner application liveness session:', livenessError);
      return NextResponse.json({ error: "We couldn't verify you yet. Please try again." }, { status: 500 });
    }
    if (
      !livenessSession ||
      livenessSession.iphash !== ipHash ||
      livenessSession.useragenthash !== userAgentHash ||
      (user?.id || null) !== (livenessSession.userid || null) ||
      livenessSession.status !== 'passed' ||
      !livenessSession.completedat ||
      !livenessSession.snapshotpath ||
      livenessSession.consumedat ||
      new Date(livenessSession.expiresat).getTime() <= Date.now()
    ) {
      return NextResponse.json({ error: 'Please complete the live selfie check before submitting your application.' }, { status: 400 });
    }

    const { data: snapshotFile, error: snapshotDownloadError } = await adminClient.storage
      .from(SNAPSHOT_BUCKET)
      .download(livenessSession.snapshotpath);
    if (snapshotDownloadError || !snapshotFile) {
      console.error('Unable to load verified owner selfie:', snapshotDownloadError?.message || 'missing snapshot');
      const recorded = await recordFailedLiveness(
        adminClient,
        livenessSession,
        livenessSession.completedat,
        new Date().toISOString(),
        ['snapshot_unavailable']
      );
      if (!recorded) {
        return NextResponse.json({ error: LIVE_VERIFICATION_MESSAGES.serverRejected }, { status: 500 });
      }
      return NextResponse.json({ error: LIVE_VERIFICATION_MESSAGES.serverRejected }, { status: 400 });
    }

    const snapshotValidation = await validateVerificationSnapshot(
      Buffer.from(await snapshotFile.arrayBuffer())
    );
    if (snapshotValidation.reasons.length) {
      const recorded = await recordFailedLiveness(
        adminClient,
        livenessSession,
        livenessSession.completedat,
        new Date().toISOString(),
        snapshotValidation.reasons
      );
      if (!recorded) {
        return NextResponse.json({ error: LIVE_VERIFICATION_MESSAGES.serverRejected }, { status: 500 });
      }
      return NextResponse.json({ error: snapshotValidation.message }, { status: 400 });
    }

    const uploadDocument = async (file: File, label: string) => {
      const extension = file.type === 'application/pdf'
        ? 'pdf'
        : file.type === 'image/webp'
          ? 'webp'
          : 'jpg';
      const path = `${randomUUID()}/${label}.${extension}`;
      const { error } = await adminClient.storage
        .from(DOCUMENT_BUCKET)
        .upload(path, new Uint8Array(await file.arrayBuffer()), {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });
      if (error) throw error;
      uploadedPaths.push(path);
      return path;
    };

    const businessPermitPath = await uploadDocument(permit, 'business-permit');
    const ownershipProofPath = await uploadDocument(ownershipProof, 'ownership-proof');
    const validIdPath = await uploadDocument(validId, 'valid-id');

    const submittedAt = new Date().toISOString();
    const applicationValues = {
      applicantfullname: parsed.data.applicantfullname,
      applicantemail: parsed.data.applicantemail,
      applicantuserid: user?.id || null,
      businessname: parsed.data.businessname,
      beachname: parsed.data.beachname,
      applicantlocation: null,
      contactphone: parsed.data.contactphone,
      beachlocation: parsed.data.beachlocation,
      businesspermitpath: businessPermitPath,
      proofofownershippath: ownershipProofPath,
      valididpath: validIdPath,
      livenessstatus: 'passed',
      livenesscheckedat: submittedAt,
      livenessattempts: livenessSession.attempts,
      livenesssnapshotpath: livenessSession.snapshotpath,
      livenessflaggedreasons: livenessSession.flaggedreasons,
      liveselfiepath: livenessSession.snapshotpath,
      liveselfiecapturedat: livenessSession.completedat,
      status: 'pending',
      statusnote: null,
      statusupdatedat: submittedAt,
      rejectionreason: null,
      decidedat: null,
      reviewedat: null,
      reviewedby: null,
      updatedat: submittedAt,
    };

    if (isRevision && user) {
      // Consume the verified liveness session before changing the existing application.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: consumedSession, error: consumeError } = await (adminClient.from('livenesssessions') as any)
        .update({ consumedat: submittedAt })
        .eq('noncehash', nonceHash)
        .eq('status', 'passed')
        .gt('expiresat', submittedAt)
        .is('consumedat', null)
        .select('noncehash')
        .maybeSingle();
      if (consumeError || !consumedSession) {
        if (consumeError) console.error('Unable to consume owner application liveness session:', consumeError);
        const { error: cleanupError } = await adminClient.storage.from(DOCUMENT_BUCKET).remove(uploadedPaths);
        if (cleanupError) console.error('Unable to remove documents after liveness conflict:', cleanupError);
        uploadedPaths.length = 0;
        return NextResponse.json({ error: "We couldn't verify you yet. Please try again." }, { status: 400 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedApplication, error: updateError } = await (adminClient.from('ownerapplications') as any)
        .update(applicationValues)
        .eq('id', applicationId)
        .eq('applicantuserid', user.id)
        .eq('status', 'needs_changes')
        .eq('statusupdatedat', expectedStatusUpdatedAt)
        .select('id, status, livenessstatus')
        .maybeSingle();
      if (updateError || !updatedApplication) {
        const { error: cleanupError } = await adminClient.storage.from(DOCUMENT_BUCKET).remove(uploadedPaths);
        if (cleanupError) console.error('Unable to remove documents after failed application update:', cleanupError);
        uploadedPaths.length = 0;
        if (updateError && isPendingApplicationConflict(updateError)) {
          return NextResponse.json({ error: PENDING_APPLICATION_MESSAGE }, { status: 409 });
        }
        if (updateError) console.error('Failed to update applicant application:', updateError);
        if (!updateError) {
          return NextResponse.json({ error: 'Someone else already updated this application. Refresh and try again.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'We could not submit your application. Please try again.' }, { status: 500 });
      }
      uploadedPaths.length = 0;
      const { error: oldDocumentsError } = await adminClient.storage
        .from(DOCUMENT_BUCKET)
        .remove(previousDocumentPaths);
      if (oldDocumentsError) console.error('Unable to remove replaced application documents:', oldDocumentsError);
      return NextResponse.json({ success: true, application: updatedApplication });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient.from('ownerapplications') as any)
      .insert(applicationValues)
      .select()
      .single();

    if (error) {
      const { error: cleanupError } = await adminClient.storage.from(DOCUMENT_BUCKET).remove(uploadedPaths);
      if (cleanupError) console.error('Unable to remove application documents after failed insert:', cleanupError);
      if (isPendingApplicationConflict(error)) {
        return NextResponse.json({ error: PENDING_APPLICATION_MESSAGE }, { status: 409 });
      }
      console.error('Failed to submit application:', error);
      return NextResponse.json({ error: 'We could not submit your application. Please try again.' }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: consumedSession, error: consumeError } = await (adminClient.from('livenesssessions') as any)
      .update({ consumedat: new Date().toISOString() })
      .eq('noncehash', nonceHash)
      .eq('status', 'passed')
      .gt('expiresat', new Date().toISOString())
      .is('consumedat', null)
      .select('noncehash')
      .maybeSingle();
    if (consumeError || !consumedSession) {
      console.error('Unable to consume owner application liveness session:', consumeError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (adminClient.from('ownerapplications') as any).delete().eq('id', data.id);
      if (deleteError) console.error('Unable to remove application after liveness session conflict:', deleteError);
      const { error: cleanupError } = await adminClient.storage.from(DOCUMENT_BUCKET).remove(uploadedPaths);
      if (cleanupError) console.error('Unable to remove documents after liveness session conflict:', cleanupError);
      uploadedPaths.length = 0;
      return NextResponse.json({ error: "We couldn't verify you yet. Please try again." }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, application: { id: data.id, status: data.status, livenessstatus: data.livenessstatus } },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('Application submission error:', err);
    if (uploadedPaths.length && adminSupabase) {
      const { error: cleanupError } = await adminSupabase.storage.from(DOCUMENT_BUCKET).remove(uploadedPaths);
      if (cleanupError) console.error('Unable to clean up application documents:', cleanupError);
    }
    return NextResponse.json(
      { error: 'We could not submit your application. Please try again.' },
      { status: 500 }
    );
  }
}
