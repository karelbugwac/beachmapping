'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Send,
  Trash2,
} from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import {
  BAI_SUGGESTED_QUESTIONS,
  getContextualBranchQuestions,
  matchBaiInstantAnswer,
  getBaiApologyFallback,
} from '@/lib/services/baiKnowledgeBase';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const LINK_TOKEN_REGEX =
  /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)|(https?:\/\/[^\s<>()]+(?:\([^\s<>()]*\)[^\s<>()]*)*)|((?<![a-zA-Z0-9:/._-])\/(?:beaches|map|weather|login|register|apply|profile|faq|contact|feedback|about|owner-requirements|community-guidelines|privacy|terms)(?:\/[a-zA-Z0-9\-_%]+)*(?:\?[^\s),.!?;:]*)?)/g;

function normalizeInternalOrExternalUrl(rawUrl: string): { href: string; isInternal: boolean } {
  const trimmed = rawUrl.trim().replace(/[.,!?;:]+$/, '');
  const dagatDomainMatch = trimmed.match(/^https?:\/\/(?:www\.)?dagattabai\.com(\/.*)?$/i);
  if (dagatDomainMatch) {
    return { href: dagatDomainMatch[1] || '/', isInternal: true };
  }
  if (trimmed.startsWith('/')) {
    return { href: trimmed, isInternal: true };
  }
  return { href: trimmed, isInternal: false };
}

function renderInlineLinks(text: string, isUser: boolean, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(LINK_TOKEN_REGEX.source, 'g');
  const linkClass = isUser
    ? 'underline underline-offset-2 font-semibold text-blue-100 hover:text-white break-words'
    : 'underline underline-offset-2 font-semibold text-[#1F3F74] dark:text-[#60A5FA] hover:opacity-80 break-words';

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index).replace(/\*/g, ''));
    }

    const mdLabel = match[1];
    const mdUrl = match[2];
    const bareExternal = match[3];
    const bareInternal = match[4];

    if (mdLabel && mdUrl) {
      const { href, isInternal } = normalizeInternalOrExternalUrl(mdUrl);
      nodes.push(
        isInternal ? (
          <Link key={`${keyPrefix}-${match.index}`} href={href} className={linkClass}>
            {mdLabel.replace(/\*/g, '')}
          </Link>
        ) : (
          <a
            key={`${keyPrefix}-${match.index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {mdLabel.replace(/\*/g, '')}
          </a>
        )
      );
    } else if (bareExternal) {
      const cleanExternal = bareExternal.replace(/[.,!?;:)]+$/, '');
      const trailing = bareExternal.slice(cleanExternal.length);
      const { href, isInternal } = normalizeInternalOrExternalUrl(cleanExternal);
      nodes.push(
        isInternal ? (
          <Link key={`${keyPrefix}-${match.index}`} href={href} className={linkClass}>
            {href}
          </Link>
        ) : (
          <a
            key={`${keyPrefix}-${match.index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {cleanExternal}
          </a>
        )
      );
      if (trailing) nodes.push(trailing);
    } else if (bareInternal) {
      nodes.push(
        <Link key={`${keyPrefix}-${match.index}`} href={bareInternal} className={linkClass}>
          {bareInternal}
        </Link>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex).replace(/\*/g, ''));
  }

  return nodes;
}

function convertMarkdownTablesToBullets(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTableRow = /^\|.+\|$/.test(line);
    const isSeparatorRow = /^\|[\s:-]+(?:\|[\s:-]+)+\|?$/.test(line);

    if (isSeparatorRow) {
      continue;
    }

    if (isTableRow) {
      const nextLine = (lines[i + 1] || '').trim();
      if (/^\|[\s:-]+(?:\|[\s:-]+)+\|?$/.test(nextLine)) {
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
      continue;
    }

    out.push(lines[i]);
  }

  return out.join('\n');
}

