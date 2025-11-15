import { getBlogBySlug, getRelatedBlogs, getAllTopics } from '@/lib/blogActions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export const dynamic = 'force-dynamic';

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  const [relatedBlogs, topics] = await Promise.all([
    getRelatedBlogs(blog.id, blog.topic?.id, blog.tags),
    getAllTopics(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            CPTSD Blog
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              {blog.topic && (
                <Link
                  href={`/?topic=${blog.topic.id}`}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {blog.topic.name}
                </Link>
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
              {blog.readingTime && <span>• {blog.readingTime} min read</span>}
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>

            {blog.excerpt && (
              <p className="text-xl text-gray-600 mb-4">{blog.excerpt}</p>
            )}

            {blog.featuredImage && (
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="w-full h-96 object-cover rounded-lg mb-6"
              />
            )}

            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown>{blog.content}</ReactMarkdown>
          </div>

          {/* Images */}
          {blog.images && blog.images.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {blog.images.map((image: { url: string; alt?: string }, idx: number) => (
                <div key={idx} className="relative">
                  <img
                    src={image.url}
                    alt={image.alt || blog.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  {image.alt && (
                    <p className="text-sm text-gray-500 mt-2 text-center">{image.alt}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </article>

        {/* Related Blogs */}
        {relatedBlogs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog.id}
                  href={`/blog/${relatedBlog.slug}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {relatedBlog.title}
                  </h3>
                  {relatedBlog.excerpt && (
                    <p className="text-gray-600 text-sm">{relatedBlog.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to all posts
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} CPTSD Blog. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

