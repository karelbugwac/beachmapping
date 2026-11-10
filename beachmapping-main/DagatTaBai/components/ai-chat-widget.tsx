'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
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

function renderFormattedText(text: string) {
  // Convert markdown bullets ("* item") to clean bullets, keep **bold**, and strip any other stray asterisks.
  const cleaned = text.replace(/^[ \t]*\*[ \t]+/gm, '• ');
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold">
          {part.slice(2, -2).replace(/\*/g, '')}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part.replace(/\*/g, '')}</React.Fragment>;
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Hello! I'm **Bai**, your Dagat Ta Bai local guide for Barangay Binongkalan, Catmon. Ask me anything about **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, or **Hinagdan Beach**!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyLoadedRef = useRef(false);

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
  }, [messages, isOpen]);

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
    if (!questionText.trim() || loading) return;

    const recentHistory = messages
      .filter((m) => m.id !== 'welcome-1' && m.text.trim().length > 0)
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
    if (lastMsg.sender === 'assistant' && lastMsg.id !== 'welcome-1' && prevUserMsg) {
      branchQuestions = getContextualBranchQuestions(prevUserMsg.text, lastMsg.text);
    }
  }

  return (
    <div className="fixed z-50 bottom-2 right-2 sm:bottom-4 sm:right-4 transition-all duration-300">
      {/* Minimized Floating Trigger Button with live beacon */}
      {!isOpen && (
        <div className="relative group">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative w-12 h-12 sm:w-16 sm:h-16 bg-transparent border-0 p-0 outline-none focus:outline-none shadow-none cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 animate-float-slow select-none flex items-center justify-center"
            aria-label="Open Bai AI Guide"
          >
            <Image
              src="/images/bai.png"
              alt="Bai AI Guide - Click to chat"
              width={64}
              height={64}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain drop-shadow-[0_4px_12px_rgba(31,63,116,0.25)] dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_8px_18px_rgba(31,63,116,0.35)] transition-all duration-300 pointer-events-none"
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
          className="flex h-[min(520px,calc(100dvh-5rem))] max-h-[calc(100dvh-4rem)] w-[min(340px,calc(100vw-1.5rem))] sm:h-[min(520px,calc(100dvh-6rem))] sm:w-[350px] sm:max-h-[75vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_-15px_rgba(15,23,42,0.4)] animate-in fade-in slide-in-from-bottom-2 duration-200 dark:border-neutral-800 dark:bg-[#0c1424]"
        >
          {/* Branded compact header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#1F3F74] px-3.5 py-2.5 text-white dark:bg-[#12223d] sm:px-4 sm:py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <Image
                src="/images/bai.png"
                alt="Bai"
                width={30}
                height={30}
                className="h-7 w-7 shrink-0 object-contain"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-sans text-xs sm:text-sm font-bold leading-tight tracking-tight text-white">Bai</h3>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-label="Online" />
                  <span className="text-[9px] sm:text-[10px] font-medium leading-tight text-blue-100/90">Local Guide</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => void handleClearHistory()}
                disabled={!signedIn}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-100/80 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Delete saved chat history"
                title={signedIn ? 'Delete your saved chat history' : 'Sign in to save or delete history'}
              >
                <Trash2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-100/80 transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Close Chat"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Conversation stream */}
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 px-3 py-3 text-xs dark:bg-[#09101d] sm:px-3.5"
          >
            {visibleMessages.map((msg) => (
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
                    className="mb-4 h-6 w-6 shrink-0 object-contain"
                  />
                )}
                <div
                  className={`max-w-[85%] min-w-0 space-y-1 px-3 py-2 shadow-2xs sm:max-w-[82%] ${
                    msg.sender === 'user'
                      ? 'rounded-2xl rounded-br-md border border-[#162e55] bg-[#1F3F74] text-white dark:bg-[#234b87]'
                      : 'rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-[#132035] dark:text-slate-100'
                  }`}
                >
                  <p className="break-words whitespace-pre-line leading-relaxed [overflow-wrap:anywhere] text-[11px] sm:text-xs">
                    {renderFormattedText(msg.text)}
                  </p>
                  <span
                    className={`block text-right text-[9px] font-medium ${
                      msg.sender === 'user' ? 'text-blue-200/80' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {!hasUserMessages && !loading && (
              <div className="ml-7 space-y-1.5 pt-0.5">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Try asking</p>
                <div className="flex flex-wrap gap-1.5">
                  {BAI_SUGGESTED_QUESTIONS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => void submitQuestion(item.question)}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-[#1F3F74] transition-colors hover:border-[#1F3F74]/40 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] dark:border-slate-700 dark:bg-[#132035] dark:text-blue-200 dark:hover:bg-[#182b48] dark:focus-visible:ring-[#4987BA]"
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
                      className="rounded-full border border-blue-200/80 bg-blue-50/80 px-2.5 py-1 text-[10px] font-medium text-[#1F3F74] transition-colors hover:bg-[#1F3F74] hover:text-white dark:border-blue-900/60 dark:bg-[#152642] dark:text-blue-200 dark:hover:bg-[#1F3F74] dark:hover:text-white"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isThinking && (
              <div className="ml-7 inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-[#132035]" aria-label="Bai is typing">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1F3F74] dark:bg-[#4987BA]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1F3F74] [animation-delay:0.2s] dark:bg-[#4987BA]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1F3F74] [animation-delay:0.4s] dark:bg-[#4987BA]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Compact docked message composer */}
          <form
            onSubmit={handleSend}
            className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-[#0c1424] sm:p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Rañola, Lite Bay, Majestique, Hinagdan..."
              aria-label="Message Bai"
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 transition focus:border-[#1F3F74] focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/15 dark:border-slate-800 dark:bg-[#132035] dark:text-slate-100 dark:focus:border-[#4987BA] dark:focus:ring-[#4987BA]/20"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F3F74] text-white shadow-xs transition hover:bg-[#16305a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-[#0c1424]"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </form>

        </section>
      )}
    </div>
  );
}
