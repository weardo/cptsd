'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import Link from 'next/link';

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(
    searchParams.get('id') || null
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showList, setShowList] = useState(!conversationId);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/v1/chat/conversations');
      if (!response.ok) throw new Error('Failed to load conversations');
      const data = await response.json();
      setConversations(data.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const handleNewChat = () => {
    setConversationId(null);
    setShowList(false);
    router.push('/app/chat');
  };

  const handleSelectConversation = (id: string) => {
    setConversationId(id);
    setShowList(false);
    router.push(`/app/chat?id=${id}`);
  };

  if (showList) {
    return (
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Chat Conversations</h1>
            <button
              onClick={handleNewChat}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              New Chat
            </button>
          </div>
          {conversations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">No conversations yet.</p>
              <button
                onClick={handleNewChat}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Start Your First Chat
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className="w-full text-left bg-white rounded-lg shadow p-4 hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-gray-900">{conv.title || 'Untitled'}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {conv.lastMessageAt
                      ? `Last message: ${new Date(conv.lastMessageAt).toLocaleString()}`
                      : `Created: ${new Date(conv.createdAt).toLocaleString()}`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Chat</h1>
          <button
            onClick={() => setShowList(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Back to Conversations
          </button>
        </div>
        <ChatInterface
          conversationId={conversationId}
          onConversationChange={(id) => {
            setConversationId(id);
            if (id) {
              router.push(`/app/chat?id=${id}`);
              loadConversations();
            }
          }}
        />
      </div>
    </div>
  );
}

