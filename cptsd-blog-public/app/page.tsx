import { getPublishedBlogs, getAllTopics } from '@/lib/blogActions';
import Link from 'next/link';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Explore articles, resources, and insights on Complex PTSD recovery and healing. Find support and guidance on your healing journey.',
  openGraph: {
    title: 'CPTSD Healing Blog | Resources for Complex PTSD Recovery',
    description:
      'Explore articles, resources, and insights on Complex PTSD recovery and healing.',
    type: 'website',
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = 12;
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

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'CPTSD Healing Blog',
    description:
      'A safe, supportive space for sharing resources, insights, and stories about Complex PTSD recovery and healing.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://cptsd-blog.com',
    publisher: {
      '@type': 'Organization',
      name: 'CPTSD Healing Blog',
    },
    blogPost: blogs.map((blog) => ({
      '@type': 'BlogPosting',
      headline: blog.title,
      description: blog.excerpt || blog.seoDescription,
      datePublished: blog.publishedAt,
      dateModified: blog.updatedAt,
      author: {
        '@type': 'Organization',
        name: 'CPTSD Healing Blog',
      },
      image: blog.featuredImage,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cptsd-blog.com'}/blog/${blog.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link
                href="/"
                className="text-xl lg:text-2xl font-bold text-[#5b8a9f] hover:text-[#4a7283] transition-colors"
              >
                CPTSD Healing Blog
              </Link>
              <form
                method="get"
                action="/"
                className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    name="search"
                    defaultValue={params.search || ''}
                    placeholder="Search articles..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b8a9f] focus:border-transparent bg-white text-gray-900 text-sm"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5b8a9f] text-white rounded-lg hover:bg-[#4a7283] transition-colors text-sm font-semibold shadow-sm"
                >
                  Search
                </button>
              </form>
              <div className="text-sm text-gray-600 font-medium hidden lg:block">
                Resources for Recovery
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
          {/* Hero Section */}
          <section className="text-center mb-12 lg:mb-16 py-8 lg:py-12 px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 lg:mb-6 leading-tight">
              Welcome to Your Healing Journey
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A safe, supportive space for sharing resources, insights, and
              stories about Complex PTSD recovery and healing.
            </p>
          </section>

          {/* Search and Filters */}
          <section className="mb-10 lg:mb-12 space-y-6">
            {/* Mobile Search */}
            <form
              method="get"
              action="/"
              className="flex md:hidden flex-col gap-3"
            >
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  defaultValue={params.search || ''}
                  placeholder="Search articles..."
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b8a9f] focus:border-transparent bg-white text-gray-900"
                  aria-label="Search articles"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#5b8a9f] text-white rounded-lg hover:bg-[#4a7283] transition-colors font-semibold"
                >
                  Search
                </button>
                {params.search && (
                  <Link
                    href="/"
                    className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300 transition-colors font-semibold"
                  >
                    Clear
                  </Link>
                )}
              </div>
            </form>

            {/* Topics Filter */}
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                    !params.topic
                      ? 'bg-[#5b8a9f] text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-[#5b8a9f]'
                  }`}
                >
                  All Topics
                </Link>
                {topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/?topic=${topic.id}`}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                      params.topic === topic.id
                        ? 'bg-[#5b8a9f] text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-[#5b8a9f]'
                    }`}
                  >
                    {topic.name}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Blog Posts Grid */}
          {blogs.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">📝</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  No articles found
                </h2>
                <p className="text-gray-600 mb-6">
                  {params.search || params.topic
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Check back soon for new articles.'}
                </p>
                {(params.search || params.topic) && (
                  <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-[#5b8a9f] text-white rounded-lg hover:bg-[#4a7283] transition-colors font-semibold"
                  >
                    View All Articles
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
                {blogs.map((blog) => (
                  <article
                    key={blog.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group"
                  >
                    {blog.featuredImage && (
                      <Link href={`/blog/${blog.slug}`} className="block">
                        <div className="aspect-video overflow-hidden bg-gradient-to-br from-[#9fb3a7]/20 to-[#c9a788]/20">
                          <img
                            src={blog.featuredImage}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                      </Link>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-4 flex-wrap">
                        {blog.topic && (
                          <Link
                            href={`/?topic=${blog.topic.id}`}
                            className="px-3 py-1 bg-[#9fb3a7]/20 text-[#5b8a9f] rounded-full font-medium hover:bg-[#9fb3a7]/30 transition-colors text-xs"
                          >
                            {blog.topic.name}
                          </Link>
                        )}
                        {blog.publishedAt && (
                          <time
                            dateTime={blog.publishedAt.toString()}
                            className="text-xs"
                          >
                            {new Date(blog.publishedAt).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </time>
                        )}
                        {blog.readingTime && (
                          <span className="text-xs">
                            • {blog.readingTime} min read
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/blog/${blog.slug}`}
                        className="block group/link"
                      >
                        <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover/link:text-[#5b8a9f] transition-colors leading-tight line-clamp-2">
                          {blog.title}
                        </h2>
                        {blog.excerpt && (
                          <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3 text-sm">
                            {blog.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                          <span className="text-[#5b8a9f] font-semibold text-sm group-hover/link:underline">
                            Read more →
                          </span>
                          {blog.tags && blog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {blog.tags
                                .slice(0, 2)
                                .map((tag: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav
                  className="flex justify-center items-center gap-4 pt-8 border-t border-gray-200"
                  aria-label="Pagination"
                >
                  {page > 1 && (
                    <Link
                      href={`/?page=${page - 1}${params.topic ? `&topic=${params.topic}` : ''}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}`}
                      className="px-6 py-3 bg-white text-gray-700 hover:bg-gray-50 font-semibold rounded-lg border border-gray-300 transition-colors shadow-sm"
                    >
                      ← Previous
                    </Link>
                  )}
                  <span className="px-6 py-3 text-gray-600 text-sm font-medium">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/?page=${page + 1}${params.topic ? `&topic=${params.topic}` : ''}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}`}
                      className="px-6 py-3 bg-white text-gray-700 hover:bg-gray-50 font-semibold rounded-lg border border-gray-300 transition-colors shadow-sm"
                    >
                      Next →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#5b8a9f] mb-3">
                CPTSD Healing Blog
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                A safe space for sharing resources, insights, and stories about
                Complex PTSD recovery and healing. We're here to support you on
                your journey.
              </p>
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} CPTSD Healing Blog. All
                rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
