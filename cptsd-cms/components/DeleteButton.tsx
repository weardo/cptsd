'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type DeleteButtonProps = {
  onDelete: () => Promise<{ success: boolean; error?: string }>;
  itemName: string;
  hasDependencies?: boolean;
  dependencyCount?: number;
  dependencyName?: string;
  redirectPath?: string; // Optional path to redirect to after deletion
};

export default function DeleteButton({
  onDelete,
  itemName,
  hasDependencies = false,
  dependencyCount = 0,
  dependencyName = 'items',
  redirectPath,
}: DeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = () => {
    if (hasDependencies) {
      setError(`Cannot delete. This item has ${dependencyCount} ${dependencyName}.`);
      return;
    }

    setError('');
    startTransition(async () => {
      const result = await onDelete();
      if (result.success) {
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.refresh();
        }
      } else {
        setError(result.error || 'Failed to delete');
      }
    });
  };

  if (showConfirm && !hasDependencies) {
    return (
      <div className="flex items-center space-x-2">
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="btn bg-red-600 text-white hover:bg-red-700"
        >
          {isPending ? 'Deleting...' : 'Confirm Delete'}
        </button>
        <button
          onClick={() => {
            setShowConfirm(false);
            setError('');
          }}
          className="btn btn-secondary"
          disabled={isPending}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-2 text-sm text-red-600">{error}</div>
      )}
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isPending || hasDependencies}
        className={`btn ${
          hasDependencies
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        Delete
      </button>
    </div>
  );
}