function renderFormattedText(text: string, isUser = false) {
  // Convert markdown tables, headings (### Title), bullets (* or -), and backticks into clean readable text while keeping **bold** and clickable links.
  const cleaned = convertMarkdownTablesToBullets(text)
    .replace(/^#{1,6}\s+(.+)$/gm, '**$1**')
    .replace(/^[ \t]*[-*][ \t]+/gm, '• ')
    .replace(/`([^`]+)`/g, '$1');
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold">
          {renderInlineLinks(inner, isUser, `b-${idx}`)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{renderInlineLinks(part, isUser, `t-${idx}`)}</React.Fragment>;
  });
}

export function AiChatWidget() {
  const pathname = usePathname();
  const isPortal = pathname?.startsWith('/admin') || pathname?.startsWith('/owner') || pathname?.startsWith('/staff') || pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password';
  const isMap = pathname === '/map' || pathname?.startsWith('/map');

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyLoadedRef = useRef(false);

  // Check auth session on mount and listen to auth events
  useEffect(() => {
    const checkAuth = () => {
      fetch('/api/auth/session', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setSignedIn(Boolean(data?.user));
        })
        .catch(() => setSignedIn(false));
    };

    checkAuth();
    window.addEventListener('dtb_login_completed', checkAuth);
    return () => window.removeEventListener('dtb_login_completed', checkAuth);
  }, []);

  // Lazy-load history only when the chat widget is actually opened
  useEffect(() => {
    if (isPortal || isMap || !isOpen || historyLoadedRef.current) return;
    historyLoadedRef.current = true;
    fetch('/api/assistant/history', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load chat history.');
        setSignedIn(Boolean(data.signedIn));
        if (Array.isArray(data.messages) && data.messages.length) {
          setMessages(data.messages.map((message: { id: string; role: 'user' | 'assistant'; content: string; created_at: string }) => ({
            id: message.id,
            sender: message.role,
            text: message.content,
            timestamp: new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })));
        }
      })
      .catch(() => {
        historyLoadedRef.current = false;
      });
  }, [isPortal, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  // Support opening chat from anywhere via custom event
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.prompt) {
        setInput(customEvent.detail.prompt);
      }
    };

    window.addEventListener('open-bai-chat', handleOpenChat);
    return () => window.removeEventListener('open-bai-chat', handleOpenChat);
  }, []);

  const submitQuestion = async (questionText: string) => {
    if (!signedIn) {
      showToast('Please sign in to chat with Bai.', 'error');
      window.location.href = '/login';
      return;
    }
    if (!questionText.trim() || loading) return;

    const recentHistory = messages
      .filter((m) => m.text.trim().length > 0)
      .slice(-8)
      .map((m) => ({ role: m.sender, text: m.text }));

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: questionText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Create placeholder for streaming response
    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        sender: 'assistant',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          history: recentHistory,
        }),
      });

      if (res.status === 429) {
        const rateLimitMsg =
          (await res.text()) ||
          'Sorry, you are sending messages too quickly. Please wait a moment and try again.';
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, text: rateLimitMsg } : msg))
        );
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Assistant request failed.');
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, text: accumulatedText }
                : msg
            )
          );
        }
      }
    } catch {
      const localFallback =
        matchBaiInstantAnswer(userMsg.text, null, recentHistory) ||
        getBaiApologyFallback(userMsg.text, null);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: localFallback,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitQuestion(input);
  };

  const handleClearHistory = async () => {
    try {
      const response = await fetch('/api/assistant/history', { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete history.');
      setMessages([]);
      showToast('Chat history deleted.', 'destructive');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not delete chat history.', 'error');
    }
  };

  if (isPortal || isMap) return null;

  // Filter messages so that empty assistant placeholders don't show an empty chat bubble
  const visibleMessages = messages.filter(
    (msg) => msg.sender === 'user' || (msg.sender === 'assistant' && msg.text.trim().length > 0)
  );
  const hasUserMessages = visibleMessages.some((msg) => msg.sender === 'user');
  const hasWelcomeMessage = messages.some((msg) => msg.id === 'welcome-1');

  // Check if AI is thinking before first text chunk arrives
  const isThinking =
    loading &&
    (!messages.length ||
      messages[messages.length - 1].sender === 'user' ||
      !messages[messages.length - 1].text.trim());

  // Compute contextual follow-up / branch questions after the latest assistant response
  let branchQuestions: { label: string; question: string }[] = [];
  if (!loading && visibleMessages.length >= 2) {
    const lastMsg = visibleMessages[visibleMessages.length - 1];
    const prevUserMsg = [...visibleMessages].reverse().find((m) => m.sender === 'user');
    if (lastMsg.sender === 'assistant' && prevUserMsg) {
      branchQuestions = getContextualBranchQuestions(prevUserMsg.text, lastMsg.text);
    }
  }

  return (
    <div className="fixed z-[60] bottom-2 right-2 sm:bottom-4 sm:right-4 transition-all duration-300">
      {/* Minimized Floating Trigger Button with live beacon */}
      {!isOpen && (
        <div className="relative group">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative w-12 h-12 sm:w-16 sm:h-16 bg-transparent border-0 p-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 shadow-none cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 animate-float-slow select-none flex items-center justify-center"
            aria-label="Open Bai AI Guide"
          >
            <Image
              src="/images/bai.png"
              alt="Bai AI Guide - Click to chat"
              width={64}
              height={64}
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-[0_4px_12px_rgba(31,63,116,0.25)] dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_8px_18px_rgba(31,63,116,0.35)] transition-all duration-300 pointer-events-none"
            />
            {/* Live emerald beacon indicator */}
            <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 flex h-2.5 sm:h-3 w-2.5 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 sm:h-3 w-2.5 sm:w-3 bg-emerald-500 ring-2 ring-white dark:ring-black"></span>
            </span>
          </button>
        </div>
      )}

      {/* Minimized & Responsive conversation panel (Fits mobile & desktop elegantly) */}
      {isOpen && (
        <section
          aria-label="Chat with Bai"
          className="flex h-[min(520px,calc(100dvh-5rem))] max-h-[calc(100dvh-4rem)] w-[min(340px,calc(100vw-1.5rem))] sm:h-[min(520px,calc(100dvh-6rem))] sm:w-[350px] sm:max-h-[75vh] flex-col overflow-hidden border border-slate-200 bg-white font-display shadow-[0_20px_50px_-15px_rgba(15,23,42,0.4)] animate-in fade-in slide-in-from-bottom-2 duration-200 dark:border-neutral-800 dark:bg-brand-navy-900"
        >
          {/* Branded compact header - only show if signed in */}
          {signedIn && (
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-brand-navy-500 px-3.5 py-2.5 text-white dark:bg-brand-navy-800 sm:px-4 sm:py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <Image
                  src="/images/bai.png"
                  alt="Bai"
                  width={28}
                  height={28}
                  className="w-7 h-7 shrink-0 object-contain"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display text-xs sm:text-sm font-bold leading-tight tracking-tight text-white">Bai</h3>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${loading ? 'animate-ping bg-amber-300' : 'bg-emerald-400'}`}
                      aria-label="Online"
                    />
                    <span className="text-[9px] sm:text-[10px] font-medium leading-tight text-brand-navy-100/90">
                      {loading ? 'Generating answer...' : 'Local Guide'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => void handleClearHistory()}
                  disabled={!signedIn}
                  className="flex h-7 w-7 items-center justify-center text-brand-navy-100/80 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Delete saved chat history"
                  title={signedIn ? 'Delete your saved chat history' : 'Sign in to save or delete history'}
                >
                  <Trash2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-7 w-7 items-center justify-center text-brand-navy-100/80 transition-colors hover:bg-white/15 hover:text-white"
                  aria-label="Close Chat"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Conversation stream */}
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            className="flex-1 space-y-3 overflow-y-auto bg-white px-3 py-3 text-xs dark:bg-brand-navy-900 sm:px-3.5 relative"
          >
            {/* Close button for non-signed-in users */}
            {!signedIn && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close Chat"
              >
                <X size={15} />
              </button>
            )}

            {!signedIn && visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-5 text-center px-4">
                <Image
                  src="/images/bai.png"
                  alt="Bai AI Guide"
                  width={100}
                  height={100}
                  className="w-24 h-24 object-contain"
                />
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Sign in to talk with Bai
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-[220px]">
                    Get answers about beaches, directions, and local tips
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-black text-xs font-bold shadow-md transition-all hover:scale-105 cursor-pointer"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            ) : (
              visibleMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex min-w-0 items-end gap-1.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <Image
                      src="/images/bai.png"
                      alt=""
                      width={24}
                      height={24}
                      className="mb-4 w-6 h-6 shrink-0 object-contain"
                    />
                  )}
                  <div
                    className={`max-w-[85%] min-w-0 space-y-1 px-3 py-2 shadow-2xs sm:max-w-[82%] ${
                      msg.sender === 'user'
                        ? 'border border-brand-navy-700 bg-brand-navy-500 text-white dark:bg-brand-navy-500'
                        : 'border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-brand-navy-800 dark:text-slate-100'
                    }`}
                  >
                    <p className="break-words whitespace-pre-line leading-relaxed [overflow-wrap:anywhere] text-[11px] sm:text-xs">
                      {renderFormattedText(msg.text, msg.sender === 'user')}
                    </p>
                    <span
                      className={`block text-right text-[9px] font-medium ${
                        msg.sender === 'user' ? 'text-brand-navy-200/80' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}

            {signedIn && !hasUserMessages && !loading && (
              <div className="ml-7 space-y-1.5 pt-0.5">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Try asking</p>
                <div className="flex flex-wrap gap-1.5">
                  {BAI_SUGGESTED_QUESTIONS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => void submitQuestion(item.question)}
                      className="border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-brand-navy-500 transition-colors hover:border-brand-navy-500/40 hover:bg-brand-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 dark:border-slate-700 dark:bg-brand-navy-800 dark:text-brand-navy-200 dark:hover:bg-brand-navy-800 dark:focus-visible:ring-brand-teal-400"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contextual Follow-Up / Branch Questions right below the latest answer */}
            {branchQuestions.length > 0 && (
              <div className="ml-7 space-y-1.5 pt-0.5">
                <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Keep exploring
                </span>
                <div className="flex flex-wrap gap-1">
                  {branchQuestions.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      disabled={loading}
                      onClick={() => void submitQuestion(item.question)}
                      className="border border-brand-navy-200/80 bg-brand-navy-50/80 px-2.5 py-1 text-[10px] font-medium text-brand-navy-500 transition-colors hover:bg-brand-navy-500 hover:text-white dark:border-brand-navy-900/60 dark:bg-brand-navy-800 dark:text-brand-navy-200 dark:hover:bg-brand-navy-500 dark:hover:text-white"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isThinking && (
              <div className="flex items-end gap-1.5 justify-start" aria-label="Bai is generating an answer">
                <Image
                  src="/images/bai.png"
                  alt=""
                  width={24}
                  height={24}
                  className="mb-1 h-6 w-6 shrink-0 object-contain"
                />
                <div className="inline-flex flex-col gap-1 border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-brand-navy-800">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-navy-500 dark:bg-brand-teal-400" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-navy-500 [animation-delay:0.2s] dark:bg-brand-teal-400" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-navy-500 [animation-delay:0.4s] dark:bg-brand-teal-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-brand-navy-500 dark:text-blue-200">
                      Generating an answer...
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    It may take a minute or two to respond.
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Compact docked message composer */}
          {signedIn && (
            <form
              onSubmit={handleSend}
              className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-[#0c1424] sm:p-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder={loading ? 'Generating answer, please wait...' : 'Ask Bai anything...'}
                aria-label="Message Bai"
                className="min-w-0 flex-1 border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 transition focus:border-[#1F3F74] focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-[#132035] dark:text-slate-100 dark:focus:border-[#4987BA] dark:focus:ring-[#4987BA]/20"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#1F3F74] text-white shadow-xs transition hover:bg-[#16305a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-[#0c1424]"
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </form>
          )}

        </section>
      )}
    </div>
  );
}
