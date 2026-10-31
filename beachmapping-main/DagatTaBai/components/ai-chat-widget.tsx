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

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
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
      text: "Maayong adlaw! I'm Bai, the Dagat Ta Bai guide. Ask about information currently listed in our verified beach database.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPortal) return;
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
      .catch(() => undefined);
  }, [isPortal]);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
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

  const handleClearHistory = async () => {
    try {
      const response = await fetch('/api/assistant/history', { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete history.');
      setMessages([]);
      showToast('Your Bai chat history was deleted.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not delete chat history.', 'error');
    }
  };

  if (isPortal) return null;

  // Filter messages so that empty assistant placeholders don't show an empty chat bubble
  const visibleMessages = messages.filter(
    (msg) => msg.sender === 'user' || (msg.sender === 'assistant' && msg.text.trim().length > 0)
  );

  // Check if AI is thinking before first text chunk arrives
  const isThinking =
    loading &&
    (!messages.length ||
      messages[messages.length - 1].sender === 'user' ||
      !messages[messages.length - 1].text.trim());

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Trigger Button with active online beacon */}
      {!isOpen && (
        <div className="relative group">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative w-20 h-20 sm:w-24 sm:h-24 bg-transparent border-0 p-0 outline-none focus:outline-none shadow-none cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 animate-float-slow select-none flex items-center justify-center"
            aria-label="Open Bai AI Guide"
          >
            <Image
              src="/images/bai.png"
              alt="Bai AI Guide - Click to chat"
              width={96}
              height={96}
              className="object-contain drop-shadow-[0_8px_16px_rgba(31,63,116,0.25)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_12px_24px_rgba(31,63,116,0.35)] transition-all duration-300 pointer-events-none"
            />
            {/* Live emerald beacon indicator */}
            <span className="absolute top-2 right-2 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white dark:ring-black"></span>
            </span>
          </button>
        </div>
      )}

      {/* Modern AI Chat Window - Square / Non-Rounded Modern Architecture */}
      {isOpen && (
        <div className="bg-white dark:bg-[#0c1424] w-[92vw] sm:w-[390px] h-[530px] max-h-[82vh] rounded-none shadow-2xl border border-slate-300 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
          
          {/* Header: Pure Signature Dive Blue - Clean & Minimalist */}
          <div className="bg-[#1F3F74] dark:bg-[#12223d] text-white px-4 py-3 flex items-center justify-between border-b border-white/10 select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/15 p-0.5 flex items-center justify-center ring-1 ring-white/20 flex-shrink-0">
                <Image
                  src="/images/bai.png"
                  alt="Bai"
                  width={30}
                  height={30}
                  className="object-contain"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#1F3F74]" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-sans font-extrabold tracking-tight text-white leading-none">
                  Bai
                </h3>
                <span className="text-[10px] bg-white/15 text-blue-100 font-semibold px-2 py-0.5 rounded-none border border-white/20">
                  Local Guide
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void handleClearHistory()}
                disabled={!signedIn}
                className="p-1.5 text-blue-200 hover:bg-white/15 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                aria-label="Delete saved chat history"
                title={signedIn ? 'Delete your saved chat history' : 'Sign in to save or delete history'}
              >
                <Trash2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-blue-200 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                aria-label="Close Chat"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages Stream: Clean Modern Flow without Repetitive Profile Avatars */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60 dark:bg-[#09101d] text-xs">
            {visibleMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[86%] px-3.5 py-2.5 space-y-1 rounded-none ${
                    msg.sender === 'user'
                      ? 'bg-[#1F3F74] dark:bg-[#234b87] text-white shadow-xs border border-[#162e55]'
                      : 'bg-white dark:bg-[#132035] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 border-l-2 border-l-[#1F3F74] dark:border-l-[#4987BA] shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed text-xs">
                    {msg.text}
                  </p>
                  <span
                    className={`text-[9.5px] block text-right font-medium ${
                      msg.sender === 'user' ? 'text-blue-200/80' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Thinking State: Only 3 Bouncing Dots - Absolutely NO Empty Chat Bubble */}
            {isThinking && (
              <div className="flex items-center gap-1.5 py-2 px-1">
                <span className="w-2 h-2 rounded-full bg-[#1F3F74] dark:bg-[#4987BA] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#1F3F74] dark:bg-[#4987BA] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#1F3F74] dark:bg-[#4987BA] animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts: Modern Square Chips */}
          <div className="px-3 py-2 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c1424] flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              type="button"
              onClick={() => setInput('Which beaches are listed in the verified database?')}
              className="px-2.5 py-1 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#1F3F74] hover:text-white dark:hover:bg-[#1F3F74] dark:hover:text-white border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors font-medium cursor-pointer"
            >
              Listed beaches
            </button>
            <button
              type="button"
              onClick={() => setInput('Which beach is best for snorkeling?')}
              className="px-2.5 py-1 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#1F3F74] hover:text-white dark:hover:bg-[#1F3F74] dark:hover:text-white border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors font-medium cursor-pointer"
            >
              Snorkeling spot
            </button>
            <button
              type="button"
              onClick={() => setInput('What are the entrance fees?')}
              className="px-2.5 py-1 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#1F3F74] hover:text-white dark:hover:bg-[#1F3F74] dark:hover:text-white border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors font-medium cursor-pointer"
            >
              Entrance fees
            </button>
            <button
              type="button"
              onClick={() => setInput('What is the current tide status and sea condition?')}
              className="px-2.5 py-1 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#1F3F74] hover:text-white dark:hover:bg-[#1F3F74] dark:hover:text-white border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors font-medium cursor-pointer"
            >
              Tide status
            </button>
          </div>

          {/* Input Form: Sharp Modern Docked Input (No Verified Footer Text) */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c1424] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about cottages, fees, tides..."
              className="flex-1 bg-slate-50 dark:bg-[#132035] border border-slate-200 dark:border-slate-800 rounded-none px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1F3F74] transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-none bg-[#1F3F74] hover:bg-[#16305a] active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs flex-shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              <Send size={13} />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
