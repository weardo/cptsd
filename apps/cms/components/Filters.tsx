'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

type Topic = {
  id: string;
  name: string;
  slug: string;
};

type FiltersProps = {
  topics: Topic[];
  initialFilters?: {
    topic?: string;
    postType?: string;
    status?: string;
    search?: string;
  };
};

export default function Filters({ topics, initialFilters }: FiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialFilters?.search || '');
  
  useEffect(() => {
    setSearch(initialFilters?.search || '');
  }, [initialFilters?.search]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams();
    
    // Preserve existing filters
    if (initialFilters?.topic) params.set('topic', initialFilters.topic);
    if (initialFilters?.postType) params.set('postType', initialFilters.postType);
    if (initialFilters?.status) params.set('status', initialFilters.status);
    if (initialFilters?.search) params.set('search', initialFilters.search);
    
    // Update the changed filter
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    router.push(`/?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    // Preserve existing filters
    if (initialFilters?.topic) params.set('topic', initialFilters.topic);
    if (initialFilters?.postType) params.set('postType', initialFilters.postType);
    if (initialFilters?.status) params.set('status', initialFilters.status);
    
    // Add search
    if (search) {
      params.set('search', search);
    }
    
    router.push(`/?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch('');
    router.push('/');
  };

  return (
    <div className="card mb-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium mb-2">
            Search
          </label>
          <div className="flex space-x-2">
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in raw idea, script, or caption..."
              className="input flex-1"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium mb-2">
              Topic
            </label>
            <select
              id="topic"
              value={initialFilters?.topic || ''}
              onChange={(e) => handleFilterChange('topic', e.target.value)}
              className="input"
            >
              <option value="">All Topics</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="postType" className="block text-sm font-medium mb-2">
              Post Type
            </label>
            <select
              id="postType"
              value={initialFilters?.postType || ''}
              onChange={(e) => handleFilterChange('postType', e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              <option value="CAROUSEL">Carousel</option>
              <option value="REEL">Reel</option>
              <option value="STORY">Story</option>
              <option value="MEME">Meme</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              id="status"
              value={initialFilters?.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="GENERATED">Generated</option>
              <option value="APPROVED">Approved</option>
              <option value="POSTED">Posted</option>
            </select>
          </div>
        </div>

        {(initialFilters?.topic || initialFilters?.postType || initialFilters?.status || initialFilters?.search) && (
          <button
            type="button"
            onClick={clearFilters}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        )}
      </form>
    </div>
  );
}

