'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createFeaturedItem, updateFeaturedItem } from '@/app/actions/featured';

type FeaturedItem = {
  id?: string;
  kind: string;
  title: string;
  description: string;
  slug?: string | null;
  externalUrl?: string | null;
  internalArticleSlug?: string | null;
  internalResourceId?: string | null;
  thumbnailUrl?: string | null;
  creatorName?: string | null;
  creatorUrl?: string | null;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED';
  isFeatured?: boolean;
  clickCount?: number;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export default function FeaturedContentForm({ initial }: { initial?: FeaturedItem | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = initial?.id
        ? await updateFeaturedItem(initial.id, formData)
        : await createFeaturedItem(formData);
      if (res.success && res.item) {
        router.push(`/studio/featured/${res.item.id}`);
        router.refresh();
      } else {
        setError(res.error || 'Failed to save');
      }
    });
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kind *</label>
            <select name="kind" defaultValue={initial?.kind || ''} required className="input w-full">
              <option value="">Select kind</option>
              {['EXTERNAL_LINK','INTERNAL_ARTICLE','INTERNAL_RESOURCE','ARTWORK','BOOK','COPING_TOOL','RESEARCH','OTHER'].map(k => (
                <option key={k} value={k}>{k.replace(/_/g,' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select name="status" defaultValue={initial?.status || 'DRAFT'} className="input w-full">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input name="title" defaultValue={initial?.title || ''} required className="input w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description *</label>
          <textarea name="description" rows={4} defaultValue={initial?.description || ''} required className="input w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">External URL</label>
            <input name="externalUrl" type="url" defaultValue={initial?.externalUrl || ''} className="input w-full" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Internal article slug</label>
            <input name="internalArticleSlug" defaultValue={initial?.internalArticleSlug || ''} className="input w-full" placeholder="e.g. what-is-cptsd-in-india" />
            <p className="text-xs text-gray-500 mt-1">For INTERNAL_ARTICLE, must match blog slug (e.g. learn/[slug]).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Internal resource ID</label>
            <input name="internalResourceId" defaultValue={initial?.internalResourceId || ''} className="input w-full" placeholder="Resource ObjectId" />
            <p className="text-xs text-gray-500 mt1">For INTERNAL_RESOURCE, paste Resource ID (dropdown can be added later).</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
            <input name="thumbnailUrl" type="url" defaultValue={initial?.thumbnailUrl || ''} className="input w-full" placeholder="https://..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Creator name</label>
            <input name="creatorName" defaultValue={initial?.creatorName || ''} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Creator URL</label>
            <input name="creatorUrl" type="url" defaultValue={initial?.creatorUrl || ''} className="input w-full" placeholder="https://..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <input name="tags" defaultValue={(initial?.tags || []).join(', ')} className="input w-full" placeholder="art, grounding, india" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input type="checkbox" name="isFeatured" value="true" defaultChecked={!!initial?.isFeatured} className="mr-2" />
              <span className="text-sm font-medium">Featured (show on home)</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Provide at least one of: External URL, Internal article slug, or Internal resource ID.
          </div>
          <button type="submit" disabled={isPending} className="btn btn-primary">
            {isPending ? 'Saving…' : initial?.id ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}


