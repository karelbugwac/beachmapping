import { NextRequest } from 'next/server';
import { askGeminiAssistantStream } from '@/lib/services/gemini';
import { matchBaiInstantAnswer, getBaiApologyFallback } from '@/lib/services/baiKnowledgeBase';
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

    // Use client-supplied history immediately so we don't block on database roundtrips before replying
    const history: { role: 'user' | 'assistant'; text: string }[] = Array.isArray(body.history)
      ? body.history
          .slice(-10)
          .filter(
            (entry: any) =>
              entry && (entry.role === 'user' || entry.role === 'assistant') && typeof entry.text === 'string'
          )
          .map((entry: any) => ({ role: entry.role, text: entry.text.slice(0, 500) }))
      : [];

    // Fetch session in parallel for optional history persistence
    const sessionPromise = getCurrentSession().catch(() => null);

    const stream = await askGeminiAssistantStream(message, userLocation, history, null);

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
        } catch {
          if (!fullReply) {
            const fallback =
              matchBaiInstantAnswer(message, null, history) ||
              getBaiApologyFallback(message, null);
            fullReply = fallback;
            controller.enqueue(encoder.encode(fallback));
          }
        } finally {
          controller.close();
          // Save to database asynchronously after stream completes so the user never waits
          if (fullReply) {
            sessionPromise
              .then(async (user) => {
                if (!user) return;
                const adminClient = createAdminClient();
                await (adminClient.from('ai_chat_messages') as any).insert([
                  { user_id: user.id, role: 'user', content: message.trim().slice(0, 500) },
                  { user_id: user.id, role: 'assistant', content: fullReply.slice(0, 8000) },
                ]);
              })
              .catch(() => {
                // Non-blocking history save
              });
          }
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
