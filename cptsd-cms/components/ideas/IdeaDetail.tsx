'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { updateIdeaItems } from '@/app/actions/ideas';
import { uploadFile } from '@/app/actions/uploads';
import FileUpload from '../FileUpload';
import ImageModal from '../ImageModal';
import { IContentIdeaItem } from '@cptsd/db/models/ContentIdea';

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
  items: IContentIdeaItem[];
  notes?: string;
  aiVariations?: string[];
  postType?: string;
  tone?: string;
  generatedScript?: string;
  generatedCaption?: string;
  generatedHashtags?: string;
  linkedPostId?: string;
  createdAt: Date;
  updatedAt: Date;
};

type IdeaDetailProps = {
  idea: Idea;
  topics: Topic[];
  onUpdate: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  onConvertToPost: () => Promise<{ success: boolean; error?: string }>;
};

export default function IdeaDetail({
  idea: initialIdea,
  topics,
  onUpdate,
  onConvertToPost,
}: IdeaDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [idea, setIdea] = useState<Idea>(initialIdea);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const [newItemType, setNewItemType] = useState<'text' | 'image' | 'file' | 'link'>('text');
  const [newItemContent, setNewItemContent] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await onUpdate(formData);
      if (result.success) {
        setSuccess('Idea updated successfully');
        router.refresh();
      } else {
        setError(result.error || 'Failed to update idea');
      }
    });
  };

  const handleAddTextItem = () => {
    if (!newItemContent.trim()) return;

    const newItems = [
      ...idea.items,
      {
        type: 'text' as const,
        content: newItemContent,
        order: idea.items.length,
      },
    ];

    setIdea({ ...idea, items: newItems });
    setNewItemContent('');

    // Save to server
    updateIdeaItems(idea.id, newItems).then((result) => {
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleAddLinkItem = () => {
    if (!newItemContent.trim()) return;

    const newItems = [
      ...idea.items,
      {
        type: 'link' as const,
        content: newItemContent,
        order: idea.items.length,
      },
    ];

    setIdea({ ...idea, items: newItems });
    setNewItemContent('');

    updateIdeaItems(idea.id, newItems).then((result) => {
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadFile(formData);

      if (result.success && result.url) {
        const newItems = [
          ...idea.items,
          {
            type: (file.type.startsWith('image/') ? 'image' : 'file') as 'image' | 'file',
            content: result.url,
            metadata: {
              filename: file.name,
              fileSize: file.size,
              mimeType: file.type,
            },
            order: idea.items.length,
          },
        ];

        setIdea({ ...idea, items: newItems });

        const updateResult = await updateIdeaItems(idea.id, newItems);
        if (updateResult.success) {
          setSuccess('File uploaded successfully');
          router.refresh();
        } else {
          setError(updateResult.error || 'Failed to save file');
        }
      } else {
        setError(result.error || 'Failed to upload file');
      }
    } catch (err) {
      setError('An error occurred while uploading the file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = idea.items.filter((_, i) => i !== index);
    setIdea({ ...idea, items: newItems });

    updateIdeaItems(idea.id, newItems).then((result) => {
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleConvertToPost = () => {
    if (confirm('Convert this idea to a post? This will create a new post with the idea content.')) {
      startTransition(async () => {
        const result = await onConvertToPost();
        if (!result.success) {
          setError(result.error || 'Failed to convert idea to post');
        }
      });
    }
  };

  const handleGenerateContent = async () => {
    // This will be implemented to call generateContentFromIdea
    // For now, we'll add a placeholder
    setError('Content generation from idea will be implemented next');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Idea Detail</h1>
        <div className="flex space-x-2">
          {idea.status !== 'CONVERTED' && (
            <button
              onClick={handleConvertToPost}
              disabled={isPending}
              className="btn btn-primary"
            >
              Convert to Post →
            </button>
          )}
          {idea.linkedPostId && (
            <a
              href={`/posts/${idea.linkedPostId}`}
              className="btn btn-secondary"
            >
              View Post →
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="topicId" className="block text-sm font-medium text-gray-700 mb-1">
                Topic *
              </label>
              <select
                id="topicId"
                name="topicId"
                defaultValue={idea.topicId}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="intent" className="block text-sm font-medium text-gray-700 mb-1">
                Intent / Goal
              </label>
              <input
                type="text"
                id="intent"
                name="intent"
                defaultValue={idea.intent || ''}
                placeholder="What's the goal of this idea?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="postType" className="block text-sm font-medium text-gray-700 mb-1">
                  Post Type
                </label>
                <select
                  id="postType"
                  name="postType"
                  defaultValue={idea.postType || 'CAROUSEL'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="CAROUSEL">CAROUSEL</option>
                  <option value="REEL">REEL</option>
                  <option value="STORY">STORY</option>
                  <option value="MEME">MEME</option>
                </select>
              </div>

              <div>
                <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
                  Tone
                </label>
                <select
                  id="tone"
                  name="tone"
                  defaultValue={idea.tone || 'educational'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="educational">Educational</option>
                  <option value="validating">Validating</option>
                  <option value="gentle-cta">Gentle CTA</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={idea.status}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="REVIEWING">REVIEWING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={idea.notes || ''}
                placeholder="Rough notes about this idea..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-4 btn btn-primary"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          alt={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Rich Media Items</h2>

        <div className="space-y-4 mb-4">
          {idea.items.map((item, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg flex justify-between items-start"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {item.type === 'text' && <span>📝</span>}
                  {item.type === 'image' && <span>🖼️</span>}
                  {item.type === 'file' && <span>📎</span>}
                  {item.type === 'link' && <span>🔗</span>}
                  <span className="text-xs font-semibold text-gray-500 uppercase">{item.type}</span>
                </div>

                {item.type === 'text' && <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>}

                {item.type === 'image' && (
                  <div>
                    <img
                      src={item.content}
                      alt={item.metadata?.description || 'Idea image'}
                      className="max-w-full h-auto rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxHeight: '300px' }}
                      onClick={() => setSelectedImage({ url: item.content, alt: item.metadata?.description || 'Idea image' })}
                    />
                    {item.metadata?.filename && (
                      <p className="text-xs text-gray-500">{item.metadata.filename}</p>
                    )}
                  </div>
                )}

                {item.type === 'file' && (
                  <div>
                    <a
                      href={item.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {item.metadata?.filename || 'Download file'}
                    </a>
                    {item.metadata?.fileSize && (
                      <p className="text-xs text-gray-500">
                        {(item.metadata.fileSize / 1024).toFixed(2)} KB
                      </p>
                    )}
                  </div>
                )}

                {item.type === 'link' && (
                  <a
                    href={item.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all"
                  >
                    {item.content}
                  </a>
                )}
              </div>

              <button
                onClick={() => handleRemoveItem(index)}
                className="ml-4 text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ))}

          {idea.items.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No items yet. Add text, images, files, or links below.</p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Item
            </label>
            <select
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
            >
              <option value="text">📝 Text</option>
              <option value="image">🖼️ Image</option>
              <option value="file">📎 File</option>
              <option value="link">🔗 Link</option>
            </select>

            {newItemType === 'text' && (
              <div className="flex space-x-2">
                <textarea
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  placeholder="Enter text content..."
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={handleAddTextItem}
                  className="btn btn-secondary"
                  disabled={!newItemContent.trim()}
                >
                  Add
                </button>
              </div>
            )}

            {newItemType === 'link' && (
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={handleAddLinkItem}
                  className="btn btn-secondary"
                  disabled={!newItemContent.trim()}
                >
                  Add
                </button>
              </div>
            )}

            {(newItemType === 'image' || newItemType === 'file') && (
              <FileUpload
                onUpload={handleFileUpload}
                uploading={uploading}
              />
            )}
          </div>
        </div>
      </div>

      {idea.aiVariations && idea.aiVariations.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">AI Variations</h2>
          <ul className="space-y-2">
            {idea.aiVariations.map((variation, index) => (
              <li key={index} className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                {variation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(idea.generatedScript || idea.generatedCaption) && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Generated Content</h2>
          {idea.generatedScript && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Script</h3>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{idea.generatedScript}</p>
            </div>
          )}
          {idea.generatedCaption && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Caption</h3>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{idea.generatedCaption}</p>
            </div>
          )}
          {idea.generatedHashtags && (
            <div>
              <h3 className="font-medium mb-2">Hashtags</h3>
              <p className="text-gray-700 text-sm">{idea.generatedHashtags}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

