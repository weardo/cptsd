'use client';

import { useState, useEffect, useRef } from 'react';
import { createLogger } from '@/lib/logger';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  conversationId: string | null;
  onConversationChange: (id: string | null) => void;
}

export default function ChatInterface({ conversationId, onConversationChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'checkin' | 'freewrite'>('freewrite');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logger = createLogger();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      loadHistory();
    } else {
      // Clear messages when starting a new conversation
      setMessages([]);
    }
  }, [conversationId]);

  const loadHistory = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/v1/chat/history?conversationId=${conversationId}`);
      if (!response.ok) throw new Error('Failed to load history');
      const data = await response.json();
      setMessages(data.messages);
    } catch (err: any) {
      logger.error('Failed to load chat history', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(conversationId && { conversationId }),
          message: userMessage.content,
          mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();

      // Update conversation ID if this was a new conversation
      if (data.conversationId && !conversationId) {
        onConversationChange(data.conversationId);
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.assistantMessage,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Show safety warning if flagged
      if (data.safety?.flagged) {
        setError(
          `⚠️ Safety concern detected (${data.safety.level}). Please reach out to a professional if you need immediate support.`
        );
      }
    } catch (err: any) {
      logger.error('Failed to send message', err);
      setError(err.message || 'Failed to send message. Please try again.');
      // Remove the user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg">
      {/* Mode selector */}
      <div className="p-4 border-b flex gap-4">
        <button
          onClick={() => setMode('freewrite')}
          className={`px-4 py-2 rounded ${
            mode === 'freewrite'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Free Write
        </button>
        <button
          onClick={() => setMode('checkin')}
          className={`px-4 py-2 rounded ${
            mode === 'checkin'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Check-in
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation by typing a message below.</p>
            <p className="text-sm mt-2">
              {mode === 'freewrite'
                ? 'Share your thoughts and feelings freely.'
                : 'Complete a guided check-in to track your day.'}
            </p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <p className="text-gray-500">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder={
              mode === 'freewrite'
                ? 'Share your thoughts...'
                : 'Answer the check-in questions...'
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

