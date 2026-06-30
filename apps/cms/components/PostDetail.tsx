'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from './FileUpload';
import { uploadFile } from '@/app/actions/uploads';
import GeneratedMediaList from './GeneratedMediaList';
import { formatChatGPTPrompt } from '@/lib/chatgptPromptFormatter';

type Topic = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

type SlidePrompt = {
  slideNumber: number;
  imageDescription: string;
};

type Post = {
  id: string;
  topicId: string;
  postType: string;
  status: string;
  rawIdea: string;
  script: string | null;
  caption: string | null;
  hashtags: string | null;
  finchScreenshotUrl: string | null;
  aiBackgroundUrls: any;
  zipUrl: string | null;
  manualSlidePrompts?: SlidePrompt[] | null;
  createdAt: Date;
  updatedAt: Date;
  topic: Topic | null;
};

type GeneratedAsset = {
  id: string;
  kind: 'IMAGE_FEED' | 'IMAGE_STORY' | 'VIDEO_REEL_DRAFT';
  size: string;
  url: string;
  thumbnailUrl?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
};

type PostDetailProps = {
  post: Post;
  topics: Topic[];
  assets?: GeneratedAsset[];
  availableModels?: Array<{ value: string; label: string; cost: 'low' | 'medium' | 'high' }>;
  defaultModel?: string;
  onUpdate: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  onGenerateContent: (tone: 'educational' | 'validating' | 'gentle-cta', model?: string, systemPrompt?: string) => Promise<{ success: boolean; error?: string; post?: Post }>;
  onUpdateStatus: (status: 'DRAFT' | 'GENERATED' | 'APPROVED' | 'POSTED') => Promise<{ success: boolean; error?: string }>;
};

