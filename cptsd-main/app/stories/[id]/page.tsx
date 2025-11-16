import { getStoryById } from '@/lib/dataActions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StoryViewTracker from './story-view-tracker';

// Force dynamic rendering to fetch data at request time
export const dynamic = 'force-dynamic';

export default async function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await getStoryById(id);

  if (!story) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <StoryViewTracker storyId={id} title={story.title || 'Untitled Story'} />
      <Link
        href="/stories"
        className="text-blue-600 hover:text-blue-700 mb-6 inline-block"
      >
        ← Back to all stories
      </Link>

      <article className="bg-white rounded-lg border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {story.title || 'Untitled Story'}
        </h1>
        <p className="text-gray-600 mb-6">By {story.pseudonym}</p>
        {story.createdAt && (
          <p className="text-sm text-gray-500 mb-8">
            {new Date(story.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}

        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {story.body}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 bg-blue-50 p-6 rounded">
          <p className="text-sm text-gray-700 italic">
            <strong>Note:</strong> These are personal experiences shared by community members.
            They are not professional advice, medical diagnosis, or treatment recommendations.
            If you need professional support, please consult a qualified mental health provider
            or visit our{' '}
            <Link href="/support" className="text-blue-600 hover:text-blue-700 underline">
              support page
            </Link>
            .
          </p>
        </div>
      </article>
    </div>
  );
}

