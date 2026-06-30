'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { updateIdeaPosition } from '@/app/actions/ideas';
import Link from 'next/link';

type Topic = {
  id: string;
  name: string;
  slug: string;
};

type Idea = {
  id: string;
  topicId: string;
  topic: Topic | null;
  intent?: string;
  status: string;
  items: Array<{
    type: 'text' | 'image' | 'file' | 'link';
    content: string;
    metadata?: any;
    order: number;
  }>;
  notes?: string;
  aiVariations?: string[];
  postType?: string;
  tone?: string;
  position?: { x: number; y: number };
  createdAt: Date;
  updatedAt: Date;
};

type IdeasBoardProps = {
  ideas: Idea[];
  topics: Topic[];
};

export default function IdeasBoard({ ideas: initialIdeas, topics }: IdeasBoardProps) {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [draggedIdea, setDraggedIdea] = useState<string | null>(null);
  const [draggedPosition, setDraggedPosition] = useState<{ x: number; y: number } | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, ideaId: string) => {
    setDraggedIdea(ideaId);
    const idea = ideas.find((i) => i.id === ideaId);
    if (idea) {
      setDraggedPosition(idea.position || { x: 0, y: 0 });
    }
    e.dataTransfer.effectAllowed = 'move';
  }, [ideas]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedIdea || !draggedPosition) return;

      const boardRect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - boardRect.left - 150; // Center of card (card width ~300px)
      const y = e.clientY - boardRect.top - 100; // Center of card (card height ~200px)

      // Update local state immediately
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === draggedIdea ? { ...idea, position: { x, y } } : idea))
      );

      // Save to server
      try {
        await updateIdeaPosition(draggedIdea, x, y);
        router.refresh();
      } catch (error) {
        console.error('Failed to update position:', error);
        // Revert on error
        router.refresh();
      }

      setDraggedIdea(null);
      setDraggedPosition(null);
    },
    [draggedIdea, draggedPosition, router]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'REVIEWING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'CONVERTED':
        return 'bg-blue-100 text-blue-800';
      case 'ARCHIVED':
        return 'bg-gray-200 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Group ideas by status for better organization
  const ideasByStatus = ideas.reduce(
    (acc, idea) => {
      const status = idea.status || 'DRAFT';
      if (!acc[status]) acc[status] = [];
      acc[status].push(idea);
      return acc;
    },
    {} as Record<string, Idea[]>
  );

  return (
    <div className="space-y-6">
      {/* Filter by status */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['DRAFT', 'REVIEWING', 'APPROVED', 'CONVERTED', 'ARCHIVED'].map((status) => (
          <button
            key={status}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              ideasByStatus[status]?.length
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {status} ({ideasByStatus[status]?.length || 0})
          </button>
        ))}
      </div>

      {/* Board with drag & drop */}
      <div
        className="relative min-h-[600px] bg-gray-100 rounded-lg p-4 overflow-auto"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ position: 'relative' }}
      >
        {ideas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No ideas yet</p>
            <p className="text-sm">Create a new idea or generate ideas with AI</p>
          </div>
        ) : (
          ideas.map((idea) => {
            const position = idea.position || { x: 0, y: 0 };
            return (
              <div
                key={idea.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idea.id)}
                className="absolute cursor-move bg-white rounded-lg shadow-md p-4 w-[300px] hover:shadow-lg transition-shadow"
                style={{
                  left: `${Math.max(0, position.x)}px`,
                  top: `${Math.max(0, position.y)}px`,
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(idea.status)}`}>
                    {idea.status}
                  </span>
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit →
                  </Link>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                  {idea.topic?.name || 'Untitled Topic'}
                </h3>

                {idea.intent && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{idea.intent}</p>
                )}

                {idea.notes && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{idea.notes}</p>
                )}

                {idea.items && idea.items.length > 0 && (
                  <div className="flex space-x-1 mb-2">
                    {idea.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="text-xs text-gray-400">
                        {item.type === 'text' && '📝'}
                        {item.type === 'image' && '🖼️'}
                        {item.type === 'file' && '📎'}
                        {item.type === 'link' && '🔗'}
                      </div>
                    ))}
                    {idea.items.length > 3 && (
                      <span className="text-xs text-gray-400">+{idea.items.length - 3}</span>
                    )}
                  </div>
                )}

                {idea.aiVariations && idea.aiVariations.length > 0 && (
                  <p className="text-xs text-green-600 mb-1">✨ {idea.aiVariations.length} AI variations</p>
                )}

                <div className="flex space-x-2 text-xs text-gray-500 mt-2">
                  {idea.postType && <span>{idea.postType}</span>}
                  {idea.tone && <span>• {idea.tone}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Drag ideas around the board to organize them. Click "Edit" to view or convert an idea
          to a post.
        </p>
      </div>
    </div>
  );
}