export default function PostDetail({
  post,
  topics,
  assets = [],
  availableModels = [],
  defaultModel = 'gpt-4o',
  onUpdate,
  onGenerateContent,
  onUpdateStatus,
}: PostDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generating, setGenerating] = useState<'educational' | 'validating' | 'gentle-cta' | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const generationAbortedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [finchScreenshotUrl, setFinchScreenshotUrl] = useState(post.finchScreenshotUrl || '');
  const [uploading, setUploading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [manualSlidePrompts, setManualSlidePrompts] = useState<SlidePrompt[]>(
    post.manualSlidePrompts || []
  );
  const [uploadingExternal, setUploadingExternal] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await uploadFile(formData);
      
      if (result.success && result.url) {
        setFinchScreenshotUrl(result.url);
        // Update post with new URL
        const updateFormData = new FormData();
        updateFormData.append('finchScreenshotUrl', result.url);
        await onUpdate(updateFormData);
        setSuccess('Screenshot uploaded successfully');
      } else {
        setError(result.error || 'Failed to upload file');
      }
    } catch (err) {
      setError('An error occurred while uploading the file');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const formData = new FormData(e.currentTarget);
    if (finchScreenshotUrl) {
      formData.append('finchScreenshotUrl', finchScreenshotUrl);
    }
    
    // Add manual slide prompts if this is a carousel post
    if (post.postType === 'CAROUSEL' && manualSlidePrompts.length > 0) {
      formData.append('manualSlidePrompts', JSON.stringify(manualSlidePrompts));
    }
    
    startTransition(async () => {
      const result = await onUpdate(formData);
      if (result.success) {
        setSuccess('Post updated successfully');
        router.refresh();
      } else {
        setError(result.error || 'Failed to update post');
      }
    });
  };

  const handleCancelGeneration = () => {
    if (generating && !cancelling) {
      setCancelling(true);
      generationAbortedRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Note: Server actions can't be directly cancelled, but we mark it as cancelled
      setTimeout(() => {
        setGenerating(null);
        setCancelling(false);
        setProgress({ current: 0, total: 0, message: '' });
        setError('Generation cancelled');
      }, 500);
    }
  };

  const handleGenerate = async (tone: 'educational' | 'validating' | 'gentle-cta', e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent event bubbling and default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent multiple simultaneous generations
    if (generating !== null) {
      return;
    }
    
    setGenerating(tone);
    setCancelling(false);
    setError('');
    setSuccess('');
    setProgress({ current: 0, total: 1, message: `Generating ${tone} content...` });
    generationAbortedRef.current = false;
    
    // Create abort controller for cancellation (though server actions can't be aborted)
    abortControllerRef.current = new AbortController();
    
    try {
      setProgress({ current: 0, total: 1, message: 'Connecting to AI service...' });
      
      const result = await onGenerateContent(tone, selectedModel);
      
      if (generationAbortedRef.current) {
        setProgress({ current: 0, total: 0, message: 'Generation cancelled' });
        setError('Generation was cancelled');
        return;
      }
      
      setProgress({ current: 1, total: 1, message: 'Complete!' });
      
      if (result.success) {
        setSuccess('Content generated successfully!');
        setTimeout(() => {
          setProgress({ current: 0, total: 0, message: '' });
        }, 2000);
        router.refresh();
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
        setError('An error occurred while generating content');
      }
    } finally {
      if (!generationAbortedRef.current) {
        setGenerating(null);
      }
    }
  };

  const handleStatusChange = async (status: 'DRAFT' | 'GENERATED' | 'APPROVED' | 'POSTED') => {
    setError('');
    setSuccess('');
    
    try {
      const result = await onUpdateStatus(status);
      if (result.success) {
        setSuccess(`Status updated to ${status}`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to update status');
      }
    } catch (err) {
      setError('An error occurred while updating status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'GENERATED':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'POSTED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Post Details</h1>
        <div className="flex items-center gap-3">
          {post.caption && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(post.caption || '');
                  setSuccess('Caption copied to clipboard!');
                  setTimeout(() => setSuccess(''), 3000);
                } catch (err) {
                  setError('Failed to copy caption');
                }
              }}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
              title="Copy caption to clipboard"
            >
              📋 Copy Caption
            </button>
          )}
          {post.hashtags && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(post.hashtags || '');
                  setSuccess('Hashtags copied to clipboard!');
                  setTimeout(() => setSuccess(''), 3000);
                } catch (err) {
                  setError('Failed to copy hashtags');
                }
              }}
              className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
              title="Copy hashtags to clipboard"
            >
              📋 Copy Hashtags
            </button>
          )}
          {(post.script || post.caption) && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const prompt = formatChatGPTPrompt({
                    rawIdea: post.rawIdea,
                    script: post.script,
                    caption: post.caption,
                    hashtags: post.hashtags,
                    postType: post.postType,
                    manualSlidePrompts: manualSlidePrompts.length > 0 ? manualSlidePrompts : null,
                  });
                  await navigator.clipboard.writeText(prompt);
                  setSuccess('ChatGPT prompt copied to clipboard!');
                  setTimeout(() => setSuccess(''), 3000);
                } catch (err) {
                  setError('Failed to copy ChatGPT prompt');
                }
              }}
              className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
              title="Copy formatted prompt for ChatGPT"
            >
              🤖 Copy ChatGPT Prompt
            </button>
          )}
          {(post.finchScreenshotUrl || (post.aiBackgroundUrls && Array.isArray(post.aiBackgroundUrls) && post.aiBackgroundUrls.length > 0)) && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const inputImages: string[] = [];
                  if (post.finchScreenshotUrl) {
                    inputImages.push(post.finchScreenshotUrl);
                  }
                  if (post.aiBackgroundUrls && Array.isArray(post.aiBackgroundUrls)) {
                    inputImages.push(...post.aiBackgroundUrls.filter((url): url is string => typeof url === 'string'));
                  }
                  
                  if (inputImages.length === 0) {
                    setError('No input images found');
                    return;
                  }

                  // Copy images one at a time
                  let successCount = 0;
                  for (let i = 0; i < inputImages.length; i++) {
                    try {
                      const response = await fetch(inputImages[i]);
                      if (!response.ok) continue;
                      
                      const blob = await response.blob();
                      await navigator.clipboard.write([
                        new ClipboardItem({
                          [blob.type]: blob,
                        }),
                      ]);
                      successCount++;
                      
                      if (i < inputImages.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                      }
                    } catch (err) {
                      console.warn(`Failed to copy image ${i + 1}:`, err);
                    }
                  }
                  
                  if (successCount > 0) {
                    setSuccess(`Copied ${successCount} input image(s) to clipboard!`);
                    setTimeout(() => setSuccess(''), 3000);
                  } else {
                    setError('Failed to copy images. Try downloading instead.');
                  }
                } catch (err) {
                  setError('Failed to copy input images');
                }
              }}
              className="px-3 py-1.5 text-sm bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
              title="Copy all input images (Finch screenshot, AI backgrounds) to clipboard"
            >
              📸 Copy Input Images
            </button>
          )}
          <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(post.status)}`}>
            {post.status}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Topic</label>
              <p className="text-gray-700">{post.topic?.name || 'No topic'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Post Type</label>
              <p className="text-gray-700">{post.postType}</p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={post.status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className="input"
              >
                <option value="DRAFT">Draft</option>
                <option value="GENERATED">Generated</option>
                <option value="APPROVED">Approved</option>
                <option value="POSTED">Posted</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Raw Idea</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{post.rawIdea}</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Finch Screenshot</h2>
          <FileUpload
            onUpload={handleFileUpload}
            currentUrl={finchScreenshotUrl || undefined}
            uploading={uploading}
          />
        </div>

        {/* Manual Slide Prompts - Only for CAROUSEL posts */}
        {post.postType === 'CAROUSEL' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Manual Slide Prompts</h2>
            <p className="text-sm text-gray-600 mb-4">
              Add custom image descriptions for each carousel slide. If provided, these will be used instead of parsing from the script.
            </p>
            
            <div className="space-y-3 mb-4">
              {manualSlidePrompts.map((prompt, index) => (
                <div key={index} className="flex gap-2 items-start p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-700 min-w-[80px]">
                        Slide {prompt.slideNumber}:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={prompt.slideNumber}
                        onChange={(e) => {
                          const updated = [...manualSlidePrompts];
                          updated[index] = {
                            ...updated[index],
                            slideNumber: parseInt(e.target.value) || 1,
                          };
                          // Sort by slide number
                          updated.sort((a, b) => a.slideNumber - b.slideNumber);
                          setManualSlidePrompts(updated);
                        }}
                        className="input text-sm w-20"
                      />
                    </div>
                    <textarea
                      value={prompt.imageDescription}
                      onChange={(e) => {
                        const updated = [...manualSlidePrompts];
                        updated[index] = {
                          ...updated[index],
                          imageDescription: e.target.value,
                        };
                        setManualSlidePrompts(updated);
                      }}
                      placeholder="Image description for this slide..."
                      className="input text-sm"
                      rows={2}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setManualSlidePrompts(manualSlidePrompts.filter((_, i) => i !== index));
                    }}
                    className="text-red-600 hover:text-red-800 text-sm px-2"
                    title="Remove slide"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => {
                const nextSlideNumber = manualSlidePrompts.length > 0
                  ? Math.max(...manualSlidePrompts.map(p => p.slideNumber)) + 1
                  : 1;
                setManualSlidePrompts([
                  ...manualSlidePrompts,
                  { slideNumber: nextSlideNumber, imageDescription: '' },
                ]);
              }}
              className="btn btn-secondary text-sm"
            >
              + Add Slide Prompt
            </button>
            
            {manualSlidePrompts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  // Sort by slide number
                  const sorted = [...manualSlidePrompts].sort((a, b) => a.slideNumber - b.slideNumber);
                  setManualSlidePrompts(sorted);
                }}
                className="btn btn-secondary text-sm ml-2"
              >
                Sort by Slide Number
              </button>
            )}
          </div>
        )}

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Generated Content</h2>
          
          {post.status === 'DRAFT' && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800 mb-2">
                Generate content using AI:
              </p>
              {availableModels.length > 0 && (
                <div className="mb-3">
                  <label htmlFor="model-select" className="block text-xs font-medium text-blue-900 mb-1">
                    Model:
                  </label>
                  <select
                    id="model-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="input text-sm w-full max-w-xs"
                    disabled={generating !== null}
                  >
                    {availableModels.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label} ({model.cost === 'low' ? '$' : model.cost === 'medium' ? '$$' : '$$$'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {generating === null && (
                <div className="flex space-x-2 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleGenerate('educational', e)}
                    disabled={isPending || uploading}
                    className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate (Educational)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleGenerate('validating', e)}
                    disabled={isPending || uploading}
                    className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate (Validating)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleGenerate('gentle-cta', e)}
                    disabled={isPending || uploading}
                    className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate (Gentle CTA)
                  </button>
                </div>
              )}
              {generating !== null && (
                <div className="space-y-3">
                  {/* Progress Bar */}
                  {progress.total > 0 && (
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
                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={handleCancelGeneration}
                    disabled={cancelling}
                    className="btn btn-secondary text-sm disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Generation'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="script" className="block text-sm font-medium mb-2">
                Script
              </label>
              <textarea
                id="script"
                name="script"
                rows={6}
                defaultValue={post.script || ''}
                className="input"
                placeholder="Generated script will appear here..."
              />
            </div>

            <div>
              <label htmlFor="caption" className="block text-sm font-medium mb-2">
                Caption
              </label>
              <textarea
                id="caption"
                name="caption"
                rows={4}
                defaultValue={post.caption || ''}
                className="input"
                placeholder="Generated caption will appear here..."
              />
            </div>

            <div>
              <label htmlFor="hashtags" className="block text-sm font-medium mb-2">
                Hashtags
              </label>
              <textarea
                id="hashtags"
                name="hashtags"
                rows={2}
                defaultValue={post.hashtags || ''}
                className="input"
                placeholder="Generated hashtags will appear here..."
              />
            </div>
          </div>
        </div>

        {post.aiBackgroundUrls && Array.isArray(post.aiBackgroundUrls) && post.aiBackgroundUrls.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">AI Background Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {post.aiBackgroundUrls.map((url: string, index: number) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={url}
                    alt={`AI background ${index + 1}`}
                    className="w-full h-auto rounded border border-gray-200 hover:border-blue-500 transition-colors"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      const isOpenAIUrl = img.src.includes('oaidalleapiprodscus.blob.core.windows.net') || 
                                         img.src.includes('openai.com');
                      img.src = isOpenAIUrl 
                        ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzkzOGE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkV4cGlyZWQ8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOWM5YTk3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+'
                        : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzkzOGE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Generated Media Section */}
        {(post.status === 'GENERATED' || post.status === 'APPROVED' || post.status === 'POSTED') && (
          <GeneratedMediaList
            postId={post.id}
            assets={assets}
            canGenerate={!!(post.script && post.caption)}
            availableModels={availableModels}
            defaultModel="dall-e-3"
            onAssetsUpdated={() => router.refresh()}
          />
        )}

        {post.zipUrl && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Download Bundle</h2>
            <a
              href={post.zipUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary inline-block"
            >
              Download Bundle
            </a>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={async () => {
              if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                return;
              }
              const { deletePost } = await import('@/app/actions/posts');
              const result = await deletePost(post.id);
              if (result.success) {
                router.push('/');
              } else {
                setError(result.error || 'Failed to delete post');
              }
            }}
            className="btn btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={isPending || generating !== null || uploading}
          >
            Delete Post
          </button>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
              disabled={isPending || generating !== null || uploading}
            >
              Back
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending || generating !== null || uploading}
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

