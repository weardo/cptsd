import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Metadata } from 'next';
import React from 'react';
import { getBlogBySlug } from '@/lib/dataActions';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

interface LearnArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: LearnArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return {
      title: 'Article Not Found',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cptsd.in';
  const url = `${siteUrl}/learn/${slug}`;
  const imageUrl = blog.featuredImage || `${siteUrl}/og-image.jpg`;

  return {
    title: blog.seoTitle || blog.title,
    description:
      blog.seoDescription ||
      blog.excerpt ||
      'Learn about CPTSD healing and recovery.',
    keywords: blog.tags || ['CPTSD', 'Complex PTSD', 'trauma healing', 'recovery'],
    authors: [{ name: 'CPTSD.in' }],
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
      authors: ['CPTSD.in'],
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

export default async function LearnArticlePage({ params }: LearnArticlePageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    console.log(`[Learn Route] Blog not found for slug: ${slug}`);
    notFound();
  }

  // Only show learn resources on this route
  if (!blog.isLearnResource) {
    console.log(`[Learn Route] Blog found but not marked as learn resource. Slug: ${slug}, isLearnResource: ${blog.isLearnResource}`);
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cptsd.in';
  const url = `${siteUrl}/learn/${slug}`;

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.excerpt || blog.seoDescription,
    image: blog.featuredImage,
    datePublished: blog.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'CPTSD.in',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CPTSD.in',
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-gray-600 flex items-center space-x-2">
          <Link
            href="/"
            className="hover:text-blue-600 transition-colors"
          >
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href="/learn"
            className="hover:text-blue-600 transition-colors"
          >
            Learn
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium truncate">
            {blog.title}
          </span>
        </nav>

        {/* Article Card */}
        <article className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden mb-12">
          {/* Article Header */}
          <header className="px-6 lg:px-12 pt-8 lg:pt-12 pb-6">
            {blog.category && (
              <span className="inline-block px-4 py-1.5 bg-[#9fb3a7]/20 text-[#5b8a9f] rounded-full font-semibold hover:bg-[#9fb3a7]/30 transition-colors text-sm mb-6">
                {blog.category}
              </span>
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
                <span className="font-medium">CPTSD.in</span>
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
                  {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
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

            {/* Tags at Bottom */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full border border-gray-200 font-medium hover:border-[#5b8a9f] hover:text-[#5b8a9f] hover:bg-[#5b8a9f]/10 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Back to Learn */}
        <div className="text-center">
          <Link
            href="/learn"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Learn
          </Link>
        </div>
      </div>
    </>
  );
}

