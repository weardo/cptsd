'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '@/app/actions/posts';
import { uploadFile } from '@/app/actions/uploads';
import FileUpload from './FileUpload';

type Topic = {
  id: string;
  name: string;
  slug: string;
};

type PostFormProps = {
  topics: Topic[];
};

export default function PostForm({ topics }: PostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [finchScreenshotUrl, setFinchScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await uploadFile(formData);
      
      if (result.success && result.url) {
        setFinchScreenshotUrl(result.url);
      } else {
        setError(result.error || 'Failed to upload file');
      }
    } catch (err) {
      setError('An error occurred while uploading the file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData(e.currentTarget);
    if (finchScreenshotUrl) {
      formData.append('finchScreenshotUrl', finchScreenshotUrl);
    }
    
    startTransition(async () => {
      const result = await createPost(formData);
      if (result.success && result.post) {
        router.push(`/posts/${result.post.id}`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to create post');
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
          <label htmlFor="topicId" className="block text-sm font-medium mb-2">
            Topic *
          </label>
          <select
            id="topicId"
            name="topicId"
            required
            className="input"
          >
            <option value="">Select a topic</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="postType" className="block text-sm font-medium mb-2">
            Post Type *
          </label>
          <select
            id="postType"
            name="postType"
            required
            className="input"
          >
            <option value="CAROUSEL">Carousel</option>
            <option value="REEL">Reel</option>
            <option value="STORY">Story</option>
            <option value="MEME">Meme</option>
          </select>
        </div>

        <div>
          <label htmlFor="rawIdea" className="block text-sm font-medium mb-2">
            Raw Idea *
          </label>
          <textarea
            id="rawIdea"
            name="rawIdea"
            rows={4}
            required
            className="input"
            placeholder="Enter your content idea here..."
          />
        </div>

        <div>
          <label htmlFor="finchScreenshot" className="block text-sm font-medium mb-2">
            Finch Screenshot (Optional)
          </label>
          <FileUpload
            onUpload={handleFileUpload}
            currentUrl={finchScreenshotUrl}
            uploading={uploading}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
            disabled={isPending || uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending || uploading}
          >
            {isPending ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

