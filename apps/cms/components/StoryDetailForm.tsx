'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { approveStory, rejectStory, deleteStory, hideStory, unhideStory } from '@/app/actions/stories';

interface Story {
  id: string;
  pseudonym: string;
  title: string | null;
  body: string;
  status: string;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function StoryDetailForm({ story }: { story: Story }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(story.title || '');
  const [body, setBody] = useState(story.body);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('body', body);

    try {
      const response = await fetch(`/api/stories/${story.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        router.refresh();
        alert('Story updated successfully');
      } else {
        alert('Failed to update story');
      }
    } catch (error) {
      console.error('Error updating story:', error);
      alert('Error updating story');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this story?')) return;

    setIsSaving(true);
    const result = await approveStory(story.id);
    if (result.success) {
      router.push('/studio/stories?status=APPROVED');
    } else {
      alert(result.error || 'Failed to approve story');
    }
    setIsSaving(false);
  };

  const handleReject = async () => {
    if (!confirm('Reject this story? This action cannot be undone.')) return;

    setIsSaving(true);
    const result = await rejectStory(story.id);
    if (result.success) {
      router.push('/studio/stories?status=REJECTED');
    } else {
      alert(result.error || 'Failed to reject story');
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this story permanently? This action cannot be undone.')) return;

    setIsSaving(true);
    const result = await deleteStory(story.id);
    if (result.success) {
      router.push('/studio/stories');
    } else {
      alert(result.error || 'Failed to delete story');
    }
    setIsSaving(false);
  };

  const handleHide = async () => {
    if (!confirm('Hide this story from public view? It will be moved to rejected status.')) return;

    setIsSaving(true);
    const result = await hideStory(story.id);
    if (result.success) {
      router.refresh();
      alert('Story hidden successfully');
    } else {
      alert(result.error || 'Failed to hide story');
    }
    setIsSaving(false);
  };

  const handleUnhide = async () => {
    setIsSaving(true);
    const result = await unhideStory(story.id);
    if (result.success) {
      router.refresh();
      alert('Story unhidden and approved');
    } else {
      alert(result.error || 'Failed to unhide story');
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <Link
          href="/studio/stories"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to Stories
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Story Details</h1>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              story.status === 'APPROVED'
                ? 'bg-green-100 text-green-800'
                : story.status === 'REJECTED'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {story.status}
          </span>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Pseudonym:</strong> {story.pseudonym}
          </p>
          <p>
            <strong>Submitted:</strong>{' '}
            {new Date(story.createdAt).toLocaleString()}
          </p>
          {story.approvedAt && (
            <p>
              <strong>Approved:</strong>{' '}
              {new Date(story.approvedAt).toLocaleString()} by {story.approvedBy || 'Unknown'}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Story title"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
            Story Body
          </label>
          <textarea
            id="body"
            rows={15}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">{body.length} characters</p>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>

          {story.status === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}

          {story.status === 'APPROVED' && (
            <button
              type="button"
              onClick={handleHide}
              disabled={isSaving}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium disabled:opacity-50"
            >
              Hide
            </button>
          )}

          {story.status === 'REJECTED' && (
            <button
              type="button"
              onClick={handleUnhide}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              Unhide & Approve
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            disabled={isSaving}
            className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 font-medium disabled:opacity-50 ml-auto"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}

