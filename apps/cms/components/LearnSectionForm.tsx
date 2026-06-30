'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLearnSection, updateLearnSection } from '@/app/actions/learn';

type LearnSection = {
  id?: string;
  title: string;
  description?: string | null;
  order: number;
  status: 'DRAFT' | 'PUBLISHED';
};

export default function LearnSectionForm({ initial }: { initial?: LearnSection | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = initial?.id
        ? await updateLearnSection(initial.id, formData)
        : await createLearnSection(formData);
      if (res.success && res.section) {
        router.push(`/studio/learn/${res.section.id}`);
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

        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            name="title"
            defaultValue={initial?.title || ''}
            required
            className="input w-full"
            placeholder="e.g., Basics, India Context, Daily Life"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={initial?.description || ''}
            className="input w-full"
            placeholder="Brief description of this section"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Order</label>
            <input
              name="order"
              type="number"
              defaultValue={initial?.order || 0}
              className="input w-full"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select name="status" defaultValue={initial?.status || 'DRAFT'} className="input w-full">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button type="submit" disabled={isPending} className="btn btn-primary">
            {isPending ? 'Saving…' : initial?.id ? 'Update Section' : 'Create Section'}
          </button>
        </div>
      </form>
    </div>
  );
}



