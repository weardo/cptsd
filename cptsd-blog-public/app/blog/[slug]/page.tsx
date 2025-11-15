import {
  getBlogBySlug,
  getRelatedBlogs,
  getAllTopics,
  getPublishedBlogs,
} from '@/lib/blogActions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Metadata } from 'next';
import React from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return {
      title: 'Post Not Found',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cptsd-blog.com';
  const url = `${siteUrl}/blog/${slug}`;
  const imageUrl = blog.featuredImage || `${siteUrl}/og-image.jpg`;

  return {
    title: blog.seoTitle || blog.title,
    description:
      blog.seoDescription ||
      blog.excerpt ||
      'Read this article on CPTSD healing and recovery.',
    keywords: blog.tags || ['CPTSD', 'Complex PTSD', 'trauma healing', 'recovery'],
    authors: [{ name: 'CPTSD Healing Blog' }],
    openGraph: {
      title: blog.seoTitle || blog.title,
      description: blog.seoDescription || blog.excerpt || '',
      type: 'article',
      url,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
      publishedTime: blog.publishedAt?.toString(),
      modifiedTime: blog.updatedAt?.toString(),
      authors: ['CPTSD Healing Blog'],
      tags: blog.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.seoTitle || blog.title,
      description: blog.seoDescription || blog.excerpt || '',
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  const [relatedBlogs, topics, recentBlogs] = await Promise.all([
    getRelatedBlogs(blog.id, blog.topic?.id, blog.tags, 5),
    getAllTopics(),
    getPublishedBlogs({ limit: 5 }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cptsd-blog.com';
  const url = `${siteUrl}/blog/${slug}`;

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.excerpt || blog.seoDescription,
    image: blog.featuredImage,
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'CPTSD Healing Blog',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CPTSD Healing Blog',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: blog.tags?.join(', '),
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
                    placeholder="Search articles..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b8a9f] focus:border-transparent bg-white text-sm"
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
              <Link
                href="/"
                className="text-gray-600 hover:text-[#5b8a9f] font-medium text-sm transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                All Posts
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Layout Container */}
        <div className="flex-1 flex max-w-7xl mx-auto w-full">
          {/* Left Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0 bg-white border-r border-gray-200">
            <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="p-6 space-y-8">
                {/* Topics Section */}
                <section>
                  <h3 className="text-xs font-bold text-[#5b8a9f] mb-4 uppercase tracking-wider">
                    TOPICS
                  </h3>
                  <nav className="space-y-1">
                    <Link
                      href="/"
                      className="block px-3 py-2 text-sm text-gray-700 hover:text-[#5b8a9f] hover:bg-gray-50 rounded-lg transition-colors font-medium"
                    >
                      All Topics
                    </Link>
                    {topics.map((topic) => (
                      <Link
                        key={topic.id}
                        href={`/?topic=${topic.id}`}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                          blog.topic?.id === topic.id
                            ? 'text-[#5b8a9f] bg-[#9fb3a7]/20 font-semibold'
                            : 'text-gray-700 hover:text-[#5b8a9f] hover:bg-gray-50'
                        }`}
                      >
                        {topic.name}
                      </Link>
                    ))}
                  </nav>
                </section>

                {/* Recent Posts Section */}
                <section className="pt-6 border-t border-gray-200">
                  <h3 className="text-xs font-bold text-[#5b8a9f] mb-4 uppercase tracking-wider">
                    RECENT POSTS
                  </h3>
                  <div className="space-y-4">
                    {recentBlogs.blogs.slice(0, 5).map((recentBlog) => (
                      <Link
                        key={recentBlog.id}
                        href={`/blog/${recentBlog.slug}`}
                        className="block group p-2 -m-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-[#5b8a9f] transition-colors line-clamp-2 mb-1">
                          {recentBlog.title}
                        </h4>
                        {recentBlog.publishedAt && (
                          <time className="text-xs text-gray-500">
                            {new Date(recentBlog.publishedAt).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </time>
                        )}
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
              {/* Breadcrumb */}
              <nav className="mb-8 text-sm text-gray-600 flex items-center space-x-2">
                <Link
                  href="/"
                  className="hover:text-[#5b8a9f] transition-colors"
                >
                  Home
                </Link>
                <span className="text-gray-400">/</span>
                {blog.topic && (
                  <>
                    <Link
                      href={`/?topic=${blog.topic.id}`}
                      className="hover:text-[#5b8a9f] transition-colors"
                    >
                      {blog.topic.name}
                    </Link>
                    <span className="text-gray-400">/</span>
                  </>
                )}
                <span className="text-gray-900 font-medium truncate">
                  {blog.title}
                </span>
              </nav>

              {/* Article Card */}
              <article className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden mb-12">
                {/* Article Header */}
                <header className="px-6 lg:px-12 pt-8 lg:pt-12 pb-6">
                  {blog.topic && (
                    <Link
                      href={`/?topic=${blog.topic.id}`}
                      className="inline-block px-4 py-1.5 bg-[#9fb3a7]/20 text-[#5b8a9f] rounded-full font-semibold hover:bg-[#9fb3a7]/30 transition-colors text-sm mb-6"
                    >
                      {blog.topic.name}
                    </Link>
                  )}
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                    {blog.title}
                  </h1>
                  {blog.excerpt && (
                    <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6 italic border-l-4 border-[#9fb3a7] pl-4 py-2">
                      {blog.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#5b8a9f]/10 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-[#5b8a9f]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <span className="font-medium">CPTSD Healing Blog</span>
                    </div>
                    {blog.publishedAt && (
                      <time
                        dateTime={blog.publishedAt.toString()}
                        className="flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    )}
                    {blog.readingTime && (
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {blog.readingTime} min read
                      </span>
                    )}
                  </div>
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {blog.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full border border-gray-200 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </header>

                {/* Featured Image */}
                {blog.featuredImage && (
                  <div className="w-full overflow-hidden bg-gradient-to-br from-[#9fb3a7]/10 to-[#c9a788]/10">
                    <img
                      src={blog.featuredImage}
                      alt={blog.title}
                      className="w-full h-auto max-h-[600px] object-cover"
                      loading="eager"
                    />
                  </div>
                )}

                {/* Article Content */}
                <div className="px-6 lg:px-12 py-8 lg:py-12">
                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown
                      components={{
                        // Override paragraph to handle images properly
                        p: ({ children, ...props }) => {
                          // Check if paragraph only contains an image (and possibly text nodes)
                          const childrenArray = React.Children.toArray(children);
                          // Check if all children are either images or empty text nodes
                          const hasOnlyImage = childrenArray.every((child) => {
                            if (typeof child === 'string') {
                              return child.trim() === '';
                            }
                            if (React.isValidElement(child)) {
                              const element = child as React.ReactElement;
                              return element.type === 'img';
                            }
                            return false;
                          }) && childrenArray.some((child) => {
                            if (React.isValidElement(child)) {
                              const element = child as React.ReactElement;
                              return element.type === 'img';
                            }
                            return false;
                          });
                          
                          if (hasOnlyImage) {
                            // Render as div for image containers to avoid nesting issues
                            return <div className="my-8" {...props}>{children}</div>;
                          }
                          // Regular paragraph
                          return <p {...props}>{children}</p>;
                        },
                        img: ({ alt, ...props }) => {
                          // Return just the image - the paragraph wrapper will be converted to div
                          return (
                            <img
                              {...props}
                              alt={alt || blog.title}
                              className="w-full h-auto rounded-lg shadow-lg mx-auto block"
                              style={{ maxWidth: 'min(100%, 800px)' }}
                              loading="lazy"
                            />
                          );
                        },
                      }}
                    >
                      {blog.content}
                    </ReactMarkdown>
                  </div>

                  {/* Social Sharing */}
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Share this article
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(url)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-[#1da1f2] text-white rounded-lg hover:bg-[#1a91da] transition-colors text-sm font-semibold shadow-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                        Twitter
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-[#1877f2] text-white rounded-lg hover:bg-[#166fe5] transition-colors text-sm font-semibold shadow-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                      </a>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-[#0077b5] text-white rounded-lg hover:bg-[#006399] transition-colors text-sm font-semibold shadow-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-80 flex-shrink-0 bg-white border-l border-gray-200">
            <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="p-6 space-y-8">
                {/* Related Posts */}
                {relatedBlogs.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-[#5b8a9f] mb-4 uppercase tracking-wider">
                      RELATED ARTICLES
                    </h3>
                    <div className="space-y-4">
                      {relatedBlogs.slice(0, 5).map((relatedBlog) => (
                        <Link
                          key={relatedBlog.id}
                          href={`/blog/${relatedBlog.slug}`}
                          className="block group p-3 -m-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {relatedBlog.featuredImage && (
                            <div className="w-full h-32 overflow-hidden rounded-lg mb-3 bg-gradient-to-br from-[#9fb3a7]/20 to-[#c9a788]/20">
                              <img
                                src={relatedBlog.featuredImage}
                                alt={relatedBlog.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#5b8a9f] transition-colors line-clamp-2 mb-2">
                            {relatedBlog.title}
                          </h4>
                          {relatedBlog.publishedAt && (
                            <time className="text-xs text-gray-500">
                              {new Date(relatedBlog.publishedAt).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )}
                            </time>
                          )}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Tags Section */}
                {blog.tags && blog.tags.length > 0 && (
                  <section className="pt-6 border-t border-gray-200">
                    <h3 className="text-xs font-bold text-[#5b8a9f] mb-4 uppercase tracking-wider">
                      TAGS
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full border border-gray-200 font-medium hover:border-[#5b8a9f] hover:text-[#5b8a9f] transition-colors cursor-default"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </aside>
        </div>

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
                &copy; {new Date().getFullYear()} CPTSD Healing Blog. All rights
                reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
