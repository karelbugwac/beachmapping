import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllBeaches } from '@/lib/db/beaches';
import { haversineDistanceKm } from '@/lib/utils/distance';
import { getValidBeachCoordinates } from '@/lib/utils/beach-coordinates';
import { fetchLiveWeather } from '@/lib/services/weather';
import {
  VERIFIED_BINONGKALAN_KNOWLEDGE_CONTEXT,
  getCommuteKnowledgeContext,
  detectLanguage,
  isRandomOrGibberishInput,
  getBaiRandomInputFallback,
  matchBaiInstantAnswer,
  getBaiApologyFallback,
} from '@/lib/services/baiknowledge';
import {
  scanLiveSystemSnapshot,
  formatSystemScanForAiPrompt,
  scanSystemForDirectAnswer,
  type SystemScanSnapshot,
} from '@/lib/services/scanner';

const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
  'gemini-flash-latest',
].filter(Boolean) as string[];

const GEMINI_TIMEOUT_MS = 120_000; // Allow up to 2 minutes for AI model generation
const MIN_GENERATING_DISPLAY_MS = 1800; // Ensure "Generating an answer... It may take a minute or two to respond" is clearly shown
const CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const globalForGemini = globalThis as unknown as {
  __dagatCachedDbContext?: { text: string; expiresAt: number };
  __dagatWorkingGeminiModel?: string;
  __dagatInvalidApiKeyValue?: string;
};

