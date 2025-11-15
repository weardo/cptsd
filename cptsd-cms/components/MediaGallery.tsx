'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { deleteAsset } from '@/app/actions/assets';
import { deleteStandaloneGeneration } from '@/app/actions/standalone';
import { uploadGalleryImage } from '@/app/actions/uploads';
import ImageModal from './ImageModal';

type Asset = {
  id: string;
  _id: string;
  postId: string;
  blogId?: string;
  kind: 'IMAGE_FEED' | 'IMAGE_STORY' | 'VIDEO_REEL_DRAFT' | 'IMAGE_CAROUSEL_SLIDE';
  size: string;
  url: string;
  thumbnailUrl?: string | null;
  slideNumber?: number | null;
  metadata?: {
    prompt?: string;
    model?: string;
    revised_prompt?: string;
    slideDescription?: string;
    generationParams?: {
      size?: string;
      quality?: string;
      style?: string;
    };
  } | null;
  post?: {
    id: string;
    _id: string;
    rawIdea: string;
    postType: string;
    status: string;
  } | null;
  blog?: {
    id: string;
    _id: string;
    title: string;
    slug: string;
    status: string;
  } | null;
  source?: 'post' | 'blog' | 'standalone';
  standaloneGeneration?: {
    id: string;
    prompt: string;
    systemPrompt?: string;
    contentType: string;
    generatedText?: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
};

type Post = {
  id: string;
  _id: string;
  rawIdea?: string | null;
  postType?: string | null;
  status?: string | null;
};

type MediaGalleryProps = {
  assets: Asset[];
  posts: Post[];
};

export default function MediaGallery({ assets: initialAssets, posts }: MediaGalleryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const [filterPostId, setFilterPostId] = useState(searchParams.get('postId') || '');
  const [filterKind, setFilterKind] = useState(searchParams.get('kind') || '');
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteAsset = async (assetId: string, asset: Asset) => {
    if (!confirm('Are you sure you want to delete this asset?')) {
      return;
    }

    startTransition(async () => {
      try {
        // If it's a standalone generation, delete the whole generation
        if (asset.source === 'standalone' && asset.standaloneGeneration) {
          const result = await deleteStandaloneGeneration(asset.standaloneGeneration.id);
          if (result.success) {
            setAssets((prev) => prev.filter((a) => 
              !(a.source === 'standalone' && a.standaloneGeneration?.id === asset.standaloneGeneration?.id)
            ));
            setSuccess('Generation deleted successfully');
            router.refresh();
            setTimeout(() => setSuccess(''), 3000);
          } else {
            setError(result.error || 'Failed to delete generation');
          }
        } else {
          // Regular post asset
          const result = await deleteAsset(assetId);
          if (result.success) {
            setAssets((prev) => prev.filter((a) => a.id !== assetId));
            setSuccess('Asset deleted successfully');
            router.refresh();
            setTimeout(() => setSuccess(''), 3000);
          } else {
            setError(result.error || 'Failed to delete asset');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete asset');
      }
    });
  };

  const handleFilterChange = (postId: string, kind: string) => {
    setFilterPostId(postId);
    setFilterKind(kind);
    
    const params = new URLSearchParams();
    if (postId) params.set('postId', postId);
    if (kind) params.set('kind', kind);
    
    router.push(`/gallery?${params.toString()}`);
    router.refresh();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadGalleryImage(formData);

      if (result.success && result.url) {
        // Add the new asset to the list
        const newAsset: Asset = {
          id: result.assetId || Date.now().toString(),
          _id: result.assetId || Date.now().toString(),
          postId: '',
          kind: 'IMAGE_FEED',
          size: '1080x1080',
          url: result.url,
          thumbnailUrl: result.url,
          slideNumber: null,
          metadata: {
            prompt: 'Manually uploaded image',
            model: 'manual-upload',
          },
          post: null,
          blog: null,
          source: 'post', // Will be treated as standalone
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setAssets((prev) => [newAsset, ...prev]);
        setSuccess('Image uploaded successfully!');
        router.refresh();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to upload image');
      }
    } catch (err) {
      setError('An error occurred while uploading the image');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const copyImageUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      setError('Failed to copy URL to clipboard');
    }
  };

  const getKindLabel = (kind: string, slideNumber?: number | null) => {
    switch (kind) {
      case 'IMAGE_FEED':
        return 'Feed';
      case 'IMAGE_STORY':
        return 'Story';
      case 'VIDEO_REEL_DRAFT':
        return 'Reel (Draft)';
      case 'IMAGE_CAROUSEL_SLIDE':
        return slideNumber ? `Slide ${slideNumber}` : 'Carousel Slide';
      default:
        return kind;
    }
  };

  const getKindBadgeColor = (kind: string) => {
    switch (kind) {
      case 'IMAGE_FEED':
        return 'bg-blue-100 text-blue-800';
      case 'IMAGE_STORY':
        return 'bg-purple-100 text-purple-800';
      case 'VIDEO_REEL_DRAFT':
        return 'bg-green-100 text-green-800';
      case 'IMAGE_CAROUSEL_SLIDE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

      <div className="space-y-6">
        {/* Upload Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Upload Images</h2>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          <p className="text-sm text-gray-600">
            Upload images to the gallery. Images will be saved to S3 and available for use in your content.
          </p>
        </div>

        {/* Filters */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="filterPost" className="block text-sm font-medium mb-2">
                Filter by Post
              </label>
              <select
                id="filterPost"
                value={filterPostId}
                onChange={(e) => handleFilterChange(e.target.value, filterKind)}
                className="input"
              >
                <option value="">All Posts</option>
                {posts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.rawIdea?.substring(0, 50) || post.id} ({post.postType})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filterKind" className="block text-sm font-medium mb-2">
                Filter by Type
              </label>
              <select
                id="filterKind"
                value={filterKind}
                onChange={(e) => handleFilterChange(filterPostId, e.target.value)}
                className="input"
              >
                <option value="">All Types</option>
                <option value="IMAGE_FEED">Feed Images</option>
                <option value="IMAGE_STORY">Story Images</option>
                <option value="VIDEO_REEL_DRAFT">Reel Drafts</option>
                <option value="IMAGE_CAROUSEL_SLIDE">Carousel Slides</option>
              </select>
            </div>
          </div>
        </div>

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

        {/* Stats */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {assets.length} asset{assets.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Gallery Grid */}
        {assets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No assets found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
              >
                {/* Thumbnail */}
                <div
                  className="relative bg-gray-100 aspect-square cursor-pointer group overflow-hidden"
                  onClick={() => setSelectedImage({ url: asset.url, alt: `${asset.kind} - ${asset.size}` })}
                >
                  <img
                    src={asset.thumbnailUrl || asset.url}
                    alt={`${asset.kind} - ${asset.size}`}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      const originalSrc = img.src;
                      
                      // Check if this is an OpenAI URL (expired)
                      const isOpenAIUrl = originalSrc.includes('oaidalleapiprodscus.blob.core.windows.net') || 
                                         originalSrc.includes('openai.com');
                      
                      // Check if this is an S3/MinIO URL (should not be marked as expired)
                      const isS3Url = originalSrc.includes('minio') || 
                                     originalSrc.includes('s3') || 
                                     originalSrc.includes('localhost:9000') ||
                                     originalSrc.includes('127.0.0.1:9000') ||
                                     originalSrc.includes('cptsd-cms');
                      
                      // If image failed to load, try the main URL if it's different
                      if (asset.thumbnailUrl && img.src === asset.thumbnailUrl && asset.url !== asset.thumbnailUrl && !isOpenAIUrl) {
                        img.src = asset.url;
                      } else if (isS3Url) {
                        // For S3 images, just show a generic error (not expired)
                        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzkzOGE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                        const container = img.parentElement;
                        if (container) {
                          container.setAttribute('data-error', 'true');
                        }
                      } else {
                        // Fallback to placeholder with expired indicator (only for OpenAI URLs)
                        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzkzOGE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkV4cGlyZWQ8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOWM5YTk3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+';
                        
                        // Add error indicator
                        const container = img.parentElement;
                        if (container) {
                          if (isOpenAIUrl) {
                            container.setAttribute('data-expired', 'true');
                            // Add a badge indicating the image expired
                            const badge = document.createElement('div');
                            badge.className = 'absolute top-2 left-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded z-10';
                            badge.textContent = 'Expired';
                            container.appendChild(badge);
                          } else {
                            container.setAttribute('data-error', 'true');
                          }
                        }
                      }
                    }}
                  />
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getKindBadgeColor(
                        asset.kind
                      )}`}
                    >
                      {getKindLabel(asset.kind, asset.slideNumber)}
                    </span>
                    {asset.source === 'blog' && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                        Blog
                      </span>
                    )}
                    {asset.source === 'standalone' && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                        Standalone
                      </span>
                    )}
                  </div>
                  {/* Overlay hint */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 px-3 py-1.5 rounded-lg shadow-lg">
                      Click to preview
                    </span>
                  </div>
                </div>

                {/* Asset Info */}
                <div className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 truncate">{asset.size}</p>
                      {asset.source === 'blog' && asset.blog && (
                        <p className="text-xs text-gray-400 truncate mt-1">
                          Blog: {asset.blog.title?.substring(0, 30) || asset.blog.id}
                        </p>
                      )}
                      {asset.source === 'post' && asset.post && (
                        <p className="text-xs text-gray-400 truncate mt-1">
                          Post: {asset.post.rawIdea?.substring(0, 30) || asset.post.id}
                        </p>
                      )}
                      {asset.standaloneGeneration && (
                        <p className="text-xs text-purple-600 truncate mt-1">
                          Standalone: {asset.standaloneGeneration.prompt.substring(0, 30)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAsset(asset.id, asset);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Delete asset"
                      disabled={isPending}
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyImageUrl(asset.url);
                      }}
                      className="flex-1 text-center px-2 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                    >
                      {copiedUrl === asset.url ? 'Copied!' : 'Copy URL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImage({ url: asset.url, alt: `${asset.kind} - ${asset.size}` })}
                      className="flex-1 text-center px-2 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                    >
                      Preview
                    </button>
                      {asset.post && (
                        <button
                          type="button"
                          onClick={() => router.push(`/posts/${asset.post?.id}`)}
                          className="flex-1 text-center px-2 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                        >
                          View Post
                        </button>
                      )}
                      {asset.standaloneGeneration && (
                        <span className="flex-1 text-center px-2 py-1.5 text-xs bg-purple-50 text-purple-700 rounded">
                          Standalone
                        </span>
                      )}
                    <a
                      href={asset.url}
                      download
                      className="flex-1 text-center px-2 py-1.5 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

