import { getPublishedBlogs, getAllTopics } from '@/lib/blogActions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  const [blogsResult, topics] = await Promise.all([
    getPublishedBlogs({
      topicId: params.topic,
      search: params.search,
      limit,
      skip,
    }),
    getAllTopics(),
  ]);

  const blogs = blogsResult.blogs || [];
  const total = blogsResult.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            CPTSD Blog
          </Link>
          <p className="text-gray-600 mt-2">Resources and insights on Complex PTSD recovery and healing</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Topics Filter */}
        {topics.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  !params.topic
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Topics
              </Link>
              {topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/?topic=${topic.id}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    params.topic === topic.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {topic.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <form method="get" className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              name="search"
              defaultValue={params.search || ''}
              placeholder="Search blogs..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
            {params.search && (
              <Link
                href="/"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {/* Blog List */}
        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No blog posts found.</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {blogs.map((blog) => (
                <article
                  key={blog.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-6">
                    {blog.featuredImage && (
                      <div className="flex-shrink-0">
                        <img
                          src={blog.featuredImage}
                          alt={blog.title}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        {blog.topic && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {blog.topic.name}
                          </span>
                        )}
                        {blog.publishedAt && (
                          <time dateTime={blog.publishedAt.toString()}>
                            {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </time>
                        )}
                        {blog.readingTime && (
                          <span>• {blog.readingTime} min read</span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        <Link
                          href={`/blog/${blog.slug}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {blog.title}
                        </Link>
                      </h2>
                      {blog.excerpt && (
                        <p className="text-gray-600 mb-4">{blog.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/blog/${blog.slug}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Read more →
                        </Link>
                        {blog.tags && blog.tags.length > 0 && (
                          <div className="flex gap-2">
                            {blog.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/?page=${page - 1}${params.topic ? `&topic=${params.topic}` : ''}${params.search ? `&search=${params.search}` : ''}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                <span className="px-4 py-2 text-gray-600">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/?page=${page + 1}${params.topic ? `&topic=${params.topic}` : ''}${params.search ? `&search=${params.search}` : ''}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} CPTSD Blog. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