function resolveGeminiApiKey(): string | null {
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (envKey && envKey !== 'your-gemini-api-key-here') {
    return envKey;
  }

  const candidatePaths = [
    path.join(process.cwd(), '.env.local'),
  ];
  for (const envPath of candidatePaths) {
    try {
      if (!fs.existsSync(/*turbopackIgnore: true*/ envPath)) continue;
      const content = fs.readFileSync(/*turbopackIgnore: true*/ envPath, 'utf8');
      const match = content.match(/^\s*GEMINI_API_KEY\s*=\s*([^\r\n#]+)/m);
      if (match?.[1]) {
        const parsed = match[1].trim().replace(/^['"]|['"]$/g, '');
        if (parsed && parsed !== 'your-gemini-api-key-here') {
          process.env.GEMINI_API_KEY = parsed;
          return parsed;
        }
      }
    } catch {
      // Ignore file read errors
    }
  }
  return null;
}

function getOrderedModelCandidates(): string[] {
  const working = globalForGemini.__dagatWorkingGeminiModel;
  if (!working) return GEMINI_MODEL_CANDIDATES;
  return [working, ...GEMINI_MODEL_CANDIDATES.filter((m) => m !== working)];
}

async function enrichWithLiveWeatherIfNeeded(query: string, baseReply: string): Promise<string> {
  if (
    baseReply.includes('this information is not available') ||
    baseReply.includes('did not understand your message') ||
    !/\b(safe|safety|luwas|weather|panahon|ulan|bagyo|forecast|tide|taob|hunas|bawod|wave|ligtas)\b/i.test(query)
  ) {
    return baseReply;
  }

  try {
    const w = await Promise.race([
      fetchLiveWeather(10.7286, 124.0152),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Weather timeout')), 600)),
    ]);
    const wave = typeof w.waveHeight === 'number' ? ` · Wave: **${w.waveHeight} m**` : '';
    const liveLine = `\n\n📍 **Current Catmon Weather Update:** **${Math.round(w.temperature)}°C (${w.conditionLabel})** · Wind: **${Math.round(w.windSpeed)} km/h**${wave}`;
    return `${baseReply}${liveLine}`;
  } catch {
    return baseReply;
  }
}

async function getScannedDatabaseContext(
  userLocation?: { lat: number; lng: number } | null
): Promise<{ contextText: string; snapshot: SystemScanSnapshot }> {
  const commuteContext = getCommuteKnowledgeContext();
  const snapshot = await scanLiveSystemSnapshot();
  const liveScanText = formatSystemScanForAiPrompt(snapshot, userLocation);
  const contextText = `${VERIFIED_BINONGKALAN_KNOWLEDGE_CONTEXT}\n\n---\n\nVERIFIED COMMUTE ROUTES & TRAVEL TIMES:\n${commuteContext}\n\n---\n\n${liveScanText}`;
  return { contextText, snapshot };
}

function convertMarkdownTablesToBullets(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let inTable = false;
  let skippedHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTableRow = /^\|.+\|$/.test(line);
    const isSeparatorRow = /^\|[\s:-]+(?:\|[\s:-]+)+\|?$/.test(line);

    if (isSeparatorRow) {
      inTable = true;
      skippedHeader = true;
      continue;
    }

    if (isTableRow) {
      // Check if next line is a separator row (meaning this line is the table header)
      const nextLine = (lines[i + 1] || '').trim();
      if (/^\|[\s:-]+(?:\|[\s:-]+)+\|?$/.test(nextLine)) {
        inTable = true;
        skippedHeader = false;
        continue;
      }

      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);

      if (cells.length >= 2) {
        const first = cells[0].startsWith('**') ? cells[0] : `**${cells[0]}**`;
        out.push(`• ${first}: ${cells.slice(1).join(' — ')}`);
      } else if (cells.length === 1) {
        out.push(`• ${cells[0]}`);
      }
      inTable = true;
      continue;
    }

    if (inTable && !line) {
      inTable = false;
      skippedHeader = false;
    }
    out.push(lines[i]);
  }

  return out.join('\n');
}

function formatReadableAiResponse(text: string): string {
  return convertMarkdownTablesToBullets(text.replace(/\r\n/g, '\n'))
    .replace(/^#{1,6}\s+(.+)$/gm, '**$1**')
    .replace(/^[ \t]*[-*][ \t]+/gm, '• ')
    .replace(/^\s*---+\s*$/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildSystemInstruction(
  databaseContext: string,
  userName?: string | null,
  detectedLang: 'ceb' | 'tl' | 'en' = 'en'
): string {
  const languageDirective =
    detectedLang === 'ceb'
      ? 'STRICT LANGUAGE DIRECTIVE FOR THIS TURN: The user wrote their question in BISAYA / CEBUANO. You MUST answer 100% in natural, clear, everyday Bisaya / Cebuano.'
      : detectedLang === 'tl'
        ? 'STRICT LANGUAGE DIRECTIVE FOR THIS TURN: The user wrote their question in TAGALOG. You MUST answer 100% in natural, clear Tagalog.'
        : 'STRICT LANGUAGE DIRECTIVE FOR THIS TURN: The user wrote their question in ENGLISH. You MUST answer 100% in clear, natural English (translate any Bisaya terms like "batoon", "sugbaanan", "taob/hunas", or "dali molawm" into plain English instead of leaving untranslated Bisaya words).';

  return [
    'You are Bai, local guide for Dagat Ta Bai in Barangay Binongkalan, Catmon, Cebu. If asked what your name is or who you are, answer that you are "Bai, local guide".',
    languageDirective,
    'CLARITY & EASY-TO-UNDERSTAND RULES (VERY IMPORTANT):',
    '• Direct Answer First: Always answer the user’s exact question in the very first 1–2 sentences so they get the point immediately.',
    '• Plain Human Language: Never dump raw database text, pipe-separated values (like "20|30"), JSON, or internal slugs. Always explain prices, hours, and conditions in simple, everyday words.',
    '• Short & Scannable: Keep answers concise and well-structured. Use short paragraphs and simple "•" bullet points when listing items, tips, or beaches. NEVER use markdown tables ("| ... |"), "#" headings, or long walls of text.',
    '• Clickable Links: When referring to a website page or beach profile, NEVER show raw paths or file directories like "(/map)" or "(/beaches)" in parentheses. Instead, make the page or beach name itself a clean clickable markdown link such as [Interactive Map](/map), [Beaches Directory](/beaches), [Weather & Tides](/weather), [Beach Owner Application](/apply), or [Lite Bay Resort](/beaches/litebay-resort) (never invent external domains like dagattabai.com).',
    '• Always Name the Beach Clearly: When answering about a beach or comparing options, clearly state the beach name (**Rañola Beach**, **Lite Bay Resort**, **Majestique View Resort**, or **Hinagdan Beach**) so there is zero confusion.',
    '• End with a Helpful Next Step (Optional): If helpful, finish with one short follow-up question (for example, asking where they are commuting from).',
    'SOURCES & AI FORMULATION (SYSTEM + DATABASE + GEMINI AI): Formulate your answers clearly based on: (1) our Dagat Ta Bai System website pages, features, commute routes, and platform policies, (2) our live Supabase Database records (beaches, cottages, facilities, ratings, reviews, rules, posts, real-time open/closed status, weather, and tides), and (3) your Gemini AI reasoning. You CAN and SHOULD answer questions about the Dagat Ta Bai website itself (e.g., how the map works, accounts/login, reviews, owner applications, weather/tides page, contact/feedback, privacy/terms, and team) as well as the 4 verified beaches in Barangay Binongkalan, Catmon, Cebu (never call Hinagdan Beach "Hinagdan 1", and never mention Turtle Point Beach) and commute routes. Never invent prices, amenities, or unverified beaches.',
    'STRICT TOPIC SCOPE (NEVER ANSWER OFF-TOPIC QUESTIONS): You are ONLY a local guide for Dagat Ta Bai in Barangay Binongkalan, Catmon, Cebu. If the user asks ANY off-topic or general knowledge question unrelated to Dagat Ta Bai, the 4 verified beaches, Cebu/Catmon beach trips, commuting/directions, weather/tides, or the Dagat Ta Bai website (for example: world geography like "What is the largest country in the world?", math, coding, science, history, celebrities, news, or general trivia), DO NOT answer the off-topic question at all. Politely decline in the user’s language, explain that you are Bai, local guide for Dagat Ta Bai and can only help with Barangay Binongkalan beaches, commute directions, weather & tides, or the Dagat Ta Bai website, and invite them to ask a beach-related question instead.',
    'CONVERSATIONAL CONTEXT: Be warm, natural, and helpful for in-scope questions. Pay close attention to conversation history so in-scope follow-up questions ("it", "there", "the first one", "what about the second one?", "why?") are resolved accurately.',
    `The signed-in user's display name is ${userName ? JSON.stringify(userName) : 'not available'}.`,
    `SYSTEM & DATABASE RECORDS:\n${databaseContext}`,
  ].join('\n\n');
}

function buildConversationContents(
  conversationHistory: { role: 'user' | 'assistant'; text: string }[],
  cleanQuery: string
) {
  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  for (const entry of conversationHistory.slice(-10)) {
    const text = entry.text?.trim().slice(0, 1500);
    if (!text) continue;
    const role = entry.role === 'assistant' ? 'model' : 'user';
    if (contents.length === 0 && role === 'model') continue;
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n${text}`;
    } else {
      contents.push({ role, parts: [{ text }] });
    }
  }
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n${cleanQuery}`;
  } else {
    contents.push({ role: 'user', parts: [{ text: cleanQuery }] });
  }
  return contents;
}

/**
 * Supports Vertex AI Express Mode API keys (starting with "AQ.") via the Vertex REST endpoint,
 * as well as standard Google AI Studio keys ("AIza...").
 */
async function callVertexOrRestGenerateContent(
  apiKey: string,
  modelName: string,
  systemInstruction: string,
  contents: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<{ text: string | null; authFailed: boolean }> {
  const endpoints = apiKey.startsWith('AQ.')
    ? [
      `https://aiplatform.googleapis.com/v1/publishers/google/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
      `https://aiplatform.googleapis.com/v1beta1/publishers/google/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
    ]
    : [
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
    ];

  const groundedContents = [
    {
      role: 'user' as const,
      parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemInstruction}` }],
    },
    {
      role: 'model' as const,
      parts: [
        {
          text: 'Understood! I am Bai, local guide for Dagat Ta Bai in Barangay Binongkalan, Catmon, Cebu. I will answer questions about our 4 verified beaches, commute routes, weather & tides, and the Dagat Ta Bai website, and I will politely decline any unrelated or general-knowledge questions.',
        },
      ],
    },
    ...contents,
  ];

  let sawAuthError = false;
  for (const url of endpoints) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: groundedContents,
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 700,
          },
        }),
      });
      clearTimeout(timer);

      if (response.status === 401 || response.status === 403 || response.status === 400) {
        const errBody = await response.text().catch(() => '');
        if (/API_KEY_INVALID|API key not valid|PERMISSION_DENIED|UNAUTHENTICATED|BILLING_DISABLED/i.test(errBody)) {
          sawAuthError = true;
          break;
        }
        continue;
      }
      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        const combined = parts.map((p: { text?: string }) => p.text || '').join('').trim();
        if (combined) {
          return { text: combined, authFailed: false };
        }
      }
    } catch {
      clearTimeout(timer);
    }
  }

  return { text: null, authFailed: sawAuthError };
}

/**
 * Automatic zero-key conversational AI fallback (OpenAI-compatible LLM endpoint)
 * so Bai still converses like a real AI chatbot even if GEMINI_API_KEY in .env.local is expired or unauthorized.
 */
async function callConversationalLlmFallback(
  systemInstruction: string,
  conversationHistory: { role: 'user' | 'assistant'; text: string }[],
  cleanQuery: string
): Promise<string | null> {
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemInstruction },
  ];

  for (const entry of conversationHistory.slice(-10)) {
    const text = entry.text?.trim().slice(0, 600);
    if (!text) continue;
    messages.push({
      role: entry.role === 'assistant' ? 'assistant' : 'user',
      content: text,
    });
  }
  messages.push({ role: 'user', content: cleanQuery });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35_000);
  try {
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'openai',
        temperature: 0.45,
        messages,
      }),
    });
    clearTimeout(timer);

    if (!response.ok) return null;
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (reply && reply.length > 0) {
      return reply;
    }
  } catch {
    clearTimeout(timer);
  }
  return null;
}

export async function askGeminiAssistant(
  userQuery: string,
  userLocation?: { lat: number; lng: number } | null,
  conversationHistory: { role: 'user' | 'assistant'; text: string }[] = [],
  userName?: string | null
): Promise<string> {
  const cleanQuery = userQuery.trim().slice(0, 500);
  if (!cleanQuery) return 'Please ask a question about the beaches or commute in Barangay Binongkalan.';

  if (isRandomOrGibberishInput(cleanQuery)) {
    return getBaiRandomInputFallback(cleanQuery, userName);
  }

  const detectedLang = detectLanguage(cleanQuery);
  const { contextText: databaseContext, snapshot } = await getScannedDatabaseContext(userLocation);
  const systemInstruction = buildSystemInstruction(databaseContext, userName, detectedLang);
  const contents = buildConversationContents(conversationHistory, cleanQuery);

  // 1. Primary: Conversational Gemini AI strictly grounded on scanned system beaches & commute
  const apiKey = resolveGeminiApiKey();
  if (apiKey && globalForGemini.__dagatInvalidApiKeyValue !== apiKey) {
    for (const modelName of getOrderedModelCandidates()) {
      const { text, authFailed } = await callVertexOrRestGenerateContent(
        apiKey,
        modelName,
        systemInstruction,
        contents
      );
      if (text) {
        globalForGemini.__dagatWorkingGeminiModel = modelName;
        return enrichWithLiveWeatherIfNeeded(cleanQuery, formatReadableAiResponse(text));
      }
      if (authFailed) {
        globalForGemini.__dagatInvalidApiKeyValue = apiKey;
        break;
      }
    }
  }

  // 2. Secondary Conversational AI LLM (if Gemini API key is unauthorized/expired)
  const llmReply = await callConversationalLlmFallback(
    systemInstruction,
    conversationHistory,
    cleanQuery
  );
  if (llmReply) {
    return enrichWithLiveWeatherIfNeeded(cleanQuery, formatReadableAiResponse(llmReply));
  }

  // 3. Offline System Scan & Verified Knowledge Engine Fallback
  const scannedAnswer = scanSystemForDirectAnswer(cleanQuery, snapshot, conversationHistory);
  if (scannedAnswer) {
    return enrichWithLiveWeatherIfNeeded(cleanQuery, scannedAnswer);
  }

  const verifiedSpecificAnswer = matchBaiInstantAnswer(cleanQuery, userName, conversationHistory);
  if (verifiedSpecificAnswer) {
    return enrichWithLiveWeatherIfNeeded(cleanQuery, verifiedSpecificAnswer);
  }

  return getBaiApologyFallback(cleanQuery, userName);
}

export async function askGeminiAssistantStream(
  userQuery: string,
  userLocation?: { lat: number; lng: number } | null,
  conversationHistory: { role: 'user' | 'assistant'; text: string }[] = [],
  userName?: string | null
): Promise<AsyncGenerator<{ text: () => string }, void, unknown>> {
  const startedAt = Date.now();
  const cleanQuery = userQuery.trim().slice(0, 500);

  async function* streamTextNaturally(fullText: string): AsyncGenerator<{ text: () => string }, void, unknown> {
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_GENERATING_DISPLAY_MS) {
      await new Promise((r) => setTimeout(r, MIN_GENERATING_DISPLAY_MS - elapsed));
    }

    // Stream smoothly in natural multi-word chunks so it types like ChatGPT / Gemini
    const tokens = fullText.split(/(\s+)/);
    let buffer = '';
    for (let i = 0; i < tokens.length; i++) {
      buffer += tokens[i];
      if (buffer.length >= 18 || i === tokens.length - 1) {
        const chunkToYield = buffer;
        buffer = '';
        yield { text: () => chunkToYield };
        if (i < tokens.length - 1) {
          await new Promise((r) => setTimeout(r, 18));
        }
      }
    }
  }

  async function* streamWithGeneratingState(): AsyncGenerator<{ text: () => string }, void, unknown> {
    if (!cleanQuery) {
      yield { text: () => 'Please ask a question about the beaches or commute in Barangay Binongkalan.' };
      return;
    }

    if (isRandomOrGibberishInput(cleanQuery)) {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_GENERATING_DISPLAY_MS) {
        await new Promise((r) => setTimeout(r, MIN_GENERATING_DISPLAY_MS - elapsed));
      }
      yield { text: () => getBaiRandomInputFallback(cleanQuery, userName) };
      return;
    }

    const detectedLang = detectLanguage(cleanQuery);
    const { contextText: databaseContext, snapshot } = await getScannedDatabaseContext(userLocation);
    const systemInstruction = buildSystemInstruction(databaseContext, userName, detectedLang);
    const contents = buildConversationContents(conversationHistory, cleanQuery);

    // 1. Primary: Stream from conversational Gemini AI strictly grounded on system beaches & commute
    const apiKey = resolveGeminiApiKey();
    if (apiKey && globalForGemini.__dagatInvalidApiKeyValue !== apiKey) {
      if (!apiKey.startsWith('AQ.')) {
        const genAI = new GoogleGenerativeAI(apiKey);
        for (const modelName of getOrderedModelCandidates()) {
          let yieldedAny = false;
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              systemInstruction,
              generationConfig: { temperature: 0.45, maxOutputTokens: 700 },
            });

            const result = await Promise.race([
              model.generateContentStream({ contents }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Gemini stream timeout')), GEMINI_TIMEOUT_MS)
              ),
            ]);

            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              if (chunkText) {
                if (!yieldedAny) {
                  const elapsed = Date.now() - startedAt;
                  if (elapsed < MIN_GENERATING_DISPLAY_MS) {
                    await new Promise((r) => setTimeout(r, MIN_GENERATING_DISPLAY_MS - elapsed));
                  }
                }
                yieldedAny = true;
                yield { text: () => chunkText };
              }
            }

            if (yieldedAny) {
              globalForGemini.__dagatWorkingGeminiModel = modelName;
              return;
            }
          } catch (err: unknown) {
            if (yieldedAny) return;
            const errMsg = err instanceof Error ? err.message : String(err);
            if (/API_KEY_INVALID|API key not valid|401|403/i.test(errMsg)) {
              globalForGemini.__dagatInvalidApiKeyValue = apiKey;
              break;
            }
          }
        }
      } else {
        // Vertex AI Express Mode key ("AQ....") or fallback REST generation
        for (const modelName of getOrderedModelCandidates()) {
          const { text, authFailed } = await callVertexOrRestGenerateContent(
            apiKey,
            modelName,
            systemInstruction,
            contents
          );
          if (text) {
            globalForGemini.__dagatWorkingGeminiModel = modelName;
            const enriched = await enrichWithLiveWeatherIfNeeded(cleanQuery, formatReadableAiResponse(text));
            yield* streamTextNaturally(enriched);
            return;
          }
          if (authFailed) {
            globalForGemini.__dagatInvalidApiKeyValue = apiKey;
            break;
          }
        }
      }
    }

    // 2. Secondary Conversational AI LLM (when GEMINI_API_KEY in .env.local is expired/unauthorized)
    const llmReply = await callConversationalLlmFallback(
      systemInstruction,
      conversationHistory,
      cleanQuery
    );
    if (llmReply) {
      const enriched = await enrichWithLiveWeatherIfNeeded(cleanQuery, formatReadableAiResponse(llmReply));
      yield* streamTextNaturally(enriched);
      return;
    }

    // 3. Offline System Scan & Verified Knowledge Engine Fallback streamed naturally
    const scannedAnswer = scanSystemForDirectAnswer(cleanQuery, snapshot, conversationHistory);
    if (scannedAnswer) {
      const enriched = await enrichWithLiveWeatherIfNeeded(cleanQuery, scannedAnswer);
      yield* streamTextNaturally(enriched);
      return;
    }

    const verifiedSpecificAnswer = matchBaiInstantAnswer(cleanQuery, userName, conversationHistory);
    if (verifiedSpecificAnswer) {
      const enriched = await enrichWithLiveWeatherIfNeeded(cleanQuery, verifiedSpecificAnswer);
      yield* streamTextNaturally(enriched);
      return;
    }

    yield* streamTextNaturally(getBaiApologyFallback(cleanQuery, userName));
  }

  return streamWithGeneratingState();
}
