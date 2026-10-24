import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { authorizeRoles } from '@/lib/supabase/authorization';

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

    const storage = adminSupabase.storage.from('owner-application-documents');
    const [permitResult, ownershipResult] = await Promise.all([
      data.business_permit_path
        ? storage.createSignedUrl(data.business_permit_path, 300)
        : Promise.resolve({ data: null, error: null }),
      data.proof_of_ownership_path
        ? storage.createSignedUrl(data.proof_of_ownership_path, 300)
        : Promise.resolve({ data: null, error: null }),
    ]);

    return NextResponse.json(
      {
        application: {
          ...data,
          business_permit_url: permitResult.data?.signedUrl || null,
          proof_of_ownership_url: ownershipResult.data?.signedUrl || null,
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
