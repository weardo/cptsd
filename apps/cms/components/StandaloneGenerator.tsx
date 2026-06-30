'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFile } from '@/app/actions/uploads';
import { generateStandaloneContent, deleteStandaloneGeneration } from '@/app/actions/standalone';
import ImageModal from './ImageModal';

type StandaloneGeneration = {
  id: string;
  _id: string;
  prompt: string;
  systemPrompt?: string | null;
  model: string;
  contentType: 'text' | 'image' | 'both';
  generatedText?: string | null;
  generatedImages: string[];
  attachments?: Array<{ type: string; url: string }>;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
};

type StandaloneGeneratorProps = {
  availableModels: Array<{ value: string; label: string; cost: 'low' | 'medium' | 'high' }>;
  previousGenerations?: StandaloneGeneration[];
};

type Attachment = {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  file: File;
  url?: string;
};

export default function StandaloneGenerator({ 
  availableModels, 
  previousGenerations = [] 
}: StandaloneGeneratorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(availableModels[0]?.value || 'gpt-4o');
  const [contentType, setContentType] = useState<'text' | 'image' | 'both'>('text');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const [showPrevious, setShowPrevious] = useState(false);
  const [deletingGenerationId, setDeletingGenerationId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const generationAbortedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultModel = availableModels[0]?.value || 'gpt-4o';

  // Block navigation during generation
  useEffect(() => {
    if (isPending && !generationAbortedRef.current) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Generation in progress. Are you sure you want to leave?';
        return e.returnValue;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isPending]);

  // Load a previous generation
  const loadPreviousGeneration = (generation: StandaloneGeneration) => {
    setPrompt(generation.prompt);
    setSystemPrompt(generation.systemPrompt || '');
    setSelectedModel(generation.model);
    setContentType(generation.contentType);
    setGeneratedContent(generation.generatedText || '');
    setGeneratedImages(generation.generatedImages || []);
    setAttachments(generation.attachments?.map(att => ({
      id: Math.random().toString(36).substring(7),
      type: att.type as 'image' | 'video' | 'audio' | 'file',
      file: new File([], att.url.split('/').pop() || 'file'),
      url: att.url,
    })) || []);
    setShowPrevious(false);
    setError('');
    setSuccess('Previous generation loaded');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Delete a previous generation
  const handleDeleteGeneration = async (generationId: string) => {
    if (!confirm('Are you sure you want to delete this generation? This will also delete all associated images. This action cannot be undone.')) {
      return;
    }

    setDeletingGenerationId(generationId);
    startTransition(async () => {
      try {
        const result = await deleteStandaloneGeneration(generationId);
        if (result.success) {
          setSuccess('Generation deleted successfully');
          setTimeout(() => {
            setSuccess('');
            router.refresh();
          }, 1500);
        } else {
          setError(result.error || 'Failed to delete generation');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete generation');
      } finally {
        setDeletingGenerationId(null);
      }
    });
  };

  // Cancel generation
  const handleCancelGeneration = () => {
    if (isPending && !cancelling) {
      setCancelling(true);
      generationAbortedRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setTimeout(() => {
        setCancelling(false);
        setProgress({ current: 0, total: 0, message: '' });
        setError('Generation cancelled');
      }, 500);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const newAttachments: Attachment[] = [];

    for (const file of files) {
      const type = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
        ? 'audio'
        : 'file';

      // Upload file
      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadFile(formData);
        if (result.success && result.url) {
          newAttachments.push({
            id: Math.random().toString(36).substring(7),
            type,
            file,
            url: result.url,
          });
        }
      } catch (err) {
        console.error('Error uploading file:', err);
      }
    }

    setAttachments([...attachments, ...newAttachments]);

    // Reset file input so the same file can be selected again after removal
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGeneratedContent('');
    setGeneratedImages([]);

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (isPending) {
      return; // Prevent double submission
    }

    setCancelling(false);
    setProgress({ current: 0, total: contentType === 'both' ? 2 : 1, message: 'Initializing generation...' });
    generationAbortedRef.current = false;
    abortControllerRef.current = new AbortController();

    const formData = new FormData(e.currentTarget);
    formData.append('model', selectedModel);
    formData.append('contentType', contentType);
    formData.append('systemPrompt', systemPrompt || 'You are a helpful AI assistant.');
    formData.append('attachments', JSON.stringify(attachments.map((a) => ({ type: a.type, url: a.url }))));

    startTransition(async () => {
      try {
        // Estimate progress based on contentType
        if (contentType === 'text' || contentType === 'both') {
          setProgress({ current: 0, total: contentType === 'both' ? 2 : 1, message: 'Generating text content...' });
        }
        if (contentType === 'image' || contentType === 'both') {
          const imageTotal = contentType === 'both' ? 2 : 1;
          setProgress({ 
            current: contentType === 'both' ? 1 : 0, 
            total: imageTotal, 
            message: contentType === 'both' ? 'Generating images...' : 'Generating images...' 
          });
        }

        const result = await generateStandaloneContent(formData);

        if (generationAbortedRef.current) {
          setProgress({ current: 0, total: 0, message: 'Generation cancelled' });
          setError('Generation was cancelled');
          return;
        }

        const total = contentType === 'both' ? 2 : 1;
        setProgress({ current: total, total: total, message: 'Complete!' });

        if (result.success) {
          setSuccess(result.savedGeneration ? 'Content generated and saved successfully!' : 'Content generated successfully!');
          if (result.content) {
            setGeneratedContent(result.content);
          }
          if (result.images && result.images.length > 0) {
            setGeneratedImages(result.images);
          }
          setTimeout(() => {
            setProgress({ current: 0, total: 0, message: '' });
          }, 2000);
          // Refresh page to show new generation in previous generations list
          if (result.savedGeneration) {
            setTimeout(() => {
              router.refresh();
            }, 1500);
          }
        } else {
          setProgress({ current: 0, total: 0, message: '' });
          setError(result.error || 'Failed to generate content');
        }
      } catch (err) {
        if (generationAbortedRef.current) {
          setProgress({ current: 0, total: 0, message: 'Generation cancelled' });
          setError('Generation was cancelled');
        } else {
          setProgress({ current: 0, total: 0, message: '' });
          setError(err instanceof Error ? err.message : 'Failed to generate content');
        }
      }
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      default:
        return '📄';
    }
  };

  return (
    <>
      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          alt={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <form onSubmit={handleGenerate} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
            {success}
          </div>
        )}

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Generation Settings</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="model" className="block text-sm font-medium mb-2">
              OpenAI Model
            </label>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isPending}
              className="input disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {availableModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label} ({model.cost === 'low' ? '$' : model.cost === 'medium' ? '$$' : '$$$'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contentType" className="block text-sm font-medium mb-2">
              Content Type
            </label>
            <select
              id="contentType"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as 'text' | 'image' | 'both')}
              disabled={isPending}
              className="input disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="text">Text Only</option>
              <option value="image">Image Only</option>
              <option value="both">Text + Image</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">System Prompt</h2>
        <p className="text-sm text-gray-600 mb-4">
          Define the AI's role and behavior. This prompt is independent of global settings.
        </p>
        <textarea
          id="systemPrompt"
          name="systemPrompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          disabled={isPending}
          rows={6}
          className="input disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="You are a helpful AI assistant that generates creative content..."
        />
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">User Prompt</h2>
        <textarea
          id="prompt"
          name="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isPending}
          rows={6}
          className="input disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Describe what you want to generate..."
          required
        />
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Attachments</h2>
        <p className="text-sm text-gray-600 mb-4">
          Attach images, videos, audio files, or documents to provide context for generation.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="btn btn-secondary mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Attachments
        </button>

        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(attachment.type)}</span>
                  <div>
                    <p className="text-sm font-medium">{attachment.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(attachment.file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  disabled={isPending}
                  className="text-red-600 hover:text-red-800 text-sm px-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isPending && progress.total > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-900">{progress.message}</span>
            {progress.total > 0 && (
              <span className="text-sm text-blue-700">
                {progress.current} / {progress.total}
              </span>
            )}
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((progress.current / progress.total) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Generating content... Please do not close this tab.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button 
          type="submit" 
          className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={isPending || cancelling}
        >
          {isPending ? 'Generating...' : 'Generate Content'}
        </button>
        {isPending && (
          <button
            type="button"
            onClick={handleCancelGeneration}
            disabled={cancelling}
            className="btn btn-secondary disabled:opacity-50"
          >
            {cancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </div>

      {(generatedContent || generatedImages.length > 0) && (
        <div className="card bg-green-50 border-green-200">
          <h2 className="text-xl font-semibold mb-4">Generation Results</h2>
          
          {generatedContent && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Generated Text Content</h3>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border border-gray-200">
                  {generatedContent}
                </pre>
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent);
                    setSuccess('Content copied to clipboard!');
                    setTimeout(() => setSuccess(''), 2000);
                  }}
                  className="btn btn-secondary"
                >
                  📋 Copy Content
                </button>
                <a
                  href={`/gallery?postId=${encodeURIComponent(prompt.substring(0, 50))}`}
                  className="btn btn-secondary"
                >
                  📷 View in Gallery
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedContent('');
                    setGeneratedImages([]);
                    setPrompt('');
                    setSystemPrompt('');
                    setSelectedModel(defaultModel);
                    setContentType('text');
                    setAttachments([]);
                    setError('');
                    setSuccess('');
                  }}
                  className="btn btn-secondary"
                >
                  🔄 Generate New
                </button>
              </div>
            </div>
          )}

          {generatedImages.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Generated Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((url, index) => (
                  <div key={index} className="relative border border-gray-200 rounded overflow-hidden bg-white group">
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedImage({ url, alt: `Generated ${index + 1}` })}
                    >
                      <img
                        src={url}
                        alt={`Generated ${index + 1}`}
                        className="w-full h-auto group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 px-3 py-1.5 rounded-lg shadow-lg">
                          Click to preview
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage({ url, alt: `Generated ${index + 1}` });
                        }}
                        className="btn btn-sm btn-primary text-xs"
                      >
                        View
                      </button>
                      <a
                        href={url}
                        download={`generated-image-${Date.now()}-${index + 1}.png`}
                        className="btn btn-sm btn-secondary text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Download
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/gallery');
                        }}
                        className="btn btn-sm btn-secondary text-xs"
                      >
                        Gallery
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previous Generations */}
      {previousGenerations.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Previous Generations</h2>
            <button
              type="button"
              onClick={() => setShowPrevious(!showPrevious)}
              className="btn btn-secondary text-sm"
            >
              {showPrevious ? 'Hide' : 'Show'} ({previousGenerations.length})
            </button>
          </div>
          {showPrevious && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {previousGenerations.map((generation) => (
                <div
                  key={generation.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {generation.prompt}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{generation.contentType}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{generation.model}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(generation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        type="button"
                        onClick={() => loadPreviousGeneration(generation)}
                        className="btn btn-sm btn-secondary text-xs"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGeneration(generation.id)}
                        disabled={deletingGenerationId === generation.id}
                        className="btn btn-sm text-xs bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                      >
                        {deletingGenerationId === generation.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                  {generation.generatedText && (
                    <p className="text-xs text-gray-600 line-clamp-2 mt-2">
                      {generation.generatedText}
                    </p>
                  )}
                  {generation.generatedImages && generation.generatedImages.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {generation.generatedImages.slice(0, 3).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Previous ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImage({ url, alt: `Previous ${index + 1}` })}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTM4YTgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1nPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                      ))}
                      {generation.generatedImages.length > 3 && (
                        <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                          +{generation.generatedImages.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </form>
    </>
  );
}

