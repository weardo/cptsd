'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateBlog, regenerateBlog } from '@/app/actions/blogs';
import DeleteButton from './DeleteButton';

type Topic = {
  id: string;
  name: string;
  slug: string;
};

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  transcription: string | null;
  summary: string | null;
  status: string;
  featuredImage: string | null;
  images: Array<{
    url: string;
    alt: string;
    position: number;
    prompt?: string;
  }>;
  topicId: string | null;
  topic: Topic | null;
  publishedAt: Date | null;
  readingTime: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: string[];
  customContent: string | null;
  regenerationHistory: Array<{
    timestamp: Date;
    content: string;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

type BlogDetailProps = {
  blog: Blog;
  topics: Topic[];
};

export default function BlogDetail({ blog, topics }: BlogDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateBlog(blog.id, formData);
      if (result.success) {
        setSuccess('Blog updated successfully');
        router.refresh();
      } else {
        setError(result.error || 'Failed to update blog');
      }
    });
  };

  const handleRegenerate = async (options: {
    rephrase?: boolean;
    summarize?: boolean;
    regenerateImages?: boolean;
  }) => {
    setRegenerating(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    if (blog.customContent) {
      formData.append('customContent', blog.customContent);
    }

    startTransition(async () => {
      const result = await regenerateBlog(blog.id, {
        ...options,
        customContent: blog.customContent || undefined,
      });

      if (result.success) {
        setSuccess('Blog regenerated successfully');
        setShowRegenerateOptions(false);
        router.refresh();
      } else {
        setError(result.error || 'Failed to regenerate blog');
      }
      setRegenerating(false);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'GENERATING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(blog.status)}`}>
              {blog.status}
            </span>
            {blog.topic && (
              <span className="text-sm text-gray-500">{blog.topic.name}</span>
            )}
            {blog.readingTime && (
              <span className="text-sm text-gray-400">{blog.readingTime} min read</span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{blog.title}</h1>
          {blog.excerpt && (
            <p className="text-gray-600 mt-2">{blog.excerpt}</p>
          )}
        </div>
        <DeleteButton
          onDelete={async () => {
            const { deleteBlog } = await import('@/app/actions/blogs');
            return await deleteBlog(blog.id);
          }}
          itemName="blog post"
          redirectPath="/blogs"
        />
      </div>

      {/* YouTube Info */}
      {blog.youtubeUrl && (
        <div className="card bg-blue-50">
          <p className="text-sm text-blue-800">
            <strong>Source:</strong>{' '}
            <a
              href={blog.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {blog.youtubeUrl}
            </a>
          </p>
        </div>
      )}

      {/* Regenerate Options */}
      {blog.transcription && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Regenerate Blog</h2>
            <button
              type="button"
              onClick={() => setShowRegenerateOptions(!showRegenerateOptions)}
              className="btn btn-secondary text-sm"
            >
              {showRegenerateOptions ? 'Hide Options' : 'Show Options'}
            </button>
          </div>

          {showRegenerateOptions && (
            <div className="space-y-4 p-4 bg-gray-50 rounded">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleRegenerate({ rephrase: true })}
                  disabled={regenerating}
                  className="btn btn-secondary"
                >
                  {regenerating ? 'Regenerating...' : 'Rephrase Content'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRegenerate({ summarize: true })}
                  disabled={regenerating}
                  className="btn btn-secondary"
                >
                  {regenerating ? 'Regenerating...' : 'Summarize'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRegenerate({ regenerateImages: true })}
                  disabled={regenerating}
                  className="btn btn-secondary"
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate Images'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleRegenerate({
                      rephrase: true,
                      regenerateImages: true,
                    })
                  }
                  disabled={regenerating}
                  className="btn btn-primary"
                >
                  {regenerating ? 'Regenerating...' : 'Full Regeneration'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
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

      {/* Edit Form */}
      <form onSubmit={handleSave} className="card space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={blog.title}
            className="input w-full"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-2">
            Slug *
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            defaultValue={blog.slug}
            className="input w-full"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium mb-2">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={3}
            defaultValue={blog.excerpt || ''}
            className="input w-full"
            placeholder="Brief excerpt for the blog post..."
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            Content * (Markdown supported)
          </label>
          <textarea
            id="content"
            name="content"
            rows={20}
            required
            defaultValue={blog.content}
            className="input w-full font-mono text-sm"
          />
        </div>

        <div>
          <label htmlFor="topicId" className="block text-sm font-medium mb-2">
            Topic
          </label>
          <select id="topicId" name="topicId" className="input w-full">
            <option value="">No topic</option>
            {topics.map((topic) => (
              <option
                key={topic.id}
                value={topic.id}
                selected={blog.topicId === topic.id}
              >
                {topic.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </label>
          <select id="status" name="status" className="input w-full">
            <option value="DRAFT" selected={blog.status === 'DRAFT'}>
              Draft
            </option>
            <option value="PUBLISHED" selected={blog.status === 'PUBLISHED'}>
              Published
            </option>
            <option value="ARCHIVED" selected={blog.status === 'ARCHIVED'}>
              Archived
            </option>
          </select>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            defaultValue={blog.tags.join(', ')}
            className="input w-full"
            placeholder="tag1, tag2, tag3"
          />
        </div>

        <div>
          <label htmlFor="seoTitle" className="block text-sm font-medium mb-2">
            SEO Title
          </label>
          <input
            type="text"
            id="seoTitle"
            name="seoTitle"
            defaultValue={blog.seoTitle || ''}
            className="input w-full"
          />
        </div>

        <div>
          <label htmlFor="seoDescription" className="block text-sm font-medium mb-2">
            SEO Description
          </label>
          <textarea
            id="seoDescription"
            name="seoDescription"
            rows={2}
            defaultValue={blog.seoDescription || ''}
            className="input w-full"
          />
        </div>

        <div className="flex space-x-4">
          <button type="submit" disabled={isPending} className="btn btn-primary">
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
            disabled={isPending}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Images */}
      {blog.images && blog.images.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Generated Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {blog.images.map((image, index) => (
              <div key={index} className="border rounded p-2">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <p className="text-xs text-gray-600">{image.alt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcription (if available) */}
      {blog.transcription && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Original Transcription</h2>
          <div className="bg-gray-50 p-4 rounded max-h-64 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {blog.transcription.substring(0, 1000)}
              {blog.transcription.length > 1000 && '...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

