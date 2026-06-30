'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createResource, updateResource } from '@/app/actions/resources';
import { ResourceType, ResourceCategory } from '@cptsd/db/client';

type ResourceFormProps = {
  initialResource?: {
    id: string;
    title: string;
    description: string;
    type: ResourceType;
    category: ResourceCategory;
    url?: string | null;
    author?: string | null;
    publisher?: string | null;
    isbn?: string | null;
    duration?: number | null;
    thumbnail?: string | null;
    tags: string[];
    featured: boolean;
    rating?: number | null;
    notes?: string | null;
    status: string;
  } | null;
};

export default function ResourceForm({ initialResource }: ResourceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = initialResource
        ? await updateResource(initialResource.id, formData)
        : await createResource(formData);

      if (result.success && result.resource) {
        router.push(`/resources/${result.resource.id}`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to save resource');
      }
    });
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={initialResource?.title || ''}
            className="input w-full"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            required
            defaultValue={initialResource?.description || ''}
            className="input w-full"
            placeholder="Describe the resource..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-2">
              Type *
            </label>
            <select
              id="type"
              name="type"
              required
              defaultValue={initialResource?.type || ''}
              className="input w-full"
            >
              <option value="">Select type</option>
              {Object.values(ResourceType).map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              required
              defaultValue={initialResource?.category || ''}
              className="input w-full"
            >
              <option value="">Select category</option>
              {Object.values(ResourceCategory).map((category) => (
                <option key={category} value={category}>
                  {category.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            URL
          </label>
          <input
            type="url"
            id="url"
            name="url"
            defaultValue={initialResource?.url || ''}
            className="input w-full"
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Phone (for helplines)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              defaultValue={(initialResource as any)?.phone || ''}
              className="input w-full"
              placeholder="+91-xxx-xxx-xxxx"
            />
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium mb-2">
              Region
            </label>
            <input
              type="text"
              id="region"
              name="region"
              defaultValue={(initialResource as any)?.region || ''}
              className="input w-full"
              placeholder="e.g., All India, Karnataka, Mumbai"
            />
          </div>
        </div>

        <div>
          <label htmlFor="languages" className="block text-sm font-medium mb-2">
            Languages (comma-separated)
          </label>
          <input
            type="text"
            id="languages"
            name="languages"
            defaultValue={(initialResource as any)?.languages?.join(', ') || ''}
            className="input w-full"
            placeholder="English, Hindi, Tamil"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="author" className="block text-sm font-medium mb-2">
              Author
            </label>
            <input
              type="text"
              id="author"
              name="author"
              defaultValue={initialResource?.author || ''}
              className="input w-full"
            />
          </div>

          <div>
            <label htmlFor="publisher" className="block text-sm font-medium mb-2">
              Publisher
            </label>
            <input
              type="text"
              id="publisher"
              name="publisher"
              defaultValue={initialResource?.publisher || ''}
              className="input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="isbn" className="block text-sm font-medium mb-2">
              ISBN (for books)
            </label>
            <input
              type="text"
              id="isbn"
              name="isbn"
              defaultValue={initialResource?.isbn || ''}
              className="input w-full"
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              defaultValue={initialResource?.duration || ''}
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label htmlFor="thumbnail" className="block text-sm font-medium mb-2">
            Thumbnail URL
          </label>
          <input
            type="url"
            id="thumbnail"
            name="thumbnail"
            defaultValue={initialResource?.thumbnail || ''}
            className="input w-full"
            placeholder="https://..."
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            defaultValue={initialResource?.tags.join(', ') || ''}
            className="input w-full"
            placeholder="tag1, tag2, tag3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="rating" className="block text-sm font-medium mb-2">
              Rating (1-5)
            </label>
            <input
              type="number"
              id="rating"
              name="rating"
              min="1"
              max="5"
              step="0.1"
              defaultValue={initialResource?.rating || ''}
              className="input w-full"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={initialResource?.status || 'ACTIVE'}
              className="input w-full"
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="featured"
              value="true"
              defaultChecked={initialResource?.featured || false}
              className="mr-2"
            />
            <span className="text-sm font-medium">Featured Resource</span>
          </label>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            Admin Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={initialResource?.notes || ''}
            className="input w-full"
            placeholder="Internal notes about this resource..."
          />
        </div>

        <div className="flex space-x-4">
          <button type="submit" disabled={isPending} className="btn btn-primary">
            {isPending ? 'Saving...' : initialResource ? 'Update Resource' : 'Create Resource'}
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
    </div>
  );
}

