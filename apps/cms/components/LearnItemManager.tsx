'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  addLearnItem,
  updateLearnItem,
  deleteLearnItem,
  reorderLearnItems,
} from '@/app/actions/learn';
import { LearnItemType } from '@cptsd/db';

type LearnItem = {
  id: string;
  type: LearnItemType;
  title?: string | null;
  description?: string | null;
  articleId?: string | null;
  articleSlug?: string | null;
  resourceId?: string | null;
  externalUrl?: string | null;
  order: number;
};

type Article = {
  id: string;
  title: string;
  slug: string;
  isLearnResource: boolean;
};

type Resource = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  type: string;
  category: string;
};

type LearnItemManagerProps = {
  sectionId: string;
  items: LearnItem[];
};

export default function LearnItemManager({ sectionId, items: initialItems }: LearnItemManagerProps) {
  const [items, setItems] = useState<LearnItem[]>(initialItems.sort((a, b) => a.order - b.order));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleResults, setArticleResults] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showArticleDropdown, setShowArticleDropdown] = useState(false);
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceResults, setResourceResults] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showResourceDropdown, setShowResourceDropdown] = useState(false);
  const [itemType, setItemType] = useState<LearnItemType | null>(null);

  // Search articles
  useEffect(() => {
    if (articleSearch.trim().length > 2 && itemType === 'ARTICLE') {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`/api/articles/search?q=${encodeURIComponent(articleSearch)}&limit=10`);
          const data = await response.json();
          if (data.success) {
            setArticleResults(data.articles);
            setShowArticleDropdown(true);
          }
        } catch (err) {
          console.error('Error searching articles:', err);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setArticleResults([]);
      setShowArticleDropdown(false);
    }
  }, [articleSearch, itemType]);

  // Search resources
  useEffect(() => {
    if (resourceSearch.trim().length > 2 && itemType === 'RESOURCE') {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`/api/resources/search?q=${encodeURIComponent(resourceSearch)}&limit=10`);
          const data = await response.json();
          if (data.success) {
            setResourceResults(data.resources);
            setShowResourceDropdown(true);
          }
        } catch (err) {
          console.error('Error searching resources:', err);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResourceResults([]);
      setShowResourceDropdown(false);
    }
  }, [resourceSearch, itemType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[id^="article-search-container"]')) {
        setShowArticleDropdown(false);
      }
      if (!target.closest('[id^="resource-search-container"]')) {
        setShowResourceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as LearnItemType;

    if (type === 'ARTICLE' && !selectedArticle) {
      setError('Please select an article');
      return;
    }

    if (type === 'RESOURCE' && !selectedResource) {
      setError('Please select a resource');
      return;
    }

    if (type === 'EXTERNAL_LINK' && !formData.get('externalUrl')) {
      setError('Please provide an external URL');
      return;
    }

    if (type === 'ARTICLE' && selectedArticle) {
      formData.set('articleId', selectedArticle.id);
      formData.set('articleSlug', selectedArticle.slug);
      // Title/description will be auto-populated from article if not provided
    }

    if (type === 'RESOURCE' && selectedResource) {
      formData.set('resourceId', selectedResource.id);
      // Title/description will be auto-populated from resource if not provided
    }

    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) : -1;
    formData.set('order', String(maxOrder + 1));

    startTransition(async () => {
      const res = await addLearnItem(sectionId, formData);
      if (res.success && res.item) {
        setItems([...items, res.item].sort((a, b) => a.order - b.order));
        setShowAddForm(false);
        setArticleSearch('');
        setSelectedArticle(null);
        setResourceSearch('');
        setSelectedResource(null);
        setItemType(null);
        setSuccess('Item added successfully');
        setTimeout(() => setSuccess(''), 3000);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(res.error || 'Failed to add item');
      }
    });
  };

  const handleUpdateItem = async (itemId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as LearnItemType;

    if (type === 'ARTICLE' && selectedArticle) {
      formData.set('articleId', selectedArticle.id);
      formData.set('articleSlug', selectedArticle.slug);
    }

    startTransition(async () => {
      const res = await updateLearnItem(sectionId, itemId, formData);
      if (res.success && res.item) {
        setItems(items.map((item) => (item.id === itemId ? res.item : item)).sort((a, b) => a.order - b.order));
        setEditingItemId(null);
        setSelectedArticle(null);
        setArticleSearch('');
        setSelectedResource(null);
        setResourceSearch('');
        setItemType(null);
        setSuccess('Item updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.error || 'Failed to update item');
      }
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setError('');
    startTransition(async () => {
      const res = await deleteLearnItem(sectionId, itemId);
      if (res.success) {
        setItems(items.filter((item) => item.id !== itemId));
        setSuccess('Item deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.error || 'Failed to delete item');
      }
    });
  };

  const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
    const itemIndex = items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return;

    const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    [newItems[itemIndex], newItems[newIndex]] = [newItems[newIndex], newItems[itemIndex]];

    // Update orders
    newItems.forEach((item, index) => {
      item.order = index;
    });

    setItems(newItems);

    const itemIds = newItems.map((item) => item.id);
    startTransition(async () => {
      await reorderLearnItems(sectionId, itemIds);
    });
  };

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 border border-green-200 p-3 rounded">{success}</div>}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Items</h2>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  if (showAddForm) {
                    setArticleSearch('');
                    setSelectedArticle(null);
                    setResourceSearch('');
                    setSelectedResource(null);
                    setItemType(null);
                  }
                }}
                className="btn btn-primary text-sm"
              >
                {showAddForm ? 'Cancel' : 'Add Item'}
              </button>
      </div>

      {showAddForm && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Item</h3>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type *</label>
              <select
                name="type"
                required
                className="input w-full"
                onChange={(e) => {
                  const newType = e.target.value as LearnItemType;
                  setItemType(newType);
                  if (newType === 'EXTERNAL_LINK') {
                    setSelectedArticle(null);
                    setArticleSearch('');
                    setSelectedResource(null);
                    setResourceSearch('');
                  } else if (newType === 'ARTICLE') {
                    setSelectedResource(null);
                    setResourceSearch('');
                  } else if (newType === 'RESOURCE') {
                    setSelectedArticle(null);
                    setArticleSearch('');
                  }
                }}
              >
                <option value="">Select type</option>
                <option value="ARTICLE">Article (from blog)</option>
                <option value="RESOURCE">Resource</option>
                <option value="EXTERNAL_LINK">External Link</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                name="title"
                type="text"
                className="input w-full"
                placeholder="Item title (auto-filled from article/resource if not provided)"
                defaultValue={selectedArticle?.title || selectedResource?.title || ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional - will be auto-filled from selected article/resource if left empty
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                rows={2}
                className="input w-full"
                placeholder="Optional description (auto-filled from article/resource if not provided)"
                defaultValue={selectedResource?.description || ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional - will be auto-filled from selected article/resource if left empty
              </p>
            </div>

            {itemType === 'ARTICLE' && (
              <div id="article-search-container" className="relative">
                <label className="block text-sm font-medium mb-2">Search Article</label>
                <input
                  type="text"
                  value={articleSearch}
                  onChange={(e) => {
                    setArticleSearch(e.target.value);
                    if (e.target.value.trim().length > 2) {
                      setShowArticleDropdown(true);
                    }
                  }}
                  onFocus={() => {
                    if (articleResults.length > 0) setShowArticleDropdown(true);
                  }}
                  placeholder="Type to search articles..."
                  className="input w-full"
                />
              {showArticleDropdown && articleResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {articleResults.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => {
                        setSelectedArticle(article);
                        setArticleSearch(article.title);
                        setShowArticleDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm text-gray-900">{article.title}</div>
                      <div className="text-xs text-gray-500">{article.slug}</div>
                      {article.isLearnResource && (
                        <span className="text-xs text-blue-600">(Learn Resource)</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedArticle && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <strong>Selected:</strong> {selectedArticle.title} ({selectedArticle.slug})
                </div>
              )}
              </div>
            )}

            {itemType === 'RESOURCE' && (
              <div id="resource-search-container" className="relative">
                <label className="block text-sm font-medium mb-2">Search Resource</label>
                <input
                  type="text"
                  value={resourceSearch}
                  onChange={(e) => {
                    setResourceSearch(e.target.value);
                    if (e.target.value.trim().length > 2) {
                      setShowResourceDropdown(true);
                    }
                  }}
                  onFocus={() => {
                    if (resourceResults.length > 0) setShowResourceDropdown(true);
                  }}
                  placeholder="Type to search resources..."
                  className="input w-full"
                />
                {showResourceDropdown && resourceResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {resourceResults.map((resource) => (
                      <button
                        key={resource.id}
                        type="button"
                        onClick={() => {
                          setSelectedResource(resource);
                          setResourceSearch(resource.title);
                          setShowResourceDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-sm text-gray-900">{resource.title}</div>
                        <div className="text-xs text-gray-500">{resource.type} - {resource.category}</div>
                        {resource.description && (
                          <div className="text-xs text-gray-400 mt-1 line-clamp-1">{resource.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {selectedResource && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>Selected:</strong> {selectedResource.title}
                    {selectedResource.url && (
                      <div className="text-xs text-gray-600 mt-1">URL: {selectedResource.url}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {itemType === 'EXTERNAL_LINK' && (
              <div>
                <label className="block text-sm font-medium mb-2">External URL *</label>
                <input
                  name="externalUrl"
                  type="url"
                  required
                  className="input w-full"
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for external links.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setArticleSearch('');
                  setSelectedArticle(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="btn btn-primary">
                {isPending ? 'Adding…' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          No items yet. Add your first item to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="card p-4">
              {editingItemId === item.id ? (
                <form onSubmit={(e) => handleUpdateItem(item.id, e)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type *</label>
                    <select
                      name="type"
                      required
                      defaultValue={item.type}
                      className="input w-full"
                      onChange={(e) => {
                        const newType = e.target.value as LearnItemType;
                        setItemType(newType);
                        if (newType === 'EXTERNAL_LINK') {
                          setSelectedArticle(null);
                          setArticleSearch('');
                          setSelectedResource(null);
                          setResourceSearch('');
                        } else if (newType === 'ARTICLE') {
                          setSelectedResource(null);
                          setResourceSearch('');
                          if (item.articleSlug) {
                            setArticleSearch(item.articleSlug);
                          }
                        } else if (newType === 'RESOURCE') {
                          setSelectedArticle(null);
                          setArticleSearch('');
                        }
                      }}
                    >
                      <option value="ARTICLE">Article</option>
                      <option value="RESOURCE">Resource</option>
                      <option value="EXTERNAL_LINK">External Link</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      name="title"
                      type="text"
                      defaultValue={item.title || ''}
                      className="input w-full"
                      placeholder="Auto-filled from article/resource if not provided"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional - will be auto-filled from selected article/resource if left empty
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      name="description"
                      rows={2}
                      defaultValue={item.description || ''}
                      className="input w-full"
                      placeholder="Auto-filled from article/resource if not provided"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional - will be auto-filled from selected article/resource if left empty
                    </p>
                  </div>
                  {(itemType === 'RESOURCE' || (!itemType && item.type === 'RESOURCE')) && (
                    <div id="resource-search-container-edit" className="relative">
                      <label className="block text-sm font-medium mb-2">Search Resource</label>
                      <input
                        type="text"
                        value={resourceSearch}
                        onChange={(e) => {
                          setResourceSearch(e.target.value);
                          if (e.target.value.trim().length > 2) {
                            setShowResourceDropdown(true);
                          }
                        }}
                        onFocus={() => {
                          if (resourceResults.length > 0) setShowResourceDropdown(true);
                        }}
                        placeholder="Type to search resources..."
                        className="input w-full"
                      />
                      {showResourceDropdown && resourceResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {resourceResults.map((resource) => (
                            <button
                              key={resource.id}
                              type="button"
                              onClick={() => {
                                setSelectedResource(resource);
                                setResourceSearch(resource.title);
                                setShowResourceDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-sm text-gray-900">{resource.title}</div>
                              <div className="text-xs text-gray-500">{resource.type} - {resource.category}</div>
                              {resource.description && (
                                <div className="text-xs text-gray-400 mt-1 line-clamp-1">{resource.description}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedResource && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <strong>Selected:</strong> {selectedResource.title}
                          {selectedResource.url && (
                            <div className="text-xs text-gray-600 mt-1">URL: {selectedResource.url}</div>
                          )}
                        </div>
                      )}
                      {!selectedResource && item.resourceId && (
                        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                          <strong>Current Resource ID:</strong> {item.resourceId}
                        </div>
                      )}
                    </div>
                  )}
                  {(itemType === 'ARTICLE' || (!itemType && item.type === 'ARTICLE')) && (
                    <div id="article-search-container-edit" className="relative">
                      <label className="block text-sm font-medium mb-2">Search Article</label>
                      <input
                        type="text"
                        value={articleSearch || item.articleSlug || ''}
                        onChange={(e) => {
                          setArticleSearch(e.target.value);
                          if (e.target.value.trim().length > 2) {
                            setShowArticleDropdown(true);
                          }
                        }}
                        onFocus={() => {
                          if (articleResults.length > 0) setShowArticleDropdown(true);
                        }}
                        placeholder="Type to search articles..."
                        className="input w-full"
                      />
                      {showArticleDropdown && articleResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {articleResults.map((article) => (
                            <button
                              key={article.id}
                              type="button"
                              onClick={() => {
                                setSelectedArticle(article);
                                setArticleSearch(article.title);
                                setShowArticleDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-sm text-gray-900">{article.title}</div>
                              <div className="text-xs text-gray-500">{article.slug}</div>
                              {article.isLearnResource && (
                                <span className="text-xs text-blue-600">(Learn Resource)</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedArticle && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <strong>Selected:</strong> {selectedArticle.title} ({selectedArticle.slug})
                        </div>
                      )}
                      {!selectedArticle && item.articleSlug && (
                        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                          <strong>Current:</strong> {item.articleSlug}
                        </div>
                      )}
                    </div>
                  )}
                  {(itemType === 'EXTERNAL_LINK' || (!itemType && item.type === 'EXTERNAL_LINK')) && (
                    <div>
                      <label className="block text-sm font-medium mb-2">External URL *</label>
                      <input
                        name="externalUrl"
                        type="url"
                        required
                        defaultValue={item.externalUrl || ''}
                        className="input w-full"
                      />
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItemId(null);
                        setSelectedArticle(null);
                        setArticleSearch('');
                        setSelectedResource(null);
                        setResourceSearch('');
                        setItemType(null);
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={isPending} className="btn btn-primary">
                      {isPending ? 'Updating…' : 'Update'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{item.title}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                        {item.type === 'ARTICLE' ? 'Article' : item.type === 'RESOURCE' ? 'Resource' : 'External Link'}
                      </span>
                      <span className="text-xs text-gray-500">Order: {item.order}</span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    )}
                    {item.type === 'ARTICLE' && item.articleSlug && (
                      <p className="text-xs text-gray-500">
                        Article: {item.articleSlug} → /learn/{item.articleSlug}
                      </p>
                    )}
                    {item.type === 'RESOURCE' && item.resourceId && (
                      <p className="text-xs text-gray-500">
                        Resource ID: {item.resourceId}
                      </p>
                    )}
                    {item.type === 'EXTERNAL_LINK' && item.externalUrl && (
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {item.externalUrl}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveItem(item.id, 'up')}
                      disabled={index === 0}
                      className="btn btn-secondary text-xs"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveItem(item.id, 'down')}
                      disabled={index === items.length - 1}
                      className="btn btn-secondary text-xs"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItemId(item.id)}
                      className="btn btn-secondary text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={isPending}
                      className="btn btn-danger text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

