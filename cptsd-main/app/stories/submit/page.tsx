'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmitStoryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    pseudonym: '',
    title: '',
    body: '',
    agreeGuidelines: false,
    agreeNotTherapy: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!formData.agreeGuidelines || !formData.agreeNotTherapy) {
      setError('Please agree to both statements before submitting.');
      setIsSubmitting(false);
      return;
    }

    if (formData.body.length < 50) {
      setError('Your story must be at least 50 characters long.');
      setIsSubmitting(false);
      return;
    }

    if (formData.body.length > 10000) {
      setError('Your story must be less than 10,000 characters.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pseudonym: formData.pseudonym,
          title: formData.title || undefined,
          body: formData.body,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit story');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/stories');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-green-900 mb-4">Thank you for sharing</h2>
          <p className="text-green-800 mb-4">
            Your story has been submitted and is pending review. We'll review it and publish it
            if it meets our community guidelines.
          </p>
          <p className="text-green-700 text-sm">
            Redirecting to stories page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Share Your Story</h1>
      <p className="text-gray-700 mb-8">
        Share your experience navigating CPTSD. Your story will be reviewed before publication
        and will be shared pseudonymously to protect your privacy.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="pseudonym" className="block text-sm font-medium text-gray-700 mb-2">
            Pseudonym (required)
          </label>
          <input
            type="text"
            id="pseudonym"
            required
            value={formData.pseudonym}
            onChange={(e) => setFormData({ ...formData, pseudonym: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="How you'd like to be identified (e.g., 'Anonymous', 'Ravi', 'S')"
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="A brief title for your story (optional)"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
            Your Story (required)
          </label>
          <textarea
            id="body"
            required
            rows={12}
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your experience... (50-10,000 characters)"
          />
          <p className="text-sm text-gray-500 mt-2">
            {formData.body.length} / 10,000 characters
          </p>
        </div>

        <div className="space-y-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.agreeNotTherapy}
              onChange={(e) => setFormData({ ...formData, agreeNotTherapy: e.target.checked })}
              className="mt-1 mr-3"
              required
            />
            <span className="text-sm text-gray-700">
              I understand this is not therapy or crisis support.
            </span>
          </label>

          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.agreeGuidelines}
              onChange={(e) => setFormData({ ...formData, agreeGuidelines: e.target.checked })}
              className="mt-1 mr-3"
              required
            />
            <span className="text-sm text-gray-700">
              I agree to the{' '}
              <a href="/community" className="text-blue-600 hover:text-blue-700 underline">
                community guidelines
              </a>
              .
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Story'}
        </button>
      </form>
    </div>
  );
}

