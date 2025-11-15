'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBlog, transcribeAndGenerateBlog, searchBlogStockImages, generateBlogTopicsAI } from '@/app/actions/blogs';

type Topic = {
  id: string;
  name: string;
  slug: string;
};

type BlogFormProps = {
  topics: Topic[];
  initialBlog?: {
    id: string;
    title: string;
    content: string;
    youtubeUrl?: string | null;
    topicId?: string | null;
    customContent?: string | null;
  } | null;
};

type ImageSource = 'generate' | 'stock' | 'none';

export default function BlogForm({ topics, initialBlog }: BlogFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState(initialBlog?.youtubeUrl || '');
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<'manual' | 'youtube'>('youtube');
  const [tone, setTone] = useState<'educational' | 'validating' | 'gentle' | 'hopeful' | 'grounding'>('gentle');
  const [imageSource, setImageSource] = useState<ImageSource>('generate');
  const [rephrase, setRephrase] = useState(false);
  const [summarize, setSummarize] = useState(false);
  const [customContent, setCustomContent] = useState(initialBlog?.customContent || '');
  const [showTopicGenerator, setShowTopicGenerator] = useState(false);
  const [topicTheme, setTopicTheme] = useState('');
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState<any[]>([]);
  const [showStockImageSearch, setShowStockImageSearch] = useState(false);
  const [stockImageQuery, setStockImageQuery] = useState('');
  const [stockImages, setStockImages] = useState<any[]>([]);
  const [searchingImages, setSearchingImages] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 5, message: '', step: 0 });
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          includeImages: imageSource !== 'none',
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
    } else {
      // Manual creation
      const formData = new FormData(e.currentTarget);
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
                onChange={(e) => setMode(e.target.value as 'youtube' | 'manual')}
                className="mr-2"
              />
              From YouTube Video
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="manual"
                checked={mode === 'manual'}
                onChange={(e) => setMode(e.target.value as 'youtube' | 'manual')}
                className="mr-2"
              />
              Manual Entry
            </label>
          </div>
        </div>

        {mode === 'youtube' ? (
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

              {/* Image Source */}
              <div>
                <label className="block text-sm font-medium mb-2">Image Source</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="imageSource"
                      value="generate"
                      checked={imageSource === 'generate'}
                      onChange={(e) => setImageSource(e.target.value as ImageSource)}
                      className="mr-2"
                    />
                    AI Generate
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="imageSource"
                      value="stock"
                      checked={imageSource === 'stock'}
                      onChange={(e) => setImageSource(e.target.value as ImageSource)}
                      className="mr-2"
                    />
                    Stock Images
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="imageSource"
                      value="none"
                      checked={imageSource === 'none'}
                      onChange={(e) => setImageSource(e.target.value as ImageSource)}
                      className="mr-2"
                    />
                    No Images
                  </label>
                </div>
              </div>

              {/* Stock Image Search */}
              {imageSource === 'stock' && (
                <div className="border rounded p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Search Stock Images</label>
                    <button
                      type="button"
                      onClick={() => setShowStockImageSearch(!showStockImageSearch)}
                      className="text-xs text-blue-600"
                    >
                      {showStockImageSearch ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showStockImageSearch && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={stockImageQuery}
                          onChange={(e) => setStockImageQuery(e.target.value)}
                          placeholder="e.g., calm nature, peaceful landscape"
                          className="input flex-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleSearchStockImages}
                          disabled={searchingImages}
                          className="btn btn-secondary text-sm"
                        >
                          {searchingImages ? 'Searching...' : 'Search'}
                        </button>
                      </div>
                      {stockImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                          {stockImages.map((img) => (
                            <div key={img.id} className="relative">
                              <img
                                src={img.thumbnailUrl}
                                alt={img.alt}
                                className="w-full h-20 object-cover rounded"
                              />
                              <p className="text-xs text-gray-600 truncate mt-1">{img.photographer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                className="input w-full"
              />
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
          </>
        )}

        {/* AI Topic Generator */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">AI Topic Generator</label>
            <button
              type="button"
              onClick={() => setShowTopicGenerator(!showTopicGenerator)}
              className="text-xs text-blue-600"
            >
              {showTopicGenerator ? 'Hide' : 'Show'}
            </button>
          </div>
          {showTopicGenerator && (
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
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {generatedTopics.map((topic, idx) => (
                    <div key={idx} className="border rounded p-2 bg-white">
                      <h4 className="font-medium text-sm">{topic.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{topic.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {topic.suggestedTags?.slice(0, 5).map((tag: string, tagIdx: number) => (
                          <span key={tagIdx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
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
