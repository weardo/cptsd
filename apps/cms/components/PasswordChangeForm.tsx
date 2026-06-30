'use client';

import { useState, useTransition } from 'react';
import { changePassword } from '@/app/actions/users';

export default function PasswordChangeForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await changePassword(formData);

      if (result.success) {
        setSuccess(result.message || 'Password changed successfully');
        (e.target as HTMLFormElement).reset();
        setTimeout(() => {
          setSuccess('');
          setShowForm(false);
        }, 3000);
      } else {
        setError(result.error || 'Failed to change password');
      }
    });
  };

  if (!showForm) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <p className="text-sm text-gray-600 mb-4">
          Update your account password. Make sure to use a strong password.
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn btn-secondary"
        >
          Change Password
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Change Password</h2>
      <p className="text-sm text-gray-600 mb-4">
        Update your account password. Make sure to use a strong password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
            {success}
          </div>
        )}

        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
            Current Password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            className="input"
            autoComplete="current-password"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            className="input"
            autoComplete="new-password"
          />
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 8 characters long
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className="input"
            autoComplete="new-password"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setError('');
              setSuccess('');
            }}
            className="btn btn-secondary"
            disabled={isPending}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

