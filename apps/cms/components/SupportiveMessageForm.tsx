'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupportiveMessage, updateSupportiveMessage } from '@/app/actions/supportiveMessages';

// PetType enum - matches SupportiveMessagePetType from @cptsd/db
enum PetType {
  CAT = 'cat',
  DOG = 'dog',
  BIRD = 'bird',
  RABBIT = 'rabbit',
  BUTTERFLY = 'butterfly',
  LEAF = 'leaf',
  ALL = 'all',
}

type SupportiveMessageFormProps = {
  message?: {
    id: string;
    message: string;
    petType: PetType;
    priority: number;
    isActive: boolean;
    tags: string[];
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    usageCount: number;
  } | null;
};

export default function SupportiveMessageForm({ message }: SupportiveMessageFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const formatDateForInput = (date?: Date | string | null) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = message
        ? await updateSupportiveMessage(message.id, formData)
        : await createSupportiveMessage(formData);

      if (result.success) {
        router.push('/supportive-messages');
        router.refresh();
      } else {
        setError(result.error || 'Failed to save message');
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
          <label htmlFor="message" className="block text-sm font-medium mb-2">
            Message * (max 200 characters)
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            required
            maxLength={200}
            defaultValue={message?.message || ''}
            className="input w-full"
            placeholder="e.g., You are not broken. Your feelings are valid."
          />
          <p className="text-xs text-gray-500 mt-1">
            Keep messages supportive, trauma-informed, and concise. They appear in speech bubbles.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="petType" className="block text-sm font-medium mb-2">
              Pet Type *
            </label>
            <select
              id="petType"
              name="petType"
              required
              defaultValue={message?.petType || PetType.ALL}
              className="input w-full"
            >
              <option value={PetType.ALL}>All Pets</option>
              <option value={PetType.CAT}>Cat</option>
              <option value={PetType.DOG}>Dog</option>
              <option value={PetType.BIRD}>Bird</option>
              <option value={PetType.RABBIT}>Rabbit</option>
              <option value={PetType.BUTTERFLY}>Butterfly</option>
              <option value={PetType.LEAF}>Leaf</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select which pet(s) should show this message, or "All Pets" for any pet.
            </p>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium mb-2">
              Priority (1-10) *
            </label>
            <input
              type="number"
              id="priority"
              name="priority"
              min="1"
              max="10"
              required
              defaultValue={message?.priority || 5}
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Higher priority messages are shown more often. Default is 5.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            defaultValue={message?.tags.join(', ') || ''}
            className="input w-full"
            placeholder="seasonal, winter, holiday, trending, crisis"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use tags like: seasonal, winter, summer, holiday, trending, crisis, general. Helps filter
            messages by context.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-2">
              Start Date (optional)
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              defaultValue={formatDateForInput(message?.startDate)}
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              When to start showing this message. Leave empty for immediate.
            </p>
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-2">
              End Date (optional)
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              defaultValue={formatDateForInput(message?.endDate)}
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              When to stop showing this message. Leave empty for no end date.
            </p>
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={message?.isActive !== false}
              className="mr-2"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Only active messages are shown by pets. Deactivate to temporarily hide without deleting.
          </p>
        </div>

        {message && (
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">
              <strong>Usage Count:</strong> {message.usageCount || 0} times shown
            </p>
          </div>
        )}

        <div className="flex space-x-4">
          <button type="submit" disabled={isPending} className="btn btn-primary">
            {isPending ? 'Saving...' : message ? 'Update Message' : 'Create Message'}
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

