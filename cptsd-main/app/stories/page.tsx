import Link from 'next/link';
import { getApprovedStories } from '@/lib/dataActions';

export default async function StoriesPage() {
  const stories = await getApprovedStories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Community Stories</h1>
        <p className="text-xl text-gray-700 mb-6">
          Shared experiences from people navigating CPTSD. These stories are shared pseudonymously
          to protect privacy while creating connection.
        </p>
        <Link
          href="/stories/submit"
          className="btn btn-secondary inline-block text-center"
        >
          Share Your Story
        </Link>
      </div>

      {stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{story.title}</h2>
              <p className="text-sm text-gray-500 mb-3">By {story.pseudonym}</p>
              <p className="text-gray-600 line-clamp-3 mb-4">{story.excerpt}...</p>
              <span className="text-blue-600 font-medium">Read more →</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">No community stories have been published yet.</p>
          <Link
            href="/stories/submit"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Be the first to share your story →
          </Link>
        </div>
      )}
    </div>
  );
}

