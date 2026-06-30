'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createIdea } from '@/app/actions/ideas';
import FileUpload from '../FileUpload';
import { uploadFile } from '@/app/actions/uploads';

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

type IdeaFormProps = {
  topics: Topic[];
  templates: Template[];
};

export default function IdeaForm({ topics, templates }: IdeaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; type: string; filename?: string }>>([]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await uploadFile(formData);
      
      if (result.success && result.url) {
        setUploadedFiles((prev) => [
          ...prev,
          {
            url: result.url!,
            type: file.type.startsWith('image/') ? 'image' : 'file',
            filename: file.name,
          },
        ]);
      } else {
        setError(result.error || 'Failed to upload file');
      }
    } catch (err) {
      setError('An error occurred while uploading the file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        // Create the idea first
        const result = await createIdea(formData);
        
        if (result.success && result.idea) {
          // If we have uploaded files, add them as items
          if (uploadedFiles.length > 0) {
            const { updateIdeaItems } = await import('@/app/actions/ideas');
            const items = uploadedFiles.map((file, index) => ({
              type: file.type as 'image' | 'file',
              content: file.url,
              metadata: {
                filename: file.filename,
              },
              order: index,
            }));
            
            await updateIdeaItems(result.idea.id, items);
          }
          
          router.push(`/ideas/${result.idea.id}`);
          router.refresh();
        } else {
          setError(result.error || 'Failed to create idea');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create idea');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Create New Idea</h2>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label htmlFor="intent" className="block text-sm font-medium text-gray-700 mb-1">
              Intent / Goal
            </label>
            <input
              type="text"
              id="intent"
              name="intent"
              placeholder="What's the goal of this idea?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">What do you want to achieve with this content?</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="postType" className="block text-sm font-medium text-gray-700 mb-1">
                Post Type
              </label>
              <select
                id="postType"
                name="postType"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select post type</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select tone</option>
                <option value="educational">Educational</option>
                <option value="validating">Validating</option>
                <option value="gentle-cta">Gentle CTA</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 mb-1">
              Prompt Template (Optional)
            </label>
            <select
              id="templateId"
              name="templateId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
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
              placeholder="Rough notes about this idea..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Add any initial thoughts or notes about this idea</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attach Files (Optional)
            </label>
            <FileUpload
              onUpload={handleFileUpload}
              uploading={uploading}
            />
            {uploadedFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">
                      {file.type === 'image' ? '🖼️' : '📎'} {file.filename || 'File'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              You can add more files after creating the idea
            </p>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary"
          >
            {isPending ? 'Creating...' : 'Create Idea'}
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
      </div>
    </form>
  );
}

