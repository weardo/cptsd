'use client';

import Link from 'next/link';
import { ResourceType, ResourceCategory } from '@cptsd/db/client';

type Resource = {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: ResourceCategory;
  url?: string | null;
  author?: string | null;
  thumbnail?: string | null;
  tags: string[];
  featured: boolean;
  rating?: number | null;
  status: string;
};

type ResourcesListProps = {
  resources: Resource[];
  initialFilters?: Record<string, string>;
};

export default function ResourcesList({ resources, initialFilters }: ResourcesListProps) {
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

  const getCategoryLabel = (category: ResourceCategory) => {
    return category.replace(/_/g, ' ').toLowerCase();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <select
            defaultValue={initialFilters?.type || ''}
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              if (e.target.value) {
                params.set('type', e.target.value);
              } else {
                params.delete('type');
              }
              window.location.search = params.toString();
            }}
            className="input text-sm"
          >
            <option value="">All Types</option>
            {Object.values(ResourceType).map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            defaultValue={initialFilters?.category || ''}
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              if (e.target.value) {
                params.set('category', e.target.value);
              } else {
                params.delete('category');
              }
              window.location.search = params.toString();
            }}
            className="input text-sm"
          >
            <option value="">All Categories</option>
            {Object.values(ResourceCategory).map((category) => (
              <option key={category} value={category}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>

          <select
            defaultValue={initialFilters?.status || ''}
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              if (e.target.value) {
                params.set('status', e.target.value);
              } else {
                params.delete('status');
              }
              window.location.search = params.toString();
            }}
            className="input text-sm"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <input
            type="text"
            placeholder="Search resources..."
            defaultValue={initialFilters?.search || ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const params = new URLSearchParams(window.location.search);
                const value = (e.target as HTMLInputElement).value;
                if (value) {
                  params.set('search', value);
                } else {
                  params.delete('search');
                }
                window.location.search = params.toString();
              }
            }}
            className="input text-sm flex-1"
          />
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <Link
            key={resource.id}
            href={`/resources/${resource.id}`}
            className="card hover:shadow-lg transition-shadow"
          >
            {resource.thumbnail && (
              <img
                src={resource.thumbnail}
                alt={resource.title}
                className="w-full h-48 object-cover rounded-t-lg mb-4"
              />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{resource.title}</h3>
                  {resource.author && (
                    <p className="text-sm text-gray-600 mb-2">by {resource.author}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {resource.featured && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                  {resource.status !== 'ACTIVE' && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      resource.status === 'DRAFT' 
                        ? 'bg-gray-100 text-gray-600' 
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {resource.status}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3 line-clamp-2">{resource.description}</p>

              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-1 rounded ${getTypeColor(resource.type)}`}>
                  {resource.type.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-gray-500">
                  {getCategoryLabel(resource.category)}
                </span>
                {resource.rating && (
                  <span className="text-xs text-gray-500">
                    ⭐ {resource.rating.toFixed(1)}
                  </span>
                )}
              </div>

              {resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                  {resource.tags.length > 3 && (
                    <span className="text-xs text-gray-400">+{resource.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

