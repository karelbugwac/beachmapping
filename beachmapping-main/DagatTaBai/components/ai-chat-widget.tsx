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

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Trigger Button - Just the image */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative w-20 h-20 sm:w-24 sm:h-24 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          aria-label="Open Bai AI Guide"
        >
          <Image
            src="/images/bai.png"
            alt="Bai AI Guide - Click to chat"
            fill
            className="object-contain"
          />
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="bg-sand-50 dark:bg-ocean-950 w-[92vw] sm:w-[380px] h-[520px] max-h-[80vh] rounded-2xl shadow-2xl border border-sand-300 dark:border-ocean-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="bg-ocean-900 dark:bg-ocean-900 text-sand-50 p-4 flex items-center justify-between border-b border-ocean-800">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-sand-200 dark:bg-ocean-800 p-1 flex items-center justify-center">
                <Image
                  src="/images/bai.png"
                  alt="Bai Assistant Mascot"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight flex items-center gap-1.5 font-heading">
                  <span>Bai</span>
                  <span className="text-[10px] bg-ocean-800 text-sand-200 px-1.5 py-0.5 rounded">
                    Local Guide
                  </span>
                </h3>
                <p className="text-[10px] text-sand-300 leading-none mt-0.5">
                  Barangay Binongkalan, Catmon
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void handleClearHistory()}
              disabled={!signedIn}
              className="rounded-lg p-1 text-sand-300 hover:bg-ocean-800 hover:text-white disabled:opacity-40"
              aria-label="Delete saved chat history"
              title={signedIn ? 'Delete your saved chat history' : 'Sign in to save or delete history'}
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sand-300 hover:text-white p-1 rounded-lg hover:bg-ocean-800 transition-colors"
              aria-label="Close Chat"
            >
              <X size={18} />
            </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-sand-100/60 dark:bg-ocean-950 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="relative w-6 h-6 rounded-lg overflow-hidden flex-shrink-0 bg-sand-200 dark:bg-ocean-800 p-0.5 flex items-center justify-center mt-1">
                    <Image
                      src="/images/bai.png"
                      alt="Bai"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 space-y-1 ${
                    msg.sender === 'user'
                      ? 'bg-ocean-800 text-white rounded-br-xs shadow-2xs'
                      : 'bg-sand-50 dark:bg-ocean-900 text-ocean-950 dark:text-sand-100 border border-sand-300/80 dark:border-ocean-800 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  <span
                    className={`text-[9px] block text-right ${
                      msg.sender === 'user' ? 'text-sand-300' : 'text-sand-600 dark:text-sand-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-xs text-sand-600 dark:text-sand-400 pl-8">
                <span className="animate-pulse">Bai is verifying local information...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-t border-sand-200 dark:border-ocean-800 bg-sand-50 dark:bg-ocean-900 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              type="button"
              onClick={() => setInput('Which beaches are listed in the verified database?')}
              className="px-2.5 py-1 rounded-lg bg-sand-200/80 dark:bg-ocean-800 text-ocean-950 dark:text-sand-200 hover:bg-sand-300 dark:hover:bg-ocean-700 whitespace-nowrap transition-colors"
            >
              Listed beaches
            </button>
            <button
              type="button"
              onClick={() => setInput('Which beach is best for snorkeling?')}
              className="px-2.5 py-1 rounded-lg bg-sand-200/80 dark:bg-ocean-800 text-ocean-950 dark:text-sand-200 hover:bg-sand-300 dark:hover:bg-ocean-700 whitespace-nowrap transition-colors"
            >
              Snorkeling spot
            </button>
            <button
              type="button"
              onClick={() => setInput('What are the entrance fees?')}
              className="px-2.5 py-1 rounded-lg bg-sand-200/80 dark:bg-ocean-800 text-ocean-950 dark:text-sand-200 hover:bg-sand-300 dark:hover:bg-ocean-700 whitespace-nowrap transition-colors"
            >
              Entrance fees
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-sand-200 dark:border-ocean-800 bg-sand-50 dark:bg-ocean-900 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about cottages, fees, tides..."
              className="flex-1 bg-white dark:bg-ocean-950 border border-sand-300 dark:border-ocean-800 rounded-xl px-3.5 py-2 text-xs text-ocean-950 dark:text-sand-50 placeholder:text-sand-500 dark:placeholder:text-ocean-400 focus:outline-none focus:ring-1 focus:ring-ocean-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-xl bg-ocean-800 hover:bg-ocean-900 dark:bg-ocean-700 dark:hover:bg-ocean-600 disabled:opacity-50 text-white flex items-center justify-center transition-colors flex-shrink-0"
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
