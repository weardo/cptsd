'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTemplate } from '@/app/actions/templates';

export default function TemplateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await createTemplate(formData);
      
      if (result.success && result.template) {
        setSuccess('Template created successfully!');
        router.push(`/templates/${result.template.id}`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to create template');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Template Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="input"
              placeholder="e.g., Awareness Carousel"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              required
              className="input"
              placeholder="Brief description of what this template generates"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              required
              className="input"
            >
              <option value="awareness">Awareness</option>
              <option value="somatic">Somatic</option>
              <option value="validation">Validation</option>
              <option value="journal">Journal</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Prompts</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="systemPrompt" className="block text-sm font-medium mb-2">
              System Prompt *
            </label>
            <textarea
              id="systemPrompt"
              name="systemPrompt"
              rows={4}
              required
              className="input font-mono text-sm"
              placeholder="The system prompt that defines the AI's role and behavior..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the system-level instruction for the AI model
            </p>
          </div>

          <div>
            <label htmlFor="userPromptTemplate" className="block text-sm font-medium mb-2">
              User Prompt Template *
            </label>
            <textarea
              id="userPromptTemplate"
              name="userPromptTemplate"
              rows={4}
              required
              className="input font-mono text-sm"
              placeholder="Template with variables like {topic}, {tone}, {postType}, {intent}, {count}..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Use variables: {'{topic}'}, {'{tone}'}, {'{postType}'}, {'{intent}'}, {'{count}'}
            </p>
          </div>

          <div>
            <label htmlFor="exampleOutput" className="block text-sm font-medium mb-2">
              Example Output (Optional)
            </label>
            <textarea
              id="exampleOutput"
              name="exampleOutput"
              rows={3}
              className="input"
              placeholder="Example of what this template generates..."
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Suggested Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Suggested Post Types
            </label>
            <div className="flex flex-wrap gap-2">
              {['CAROUSEL', 'REEL', 'STORY', 'MEME'].map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="suggestedPostTypes"
                    value={type}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Suggested Tones
            </label>
            <div className="flex flex-wrap gap-2">
              {['educational', 'validating', 'gentle-cta'].map((tone) => (
                <label key={tone} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="suggestedTones"
                    value={tone}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">{tone.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending}
        >
          {isPending ? 'Creating...' : 'Create Template'}
        </button>
      </div>
    </form>
  );
}


