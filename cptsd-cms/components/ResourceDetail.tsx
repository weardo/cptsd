'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateResource } from '@/app/actions/resources';
import DeleteButton from './DeleteButton';
import { ResourceType, ResourceCategory } from '@cptsd/db/models/Resource';

type Resource = {
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
  createdAt: Date;
  updatedAt: Date;
};

type ResourceDetailProps = {
  resource: Resource;
};

export default function ResourceDetail({ resource }: ResourceDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateResource(resource.id, formData);
      if (result.success) {
        setSuccess('Resource updated successfully');
        router.refresh();
      } else {
        setError(result.error || 'Failed to update resource');
      }
    });
  };

  const getTypeColor = (type: ResourceType) => {
    switch (type) {
      case ResourceType.BOOK:
        return 'bg-blue-100 text-blue-800';
      case ResourceType.VIDEO:
        return 'bg-red-100 text-red-800';
      case ResourceType.COMMUNITY:
        return 'bg-green-100 text-green-800';
      case ResourceType.EMERGENCY:
        return 'bg-orange-100 text-orange-800';
      case ResourceType.WEBSITE:
        return 'bg-purple-100 text-purple-800';
      case ResourceType.PODCAST:
        return 'bg-pink-100 text-pink-800';
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
            <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(resource.type)}`}>
              {resource.type.replace(/_/g, ' ')}
            </span>
            <span className="text-sm text-gray-500">
              {resource.category.replace(/_/g, ' ').toLowerCase()}
            </span>
            {resource.featured && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Featured
              </span>
            )}
            {resource.rating && (
              <span className="text-sm text-gray-600">⭐ {resource.rating.toFixed(1)}</span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{resource.title}</h1>
          {resource.author && (
            <p className="text-gray-600 mt-2">by {resource.author}</p>
          )}
        </div>
        <DeleteButton
          onDelete={async () => {
            const { deleteResource } = await import('@/app/actions/resources');
            return await deleteResource(resource.id);
          }}
          itemName="resource"
          redirectPath="/resources"
        />
      </div>

      {/* Thumbnail */}
      {resource.thumbnail && (
        <div>
          <img
            src={resource.thumbnail}
            alt={resource.title}
            className="w-full h-64 object-cover rounded-lg"
          />
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

      {/* Description */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{resource.description}</p>
      </div>

      {/* Details */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {resource.url && (
            <div>
              <label className="text-sm font-medium text-gray-600">URL</label>
              <p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {resource.url}
                </a>
              </p>
            </div>
          )}
          {resource.publisher && (
            <div>
              <label className="text-sm font-medium text-gray-600">Publisher</label>
              <p className="text-gray-900">{resource.publisher}</p>
            </div>
          )}
          {resource.isbn && (
            <div>
              <label className="text-sm font-medium text-gray-600">ISBN</label>
              <p className="text-gray-900">{resource.isbn}</p>
            </div>
          )}
          {resource.duration && (
            <div>
              <label className="text-sm font-medium text-gray-600">Duration</label>
              <p className="text-gray-900">{resource.duration} minutes</p>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {resource.tags.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {resource.tags.map((tag, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className="card space-y-6">
        <h2 className="text-lg font-semibold">Edit Resource</h2>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={resource.title}
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
            defaultValue={resource.description}
            className="input w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-2">
              Type *
            </label>
            <select id="type" name="type" required defaultValue={resource.type} className="input w-full">
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
              defaultValue={resource.category}
              className="input w-full"
            >
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
            defaultValue={resource.url || ''}
            className="input w-full"
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
              defaultValue={resource.author || ''}
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
              defaultValue={resource.publisher || ''}
              className="input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              defaultValue={resource.tags.join(', ')}
              className="input w-full"
            />
          </div>

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
              defaultValue={resource.rating || ''}
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="featured"
              value="true"
              defaultChecked={resource.featured}
              className="mr-2"
            />
            <span className="text-sm font-medium">Featured Resource</span>
          </label>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </label>
          <select id="status" name="status" defaultValue={resource.status} className="input w-full">
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
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
    </div>
  );
}

