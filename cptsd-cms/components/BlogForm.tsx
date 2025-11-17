'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBlog, transcribeAndGenerateBlog, searchBlogStockImages, generateBlogTopicsAI, generateBlogFromTopic } from '@/app/actions/blogs';
import { uploadBlogImage } from '@/app/actions/uploads';

type Topic = {
  id: string;
  name: string;
  slug: string;
};

type Blog = {
  id: string;
  title: string;
  slug: string;
};

type BlogFormProps = {
  topics: Topic[];
  blogs?: Blog[]; // For related articles selection
  initialBlog?: {
    id: string;
    title: string;
    content: string;
    youtubeUrl?: string | null;
    topicId?: string | null;
    customContent?: string | null;
    slug?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    metaDescription?: string | null;
    purpose?: string | null;
    targetReader?: string | null;
    estimatedReadTime?: number | null;
    readingTime?: number | null;
    tags?: string[];
    category?: string | null;
    relatedArticles?: string[];
    isLearnResource?: boolean;
    featured?: boolean;
  } | null;
};

type ImageSource = 'generate' | 'stock' | 'none';

export default function BlogForm({ topics, blogs = [], initialBlog }: BlogFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState(initialBlog?.youtubeUrl || '');
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<'manual' | 'youtube' | 'topic'>('youtube');
  const [tone, setTone] = useState<'educational' | 'validating' | 'gentle' | 'hopeful' | 'grounding'>('gentle');
  const [imageSource, setImageSource] = useState<ImageSource>('none');
  const [generateImage, setGenerateImage] = useState(false);
  const [rephrase, setRephrase] = useState(false);
  const [summarize, setSummarize] = useState(false);
  const [customContent, setCustomContent] = useState(initialBlog?.customContent || '');
  const [showTopicGenerator, setShowTopicGenerator] = useState(false);
  
  // New fields state
  const [slug, setSlug] = useState(initialBlog?.slug || '');
  const [seoTitle, setSeoTitle] = useState(initialBlog?.seoTitle || initialBlog?.seoTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialBlog?.metaDescription || initialBlog?.seoDescription || '');
  const [purpose, setPurpose] = useState(initialBlog?.purpose || '');
  const [targetReader, setTargetReader] = useState(initialBlog?.targetReader || '');
  const [estimatedReadTime, setEstimatedReadTime] = useState(initialBlog?.estimatedReadTime || initialBlog?.readingTime || '');
  const [tags, setTags] = useState<string[]>(initialBlog?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState(initialBlog?.category || '');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [selectedRelatedArticles, setSelectedRelatedArticles] = useState<string[]>(initialBlog?.relatedArticles || []);
  const [isLearnResource, setIsLearnResource] = useState(initialBlog?.isLearnResource || false);
  const [featured, setFeatured] = useState(initialBlog?.featured || false);
  const [relatedArticleSearch, setRelatedArticleSearch] = useState('');
  const [showRelatedArticleDropdown, setShowRelatedArticleDropdown] = useState(false);

  // Auto-show topic generator when in topic mode
  useEffect(() => {
    if (mode === 'topic') {
      setShowTopicGenerator(true);
    }
  }, [mode]);
  const [topicTheme, setTopicTheme] = useState('');
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState<any[]>([]);
  const [showStockImageSearch, setShowStockImageSearch] = useState(false);
  const [stockImageQuery, setStockImageQuery] = useState('');
  const [stockImages, setStockImages] = useState<any[]>([]);
  const [searchingImages, setSearchingImages] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 5, message: '', step: 0 });
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; alt: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedImageIndex, setCopiedImageIndex] = useState<number | null>(null);

  // Steps for blog generation
  const steps = [
    { name: 'Transcribing video', weight: 1 },
    { name: 'Fetching metadata', weight: 0.5 },
    { name: 'Generating blog content', weight: 2 },
    { name: 'Generating images', weight: 1.5 },
    { name: 'Finalizing', weight: 0.5 },
  ];

  // Simulate progress updates during generation
  useEffect(() => {
    if (generating) {
      const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
      let currentWeight = 0;
      let currentStep = 0;

      const updateProgress = () => {
        if (currentStep < steps.length) {
          const step = steps[currentStep];
          const stepProgress = Math.min((currentWeight / totalWeight) * 100, 95); // Cap at 95% until done
          
          setProgress({
            current: Math.floor(stepProgress),
            total: 100,
            message: step.name,
            step: currentStep,
          });

          // Move to next step after estimated time
          const stepTime = step.weight * 20000; // 20 seconds per weight unit
          currentWeight += step.weight;
          
          if (currentWeight < totalWeight) {
            currentStep++;
            setTimeout(updateProgress, stepTime);
          }
        }
      };

      // Start progress simulation
      setProgress({
        current: 0,
        total: 100,
        message: steps[0].name,
        step: 0,
      });
      
      progressIntervalRef.current = setTimeout(updateProgress, 1000);
    } else {
      // Reset progress when not generating
      if (progressIntervalRef.current) {
        clearTimeout(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress({ current: 0, total: 5, message: '', step: 0 });
    }

    return () => {
      if (progressIntervalRef.current) {
        clearTimeout(progressIntervalRef.current);
      }
    };
  }, [generating]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (mode === 'youtube' && youtubeUrl) {
      // Generate from YouTube
      setGenerating(true);
      startTransition(async () => {
        const result = await transcribeAndGenerateBlog(youtubeUrl, {
          tone,
          includeImages: generateImage,
          rephrase,
          summarize,
          customContent: customContent && customContent.trim() ? customContent.trim() : undefined,
        });

        if (result.success && result.blog) {
          setProgress({ current: 100, total: 100, message: 'Complete!', step: steps.length - 1 });
          setTimeout(() => {
            router.push(`/blogs/${result.blog.id}`);
            router.refresh();
          }, 500);
        } else {
          setError(result.error || 'Failed to generate blog from YouTube video');
          setGenerating(false);
          setProgress({ current: 0, total: 5, message: '', step: 0 });
        }
      });
    } else if (mode === 'topic') {
      // Topic mode - handled by handleGenerateFromTopic
      setError('Please select a topic from the generated topics below and click "Generate Blog"');
    } else {
      // Manual creation
      const formData = new FormData(e.currentTarget);
      
      // Add new fields to formData
      if (slug) formData.set('slug', slug);
      if (seoTitle) formData.set('seoTitle', seoTitle);
      if (metaDescription) formData.set('metaDescription', metaDescription);
      if (purpose) formData.set('purpose', purpose);
      if (targetReader) formData.set('targetReader', targetReader);
      if (estimatedReadTime) formData.set('estimatedReadTime', estimatedReadTime.toString());
      if (category) formData.set('category', category);
      if (tags.length > 0) formData.set('tags', JSON.stringify(tags));
      if (selectedRelatedArticles.length > 0) {
        formData.set('relatedArticles', JSON.stringify(selectedRelatedArticles));
      }
      formData.set('isLearnResource', isLearnResource ? 'true' : 'false');
      formData.set('featured', featured ? 'true' : 'false');
      
      startTransition(async () => {
        const result = await createBlog(formData);
        if (result.success && result.blog) {
          router.push(`/blogs/${result.blog.id}`);
          router.refresh();
        } else {
          setError(result.error || 'Failed to create blog');
        }
      });
    }
  };

  const handleGenerateFromTopic = async (topic: any) => {
    setError('');
    setGenerating(true);
    
    startTransition(async () => {
      const result = await generateBlogFromTopic(
        topic.title,
        topic.description,
        {
          keyPoints: topic.keyPoints || [],
          tone,
          includeImages: generateImage,
          customContent: customContent && customContent.trim() ? customContent.trim() : undefined,
        }
      );

      if (result.success && result.blog) {
        setProgress({ current: 100, total: 100, message: 'Complete!', step: steps.length - 1 });
        setTimeout(() => {
          router.push(`/blogs/${result.blog.id}`);
          router.refresh();
        }, 500);
      } else {
        setError(result.error || 'Failed to generate blog from topic');
        setGenerating(false);
        setProgress({ current: 0, total: 5, message: '', step: 0 });
      }
    });
  };

  const handleGenerateTopics = async () => {
    if (!topicTheme.trim()) {
      setError('Please enter a theme or keyword');
      return;
    }

    setGeneratingTopics(true);
    setError('');
    try {
      const result = await generateBlogTopicsAI(topicTheme, 5);
      if (result.success) {
        setGeneratedTopics(result.topics);
      } else {
        setError(result.error || 'Failed to generate topics');
      }
    } catch (err) {
      setError('Failed to generate topics');
    } finally {
      setGeneratingTopics(false);
    }
  };

  const handleSearchStockImages = async () => {
    if (!stockImageQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setSearchingImages(true);
    setError('');
    try {
      const result = await searchBlogStockImages(stockImageQuery, 1);
      if (result.success) {
        setStockImages(result.images);
      } else {
        setError(result.error || 'Failed to search images');
      }
    } catch (err) {
      setError('Failed to search images');
    } finally {
      setSearchingImages(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadBlogImage(formData);

      if (result.success && result.url) {
        const altText = file.name.replace(/\.[^/.]+$/, ''); // Remove extension for alt text
        setUploadedImages([...uploadedImages, { url: result.url, alt: altText }]);
      } else {
        setError(result.error || 'Failed to upload image');
      }
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
      // Reset input
      e.target.value = '';
    }
  };

  const copyImageEmbed = async (url: string, alt: string, index: number) => {
    const embedCode = `![${alt}](${url})`;
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedImageIndex(index);
      setTimeout(() => setCopiedImageIndex(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  // Helper functions for new fields
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
      // Convert to uppercase with underscores (e.g., "New Category" -> "NEW_CATEGORY")
      const categoryValue = newCategory.trim().toUpperCase().replace(/\s+/g, '_');
      setCategory(categoryValue);
      setShowNewCategoryInput(false);
      setNewCategory('');
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (!slug || slug === initialBlog?.slug) {
      const generatedSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  // Filter blogs for related articles search
  const filteredBlogsForRelated = blogs.filter(blog => {
    if (blog.id === initialBlog?.id) return false;
    if (selectedRelatedArticles.includes(blog.id)) return false;
    if (!relatedArticleSearch.trim()) return true;
    return blog.title.toLowerCase().includes(relatedArticleSearch.toLowerCase()) ||
           blog.slug.toLowerCase().includes(relatedArticleSearch.toLowerCase());
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

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Progress Bar */}
        {generating && progress.total > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-900">{progress.message}</span>
              <span className="text-sm text-blue-700">
                {progress.current}%
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2.5 mb-3">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(progress.current, 100)}%`,
                }}
              />
            </div>
            {/* Step indicators */}
            <div className="flex justify-between items-center text-xs text-blue-600">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center ${
                    idx < progress.step
                      ? 'text-blue-800 font-medium'
                      : idx === progress.step
                      ? 'text-blue-600 font-medium'
                      : 'text-blue-400'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-1 ${
                      idx < progress.step
                        ? 'bg-blue-600'
                        : idx === progress.step
                        ? 'bg-blue-500 animate-pulse'
                        : 'bg-blue-300'
                    }`}
                  />
                  <span className="hidden sm:inline">{step.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Generating blog post... This may take a few minutes. Please do not close this tab.
            </p>
          </div>
        )}

        {/* Mode Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Creation Mode</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="youtube"
                checked={mode === 'youtube'}
                onChange={(e) => setMode(e.target.value as 'youtube' | 'manual' | 'topic')}
                className="mr-2"
              />
              From YouTube Video
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="topic"
                checked={mode === 'topic'}
                onChange={(e) => setMode(e.target.value as 'youtube' | 'manual' | 'topic')}
                className="mr-2"
              />
              From Topic (AI)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="manual"
                checked={mode === 'manual'}
                onChange={(e) => setMode(e.target.value as 'youtube' | 'manual' | 'topic')}
                className="mr-2"
              />
              Manual Entry
            </label>
          </div>
        </div>

        {mode === 'topic' ? (
          <>
            <div className="border rounded-lg p-4 bg-blue-50">
              <p className="text-sm text-blue-800 mb-4">
                Generate blog topics using AI, then select a topic to generate a complete blog post.
              </p>
            </div>

            {/* Advanced Options for Topic Mode */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-sm">Advanced Options</h3>

              {/* Tone Selection */}
              <div>
                <label htmlFor="tone" className="block text-sm font-medium mb-2">
                  Tone
                </label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="input w-full"
                >
                  <option value="gentle">Gentle</option>
                  <option value="educational">Educational</option>
                  <option value="validating">Validating</option>
                  <option value="hopeful">Hopeful</option>
                  <option value="grounding">Grounding</option>
                </select>
              </div>

              {/* Generate Image Option */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={generateImage}
                    onChange={(e) => setGenerateImage(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Generate AI Image (one image will be generated)</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  When enabled, one AI-generated image will be created and inserted into the blog post.
                </p>
              </div>

              {/* Custom Content */}
              <div>
                <label htmlFor="customContent" className="block text-sm font-medium mb-2">
                  Additional Content (Optional)
                </label>
                <textarea
                  id="customContent"
                  name="customContent"
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  rows={4}
                  placeholder="Add any additional content you want to include in the blog post..."
                  className="input w-full"
                />
              </div>
            </div>
          </>
        ) : mode === 'youtube' ? (
          <>
            <div>
              <label htmlFor="youtubeUrl" className="block text-sm font-medium mb-2">
                YouTube URL *
              </label>
              <input
                type="url"
                id="youtubeUrl"
                name="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                The video will be transcribed and converted into a blog post.
              </p>
            </div>

            {/* Advanced Options */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-sm">Advanced Options</h3>

              {/* Tone Selection */}
              <div>
                <label htmlFor="tone" className="block text-sm font-medium mb-2">
                  Tone
                </label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="input w-full"
                >
                  <option value="gentle">Gentle</option>
                  <option value="educational">Educational</option>
                  <option value="validating">Validating</option>
                  <option value="hopeful">Hopeful</option>
                  <option value="grounding">Grounding</option>
                </select>
              </div>

              {/* Generate Image Option */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={generateImage}
                    onChange={(e) => setGenerateImage(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Generate AI Image (one image will be generated)</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  When enabled, one AI-generated image will be created and inserted into the blog post.
                </p>
              </div>

              {/* Content Options */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rephrase}
                    onChange={(e) => setRephrase(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Rephrase content</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={summarize}
                    onChange={(e) => setSummarize(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Summarize content</span>
                </label>
              </div>

              {/* Custom Content */}
              <div>
                <label htmlFor="customContent" className="block text-sm font-medium mb-2">
                  Additional Content (Optional)
                </label>
                <textarea
                  id="customContent"
                  name="customContent"
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  rows={4}
                  placeholder="Add any additional content you want to include in the blog post..."
                  className="input w-full"
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-sm">Upload Images</h3>
              <p className="text-xs text-gray-500">
                Upload images to use in your blog post. Copy the embed code and paste it into your content.
              </p>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="input w-full"
                />
                {uploadingImage && (
                  <p className="text-xs text-gray-500 mt-1">Uploading...</p>
                )}
              </div>

              {uploadedImages.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Uploaded Images</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {uploadedImages.map((img, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-gray-50 space-y-2"
                      >
                        <div className="relative aspect-video bg-gray-200 rounded overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 truncate flex-1 mr-2">
                            {img.alt}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyImageEmbed(img.url, img.alt, index)}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            {copiedImageIndex === index ? 'Copied!' : 'Copy Embed'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeUploadedImage(index)}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors ml-1"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 font-mono break-all">
                          <code className="bg-gray-100 px-1 py-0.5 rounded">
                            ![{img.alt}]({img.url})
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                defaultValue={initialBlog?.title || ''}
                onChange={handleTitleChange}
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
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="input w-full"
                placeholder="url-friendly-slug"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly version of the title (auto-generated from title)
              </p>
            </div>

            <div>
              <label htmlFor="topicId" className="block text-sm font-medium mb-2">
                Topic (Optional)
              </label>
              <select id="topicId" name="topicId" className="input w-full">
                <option value="">Select a topic</option>
                {topics.map((topic) => (
                  <option
                    key={topic.id}
                    value={topic.id}
                    selected={initialBlog?.topicId === topic.id}
                  >
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                Category (Optional)
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
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
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
                value={targetReader}
                onChange={(e) => setTargetReader(e.target.value)}
                className="input w-full"
                placeholder="Who is this article for? (e.g., 'Beginners', 'Survivors', 'Therapists')"
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
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="input w-full"
                placeholder="SEO-optimized title (defaults to article title)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use the article title
              </p>
            </div>

            <div>
              <label htmlFor="metaDescription" className="block text-sm font-medium mb-2">
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="input w-full"
                placeholder="Brief description for search engines (150-160 characters recommended)"
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
                value={estimatedReadTime}
                onChange={(e) => setEstimatedReadTime(e.target.value)}
                className="input w-full"
                placeholder="5"
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
                    {filteredBlogsForRelated.map((blog) => (
                      <button
                        key={blog.id}
                        type="button"
                        onClick={() => handleAddRelatedArticle(blog.id)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-sm text-gray-900">{blog.title}</div>
                        <div className="text-xs text-gray-500">{blog.slug}</div>
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

            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-2">
                Content *
              </label>
              <textarea
                id="content"
                name="content"
                rows={12}
                required
                defaultValue={initialBlog?.content || ''}
                className="input w-full font-mono text-sm"
                placeholder="Write your blog post content here (Markdown supported)..."
              />
            </div>

            {/* Image Upload Section for Manual Mode */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-sm">Upload Images</h3>
              <p className="text-xs text-gray-500">
                Upload images to use in your blog post. Copy the embed code and paste it into your content above.
              </p>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="input w-full"
                />
                {uploadingImage && (
                  <p className="text-xs text-gray-500 mt-1">Uploading...</p>
                )}
              </div>

              {uploadedImages.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Uploaded Images</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {uploadedImages.map((img, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-gray-50 space-y-2"
                      >
                        <div className="relative aspect-video bg-gray-200 rounded overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 truncate flex-1 mr-2">
                            {img.alt}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyImageEmbed(img.url, img.alt, index)}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            {copiedImageIndex === index ? 'Copied!' : 'Copy Embed'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeUploadedImage(index)}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors ml-1"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 font-mono break-all">
                          <code className="bg-gray-100 px-1 py-0.5 rounded">
                            ![{img.alt}]({img.url})
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* AI Topic Generator */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">AI Topic Generator</label>
            {mode !== 'topic' && (
              <button
                type="button"
                onClick={() => setShowTopicGenerator(!showTopicGenerator)}
                className="text-xs text-blue-600"
              >
                {showTopicGenerator ? 'Hide' : 'Show'}
              </button>
            )}
          </div>
          {(showTopicGenerator || mode === 'topic') && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topicTheme}
                  onChange={(e) => setTopicTheme(e.target.value)}
                  placeholder="Enter theme or keyword (e.g., 'trauma recovery', 'self-care')"
                  className="input flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={handleGenerateTopics}
                  disabled={generatingTopics}
                  className="btn btn-secondary text-sm"
                >
                  {generatingTopics ? 'Generating...' : 'Generate Topics'}
                </button>
              </div>
              {generatedTopics.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {generatedTopics.map((topic, idx) => (
                    <div key={idx} className="border rounded p-3 bg-white space-y-2">
                      <div>
                        <h4 className="font-medium text-sm">{topic.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{topic.description}</p>
                      </div>
                      {topic.keyPoints && topic.keyPoints.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium text-gray-700">Key Points:</span>
                          <ul className="list-disc list-inside mt-1 text-gray-600">
                            {topic.keyPoints.slice(0, 3).map((point: string, pointIdx: number) => (
                              <li key={pointIdx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {topic.suggestedTags?.slice(0, 5).map((tag: string, tagIdx: number) => (
                          <span key={tagIdx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2 pt-2 border-t">
                        <button
                          type="button"
                          onClick={() => handleGenerateFromTopic(topic)}
                          disabled={generating}
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          Generate Blog
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('manual');
                            // Pre-fill the form with topic details
                            const titleInput = document.getElementById('title') as HTMLInputElement;
                            const contentInput = document.getElementById('content') as HTMLTextAreaElement;
                            if (titleInput) titleInput.value = topic.title;
                            if (contentInput) {
                              contentInput.value = `# ${topic.title}\n\n${topic.description}\n\n${topic.keyPoints?.map((p: string) => `- ${p}`).join('\n') || ''}`;
                            }
                          }}
                          className="text-xs px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          Use in Manual Mode
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isPending || generating}
            className="btn btn-primary"
          >
            {generating
              ? 'Generating Blog...'
              : mode === 'youtube'
              ? 'Generate from YouTube'
              : mode === 'topic'
              ? 'Generate Topics First'
              : initialBlog
              ? 'Update Blog'
              : 'Create Blog'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
            disabled={isPending || generating}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
