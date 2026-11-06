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
} from '@/lib/services/baiKnowledgeBase';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function AiChatWidget() {
  const pathname = usePathname();
  const isPortal = pathname?.startsWith('/admin') || pathname?.startsWith('/owner') || pathname?.startsWith('/staff') || pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password';

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Maayong adlaw! I'm **Bai**, your Dagat Ta Bai local guide for Barangay Binongkalan, Catmon. Tap a question below or ask me about **Rañola Beach (Raniola)**, **Lite Bay Resort**, **Majestique Beach**, or **Hinagdan Beach**!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyLoadedRef = useRef(false);

  // Lazy-load history only when the chat widget is actually opened
  useEffect(() => {
    if (isPortal || !isOpen || historyLoadedRef.current) return;
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
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: "I'm currently unable to connect to the assistant service. Please check your internet connection.",
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

  if (isPortal) return null;

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

  const isMap = pathname === '/map';

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isMap
          ? 'top-20 right-2 sm:top-auto sm:bottom-5 sm:right-5'
          : 'bottom-2 right-2 sm:bottom-5 sm:right-5'
      }`}
    >
      {/* Floating Trigger Button with active online beacon */}
      {!isOpen && (
        <div className="relative group">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative w-16 h-16 sm:w-24 sm:h-24 bg-transparent border-0 p-0 outline-none focus:outline-none shadow-none cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 animate-float-slow select-none flex items-center justify-center"
            aria-label="Open Bai AI Guide"
          >
            <Image
              src="/images/bai.png"
              alt="Bai AI Guide - Click to chat"
              width={96}
              height={96}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain drop-shadow-[0_8px_16px_rgba(31,63,116,0.25)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_12px_24px_rgba(31,63,116,0.35)] transition-all duration-300 pointer-events-none"
            />
            {/* Live emerald beacon indicator */}
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex h-3 sm:h-3.5 w-3 sm:w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 sm:h-3.5 w-3 sm:w-3.5 bg-emerald-500 ring-2 ring-white dark:ring-black"></span>
            </span>
          </button>
        </div>
      )}

      {/* Responsive conversation panel */}
      {isOpen && (
        <section
          aria-label="Chat with Bai"
          className="flex h-[min(640px,calc(100dvh-1rem))] max-h-[calc(100dvh-1rem)] w-[min(390px,calc(100vw-1rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.5)] animate-in fade-in slide-in-from-bottom-2 duration-200 dark:border-neutral-800 dark:bg-[#0c1424] sm:h-[min(640px,calc(100dvh-6rem))] sm:max-h-[82vh]"
        >
          
          {/* Branded header */}
          <div className="flex shrink-0 items-center justify-between gap-2.5 border-b border-white/10 bg-[#1F3F74] px-3.5 py-2.5 text-white dark:bg-[#12223d] sm:px-5 sm:py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Image
                src="/images/bai.png"
                alt="Bai"
                width={38}
                height={38}
                className="h-9 w-9 shrink-0 object-contain"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-sans text-sm font-bold leading-tight tracking-tight text-white">Bai</h3>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-label="Online" />
                  <span className="text-[10px] font-medium leading-tight text-blue-100/90">Local Guide</span>
                </div>
                <p className="mt-0.5 truncate text-[10px] leading-tight text-blue-100/75">Here to help you explore Catmon</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => void handleClearHistory()}
                disabled={!signedIn}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-100/80 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Delete saved chat history"
                title={signedIn ? 'Delete your saved chat history' : 'Sign in to save or delete history'}
              >
                <Trash2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-100/80 transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Close Chat"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Conversation stream */}
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-3 py-4 text-xs dark:bg-[#09101d] sm:px-4"
          >
            {visibleMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex min-w-0 items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="relative mb-5 h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#1F3F74]/10 ring-1 ring-[#1F3F74]/10 dark:bg-[#4987BA]/15 dark:ring-[#4987BA]/20">
                    <Image src="/images/bai.png" alt="" fill sizes="28px" className="object-contain p-0.5" />
                  </div>
                )}
                <div
                  className={`max-w-[84%] min-w-0 space-y-1.5 px-3.5 py-2.5 shadow-sm sm:max-w-[80%] ${
                    msg.sender === 'user'
                      ? 'rounded-2xl rounded-br-md border border-[#162e55] bg-[#1F3F74] text-white dark:bg-[#234b87]'
                      : 'rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-[#132035] dark:text-slate-100'
                  }`}
                >
                  <p className="break-words whitespace-pre-line leading-relaxed [overflow-wrap:anywhere]">
                    {renderFormattedText(msg.text)}
                  </p>
                  <span
                    className={`block text-right text-[10px] font-medium ${
                      msg.sender === 'user' ? 'text-blue-200/80' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {!hasUserMessages && !loading && (
              <div className="ml-9 space-y-2.5 pt-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Try asking</p>
                <div className="grid grid-cols-2 gap-2">
                  {BAI_SUGGESTED_QUESTIONS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => void submitQuestion(item.question)}
                      className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-[11px] font-medium leading-relaxed text-[#1F3F74] transition-colors hover:border-[#1F3F74]/40 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] dark:border-slate-700 dark:bg-[#132035] dark:text-blue-200 dark:hover:bg-[#182b48] dark:focus-visible:ring-[#4987BA]"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contextual Follow-Up / Branch Questions right below the latest answer */}
            {branchQuestions.length > 0 && (
              <div className="ml-9 space-y-2 pt-0.5">
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Keep exploring
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {branchQuestions.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      disabled={loading}
                      onClick={() => void submitQuestion(item.question)}
                      className="rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1.5 text-[11px] font-medium text-[#1F3F74] transition-colors hover:bg-[#1F3F74] hover:text-white dark:border-blue-900/60 dark:bg-[#152642] dark:text-blue-200 dark:hover:bg-[#1F3F74] dark:hover:text-white"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isThinking && (
              <div className="ml-9 inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-[#132035]" aria-label="Bai is typing">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1F3F74] dark:bg-[#4987BA]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1F3F74] [animation-delay:0.2s] dark:bg-[#4987BA]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1F3F74] [animation-delay:0.4s] dark:bg-[#4987BA]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Docked message composer */}
          <form
            onSubmit={handleSend}
            className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-[#0c1424] sm:p-3.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Rañola, Lite Bay, Majestique, Hinagdan..."
              aria-label="Message Bai"
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-900 transition focus:border-[#1F3F74] focus:outline-none focus:ring-2 focus:ring-[#1F3F74]/15 dark:border-slate-800 dark:bg-[#132035] dark:text-slate-100 dark:focus:border-[#4987BA] dark:focus:ring-[#4987BA]/20"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1F3F74] text-white shadow-sm transition hover:bg-[#16305a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3F74] focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-[#0c1424]"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>

        </section>
      )}
    </div>
  );
}
