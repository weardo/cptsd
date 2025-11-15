'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Topic = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type TopicFormProps = {
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  topic?: Topic;
};

export default function TopicForm({ action, topic }: TopicFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await action(formData);
      if (result.success) {
        router.push('/topics');
        router.refresh();
      } else {
        setError(result.error || 'An error occurred');
      }
    });
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={topic?.name}
            required
            className="input"
            placeholder="e.g., Healing Journey"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={topic?.description || ''}
            className="input"
            placeholder="Optional description of this topic"
          />
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
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

