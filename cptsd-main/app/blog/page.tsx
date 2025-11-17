import { getPublishedBlogs, getAllTopics } from '@/lib/blogActions';
import Link from 'next/link';
import { Metadata } from 'next';
import { Suspense } from 'react';
import BlogCard from '@/components/BlogCard';
import BlogSearchTracker from './blog-search-tracker';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Explore articles, resources, and insights on Complex PTSD recovery and healing. Find support and guidance on your healing journey.',
  openGraph: {
    title: 'CPTSD Blog | Resources for Complex PTSD Recovery',
    description:
      'Explore articles, resources, and insights on Complex PTSD recovery and healing.',
    type: 'website',
  },
};

export default async function BlogPage({
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
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://cptsd.in',
    publisher: {
      '@type': 'Organization',
      name: 'CPTSD.in',
    },
    blogPost: blogs.map((blog) => ({
      '@type': 'BlogPosting',
      headline: blog.title,
      description: blog.excerpt || blog.seoDescription,
      datePublished: blog.publishedAt,
      dateModified: blog.updatedAt,
      author: {
        '@type': 'Organization',
        name: 'CPTSD.in',
      },
      image: blog.featuredImage,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cptsd.in'}/blog/${blog.slug}`,
    })),
  };

  return (
    <>
      <Suspense fallback={null}>
        <BlogSearchTracker />
      </Suspense>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
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
              action="/blog"
              className="flex md:hidden flex-col gap-3"
            >
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  defaultValue={params.search || ''}
                  placeholder="Search articles..."
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soft-lavender focus:border-transparent bg-white text-gray-900"
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
                  className="flex-1 btn btn-primary"
                >
                  Search
                </button>
                {params.search && (
                  <Link
                    href="/blog"
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
                  href="/blog"
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                    !params.topic
                      ? 'btn-primary text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-soft-lavender'
                  }`}
                >
                  All Topics
                </Link>
                {topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/blog?topic=${topic.id}`}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                      params.topic === topic.id
                        ? 'btn-primary text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-soft-lavender'
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
                    href="/blog"
                    className="inline-block btn btn-primary"
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
                  <BlogCard
                    key={blog.id}
                    slug={blog.slug}
                    title={blog.title}
                    excerpt={blog.excerpt}
                    featuredImage={blog.featuredImage}
                    topic={blog.topic || undefined}
                    publishedAt={blog.publishedAt}
                    readingTime={blog.readingTime}
                    tags={blog.tags}
                    source="blog"
                  />
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
                      href={`/blog?page=${page - 1}${params.topic ? `&topic=${params.topic}` : ''}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}`}
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
                      href={`/blog?page=${page + 1}${params.topic ? `&topic=${params.topic}` : ''}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}`}
                      className="px-6 py-3 bg-white text-gray-700 hover:bg-gray-50 font-semibold rounded-lg border border-gray-300 transition-colors shadow-sm"
                    >
                      Next →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
      </div>
    </>
  );
}

