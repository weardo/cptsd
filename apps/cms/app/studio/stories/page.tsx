import { getStories } from '@/app/actions/stories';

import { StoryStatus } from '@cptsd/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status as StoryStatus) || StoryStatus.PENDING;

  const storiesResult = await getStories({
    status,
    limit: 100,
  });

  const stories = storiesResult.stories || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Community Stories</h1>
          <p className="text-gray-600 mt-2">Moderate community story submissions</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/studio/stories?status=PENDING"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                status === StoryStatus.PENDING
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending ({storiesResult.total || 0})
            </Link>
            <Link
              href="/studio/stories?status=APPROVED"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                status === StoryStatus.APPROVED
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approved
            </Link>
            <Link
              href="/studio/stories?status=REJECTED"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                status === StoryStatus.REJECTED
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rejected
            </Link>
          </nav>
        </div>

        {/* Stories List */}
        {stories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No {status.toLowerCase()} stories found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {story.title || 'Untitled Story'}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {story.pseudonym}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {story.body.substring(0, 200)}...
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Submitted: {new Date(story.createdAt).toLocaleDateString()}
                      </span>
                      {story.approvedAt && (
                        <span>
                          Approved: {new Date(story.approvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 flex-wrap">
                    <Link
                      href={`/studio/stories/${story.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      View
                    </Link>
                    {status === StoryStatus.PENDING && (
                      <>
                        <form action={`/studio/stories/${story.id}/approve`} method="post">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={`/studio/stories/${story.id}/reject`} method="post">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Reject
                          </button>
                        </form>
                      </>
                    )}
                    {status === StoryStatus.APPROVED && (
                      <form action={`/studio/stories/${story.id}/hide`} method="post">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
                        >
                          Hide
                        </button>
                      </form>
                    )}
                    {status === StoryStatus.REJECTED && (
                      <form action={`/studio/stories/${story.id}/unhide`} method="post">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          Unhide
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

