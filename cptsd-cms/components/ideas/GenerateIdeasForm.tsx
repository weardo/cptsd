'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateIdeasWithAI } from '@/app/actions/ideas';
import { GenerateIdeasRequest } from '@/lib/openai-ideas';

type Topic = {
  id: string;
  name: string;
  slug: string;
};

type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  suggestedPostTypes: string[];
  suggestedTones: string[];
};

type GenerateIdeasFormProps = {
  topics: Topic[];
  templates: Template[];
  availableModels?: Array<{ value: string; label: string; cost: 'low' | 'medium' | 'high' }>;
  defaultModel?: string;
};

export default function GenerateIdeasForm({ topics, templates, availableModels = [], defaultModel = 'gpt-4o' }: GenerateIdeasFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const generationAbortedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedModel, setSelectedModel] = useState(defaultModel);

  // Block navigation during generation
  useEffect(() => {
    if (generating && !generationAbortedRef.current) {
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
  }, [generating]);

  const handleCancelGeneration = () => {
    if (generating && !cancelling) {
      setCancelling(true);
      generationAbortedRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setTimeout(() => {
        setGenerating(false);
        setCancelling(false);
        setProgress({ current: 0, total: 0, message: '' });
        setError('Generation cancelled');
      }, 500);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setGenerating(true);

    const formData = new FormData(e.currentTarget);
    const topicId = formData.get('topicId') as string;
    const topic = topics.find((t) => t.id === topicId);

    if (!topic) {
      setError('Please select a topic');
      setGenerating(false);
      return;
    }

    if (generating) {
      return; // Prevent double submission
    }

    const count = parseInt(formData.get('count') as string) || 3;
    setCancelling(false);
    setProgress({ current: 0, total: count, message: 'Initializing idea generation...' });
    generationAbortedRef.current = false;
    abortControllerRef.current = new AbortController();
    setGenerating(true);

    const request: GenerateIdeasRequest = {
      topicId: topic.id,
      topicName: topic.name,
      topicSlug: topic.slug,
      postType: (formData.get('postType') as any) || 'CAROUSEL',
      tone: (formData.get('tone') as any) || 'educational',
      count: count,
      intent: (formData.get('intent') as string) || undefined,
      templateId: (formData.get('templateId') as string) || undefined,
      model: selectedModel,
    };

    startTransition(async () => {
      try {
        setProgress({ current: 0, total: count, message: `Generating ${count} ideas...` });
        
        const result = await generateIdeasWithAI(request);

        if (generationAbortedRef.current) {
          setProgress({ current: 0, total: 0, message: 'Generation cancelled' });
          setError('Generation was cancelled');
          return;
        }

        setProgress({ current: count, total: count, message: 'Complete!' });

        if (result.success && result.ideas.length > 0) {
          setTimeout(() => {
            setProgress({ current: 0, total: 0, message: '' });
          }, 1000);
          router.push('/ideas');
          router.refresh();
        } else {
          setProgress({ current: 0, total: 0, message: '' });
          setError(result.error || 'Failed to generate ideas');
        }
      } catch (err) {
        if (generationAbortedRef.current) {
          setProgress({ current: 0, total: 0, message: 'Generation cancelled' });
          setError('Generation was cancelled');
        } else {
          setProgress({ current: 0, total: 0, message: '' });
          setError(err instanceof Error ? err.message : 'Failed to generate ideas');
        }
      } finally {
        if (!generationAbortedRef.current) {
          setGenerating(false);
        }
      }
    });
  };

  const selectedTemplateId = typeof document !== 'undefined' 
    ? (document.querySelector('select[name="templateId"]') as HTMLSelectElement)?.value 
    : '';

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Generate Ideas with AI</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="topicId" className="block text-sm font-medium text-gray-700 mb-1">
              Topic *
            </label>
            <select
              id="topicId"
              name="topicId"
              required
              disabled={generating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 mb-1">
              Prompt Template (Optional)
            </label>
            <select
              id="templateId"
              name="templateId"
              disabled={generating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">None - Use default prompts</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <p className="mt-1 text-xs text-gray-500">{selectedTemplate.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="postType" className="block text-sm font-medium text-gray-700 mb-1">
                Post Type *
              </label>
              <select
                id="postType"
                name="postType"
                required
                disabled={generating}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                defaultValue="CAROUSEL"
              >
                <option value="CAROUSEL">CAROUSEL</option>
                <option value="REEL">REEL</option>
                <option value="STORY">STORY</option>
                <option value="MEME">MEME</option>
              </select>
            </div>

            <div>
              <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
                Tone *
              </label>
              <select
                id="tone"
                name="tone"
                required
                disabled={generating}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                defaultValue="educational"
              >
                <option value="educational">Educational</option>
                <option value="validating">Validating</option>
                <option value="gentle-cta">Gentle CTA</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Ideas (1-10) *
            </label>
            <input
              type="number"
              id="count"
              name="count"
              min="1"
              max="10"
              defaultValue="3"
              required
              disabled={generating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Generate multiple ideas at once</p>
          </div>

          <div>
            <label htmlFor="intent" className="block text-sm font-medium text-gray-700 mb-1">
              Intent / Goal (Optional)
            </label>
            <textarea
              id="intent"
              name="intent"
              rows={2}
              disabled={generating}
              placeholder="e.g., Help people understand the 4 F responses to trauma"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">What's the goal of these ideas?</p>
          </div>

          {availableModels.length > 0 && (
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                OpenAI Model
              </label>
              <select
                id="model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={generating}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {availableModels.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label} ({model.cost === 'low' ? '$' : model.cost === 'medium' ? '$$' : '$$$'})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Select the model for generating ideas</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {generating && progress.total > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
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
              Generating ideas... Please do not close this tab.
            </p>
          </div>
        )}

        <div className="mt-6 flex space-x-3">
          <button
            type="submit"
            disabled={generating || isPending || cancelling}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating Ideas...' : 'Generate Ideas'}
          </button>
          {generating ? (
            <button
              type="button"
              onClick={handleCancelGeneration}
              disabled={cancelling}
              className="btn btn-secondary disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Generation'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

