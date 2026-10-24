import { NextRequest } from 'next/server';
import { askGeminiAssistantStream } from '@/lib/services/gemini';
import { getCurrentSession } from '@/lib/db/auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message;
    const userLocation =
      body.userLocation &&
      typeof body.userLocation.lat === 'number' &&
      typeof body.userLocation.lng === 'number'
        ? { lat: body.userLocation.lat, lng: body.userLocation.lng }
        : undefined;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message content is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await getCurrentSession();
    let history: { role: 'user' | 'assistant'; text: string }[] = [];
    const adminClient = user ? createAdminClient() : null;
    if (user && adminClient) {
      const { data: previousMessages, error } = await (adminClient.from('ai_chat_messages') as any)
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      history = (previousMessages || []).reverse().map((entry: any) => ({ role: entry.role, text: entry.content }));
    }

    const stream = await askGeminiAssistantStream(message, userLocation, history, user?.full_name);

    // Collect the full response for saving to database
    let fullReply = '';
    const encoder = new TextEncoder();
    
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text();
            fullReply += text;
            controller.enqueue(encoder.encode(text));
          }
          
          // Save to database after stream completes
          if (user && adminClient && fullReply) {
            await (adminClient.from('ai_chat_messages') as any).insert([
              { user_id: user.id, role: 'user', content: message.trim().slice(0, 500) },
              { user_id: user.id, role: 'assistant', content: fullReply.slice(0, 8000) },
            ]);
          }
          
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('API assistant error:', msg);
    return new Response(JSON.stringify({ error: 'Failed to process assistant request.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
