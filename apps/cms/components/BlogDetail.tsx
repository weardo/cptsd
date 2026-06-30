'use client';

import { useState, useTransition, useEffect } from 'react';
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
  estimatedReadTime?: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  metaDescription?: string | null;
  purpose?: string | null;
  targetReader?: string | null;
  tags: string[];
  category?: string | null;
  relatedArticles?: string[];
  isLearnResource?: boolean;
  featured?: boolean;
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
  blogs?: Array<{ id: string; title: string; slug: string }>;
};

export default function BlogDetail({ blog, topics, blogs = [] }: BlogDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);
  
  // New fields state
  const [tags, setTags] = useState<string[]>(blog.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState(blog.category || '');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [selectedRelatedArticles, setSelectedRelatedArticles] = useState<string[]>(blog.relatedArticles || []);
  const [relatedArticleSearch, setRelatedArticleSearch] = useState('');
  const [showRelatedArticleDropdown, setShowRelatedArticleDropdown] = useState(false);
  const [isLearnResource, setIsLearnResource] = useState((blog as any).isLearnResource || false);
  const [featured, setFeatured] = useState((blog as any).featured || false);
  
  // Helper functions
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__new__') {
      setShowNewCategoryInput(true);
      setCategory('');
    } else {
      setCategory(value);
      setShowNewCategoryInput(false);
      setNewCategory('');
    }
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      const categoryValue = newCategory.trim().toUpperCase().replace(/\s+/g, '_');
      setCategory(categoryValue);
      setShowNewCategoryInput(false);
      setNewCategory('');
    }
  };

  // Filter blogs for related articles search
  const filteredBlogsForRelated = blogs.filter(b => {
    if (b.id === blog.id) return false;
    if (selectedRelatedArticles.includes(b.id)) return false;
    if (!relatedArticleSearch.trim()) return true;
    return b.title.toLowerCase().includes(relatedArticleSearch.toLowerCase()) ||
           b.slug.toLowerCase().includes(relatedArticleSearch.toLowerCase());
  });

  const handleAddRelatedArticle = (articleId: string) => {
    if (!selectedRelatedArticles.includes(articleId)) {
      setSelectedRelatedArticles([...selectedRelatedArticles, articleId]);
      setRelatedArticleSearch('');
      setShowRelatedArticleDropdown(false);
    }
  };

  const handleRemoveRelatedArticle = (articleId: string) => {
    setSelectedRelatedArticles(selectedRelatedArticles.filter(id => id !== articleId));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/html'), 10);
    
    if (dragIndex !== dropIndex) {
      const newOrder = [...selectedRelatedArticles];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, removed);
      setSelectedRelatedArticles(newOrder);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-related-articles-dropdown]')) {
        setShowRelatedArticleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    
    // Add new fields to formData
    if (category) formData.set('category', category);
    if (tags.length > 0) formData.set('tags', JSON.stringify(tags));
    if (selectedRelatedArticles.length > 0) {
      formData.set('relatedArticles', JSON.stringify(selectedRelatedArticles));
    }
    formData.set('isLearnResource', isLearnResource ? 'true' : 'false');
    formData.set('featured', featured ? 'true' : 'false');
    
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
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Category
          </label>
          <select 
            id="category" 
            name="category" 
            className="input w-full"
            value={category}
            onChange={handleCategoryChange}
          >
            <option value="">Select a category</option>
            <option value="BASICS">Basics</option>
            <option value="INDIA_CONTEXT">India Context</option>
            <option value="DAILY_LIFE">Daily Life</option>
            <option value="HEALING">Healing</option>
            <option value="RELATIONSHIPS">Relationships</option>
            <option value="__new__">+ Add New Category</option>
          </select>
          {showNewCategoryInput && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category name"
                className="input flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewCategory();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddNewCategory}
                className="btn btn-secondary"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewCategoryInput(false);
                  setNewCategory('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="purpose" className="block text-sm font-medium mb-2">
            Purpose
          </label>
          <textarea
            id="purpose"
            name="purpose"
            rows={2}
            defaultValue={blog.purpose || ''}
            className="input w-full"
            placeholder="What is the purpose of this article?"
          />
        </div>

        <div>
          <label htmlFor="targetReader" className="block text-sm font-medium mb-2">
            Target Reader
          </label>
          <input
            type="text"
            id="targetReader"
            name="targetReader"
            defaultValue={blog.targetReader || ''}
            className="input w-full"
            placeholder="Who is this article for?"
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
          <label htmlFor="metaDescription" className="block text-sm font-medium mb-2">
            Meta Description
          </label>
          <textarea
            id="metaDescription"
            name="metaDescription"
            rows={3}
            defaultValue={blog.metaDescription || blog.seoDescription || ''}
            className="input w-full"
            placeholder="Brief description for search engines"
          />
        </div>

        <div>
          <label htmlFor="estimatedReadTime" className="block text-sm font-medium mb-2">
            Estimated Read Time (minutes)
          </label>
          <input
            type="number"
            id="estimatedReadTime"
            name="estimatedReadTime"
            min="1"
            defaultValue={blog.estimatedReadTime || blog.readingTime || ''}
            className="input w-full"
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium">Mark as Featured</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            If checked, this article will be displayed in the "Featured reading" section on the homepage
          </p>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isLearnResource}
              onChange={(e) => setIsLearnResource(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium">Mark as Learn Resource</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            If checked, this article will be displayed under /learn route in cptsd-main (cptsd.in/learn/{'{slug}'}) instead of /blog/{'{slug}'} and will appear on the Learn page
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Tags / Hashtags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              className="input flex-1"
              placeholder="Enter a tag and press Enter"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn btn-secondary"
            >
              Add Tag
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div data-related-articles-dropdown>
          <label className="block text-sm font-medium mb-2">
            Related Articles (Manually Selected)
          </label>
          <div className="relative">
            <input
              type="text"
              value={relatedArticleSearch}
              onChange={(e) => {
                setRelatedArticleSearch(e.target.value);
                setShowRelatedArticleDropdown(true);
              }}
              onFocus={() => setShowRelatedArticleDropdown(true)}
              placeholder="Search and select articles..."
              className="input w-full"
            />
            {showRelatedArticleDropdown && filteredBlogsForRelated.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredBlogsForRelated.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleAddRelatedArticle(b.id)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-sm text-gray-900">{b.title}</div>
                    <div className="text-xs text-gray-500">{b.slug}</div>
                  </button>
                ))}
              </div>
            )}
            {showRelatedArticleDropdown && relatedArticleSearch.trim() && filteredBlogsForRelated.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-sm text-gray-500">
                No articles found matching "{relatedArticleSearch}"
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Search and select articles one by one. These will be displayed separately from auto-suggested related articles.
          </p>
          
          {/* Selected Articles List */}
          {selectedRelatedArticles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Selected Articles (drag to reorder):
              </p>
              <div className="space-y-2">
                {selectedRelatedArticles.map((articleId, index) => {
                  const article = blogs.find(b => b.id === articleId);
                  return article ? (
                    <div
                      key={articleId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex flex-col gap-1 text-gray-400 group-hover:text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">{article.title}</div>
                          <div className="text-xs text-gray-500 truncate">{article.slug}</div>
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                          #{index + 1}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRelatedArticle(articleId)}
                        className="ml-3 text-red-600 hover:text-red-800 transition-colors"
                        title="Remove article"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
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

