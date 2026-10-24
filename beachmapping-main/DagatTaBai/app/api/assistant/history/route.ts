import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/db/auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const user = await getCurrentSession();
  if (!user) return NextResponse.json({ signedIn: false, messages: [] }, { headers: { 'Cache-Control': 'no-store' } });

  try {
    const adminClient = createAdminClient();
    const { data, error } = await (adminClient.from('ai_chat_messages') as any)
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ signedIn: true, messages: (data || []).reverse() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not load conversation history.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getCurrentSession();
  if (!user) return NextResponse.json({ error: 'Sign in to manage saved chat history.' }, { status: 401 });

  try {
    const adminClient = createAdminClient();
    const { error } = await (adminClient.from('ai_chat_messages') as any)
      .delete()
      .eq('user_id', user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not delete conversation history.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}