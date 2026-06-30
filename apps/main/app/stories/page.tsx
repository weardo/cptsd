import Link from 'next/link';
import { getApprovedStories } from '@/lib/dataActions';

export const dynamic = 'force-dynamic';

export default async function StoriesPage() {
  const stories = await getApprovedStories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-on-surface mb-4">Community Stories</h1>
        <p className="text-xl text-on-surface mb-6">
          Shared experiences from people navigating CPTSD. These stories are shared pseudonymously
          to protect privacy while creating connection.
        </p>
        <Link href="/stories/submit" className="btn btn-secondary inline-block text-center no-underline">
          Share Your Story
        </Link>
      </div>

      {stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="bg-surface-container-lowest rounded-xl p-6 hover:bg-surface-variant transition-colors no-underline"
              style={{ boxShadow: 'var(--shadow-ambient)' }}
            >
              <h2 className="text-xl font-semibold text-on-surface mb-2">{story.title}</h2>
              <p className="text-sm text-on-surface-variant mb-3">By {story.pseudonym}</p>
              <p className="text-on-surface-variant line-clamp-3 mb-6">{story.excerpt}...</p>
              <span className="text-primary font-medium">Read more →</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center" style={{ boxShadow: 'var(--shadow-ambient)' }}>
          <p className="text-on-surface-variant text-lg mb-6">No community stories have been published yet.</p>
          <Link href="/stories/submit" className="text-primary font-medium">
            Be the first to share your story →
          </Link>
        </div>
      )}
    </div>
  );
}
