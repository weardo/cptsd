import Link from 'next/link';

interface Blog {
  id: string;
  slug: string;
  title: string;
  publishedAt?: Date;
  featuredImage?: string;
}

interface RelatedPostsSidebarProps {
  relatedBlogs: Blog[];
  tags?: string[];
}

export default function RelatedPostsSidebar({ relatedBlogs, tags }: RelatedPostsSidebarProps) {
  return (
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
                {relatedBlogs.slice(0, 5).map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/blog/${blog.slug}`}
                    className="block group p-3 -m-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {blog.featuredImage && (
                      <div className="w-full h-32 overflow-hidden rounded-lg mb-3 bg-gradient-to-br from-[#9fb3a7]/20 to-[#c9a788]/20">
                        <img
                          src={blog.featuredImage}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#5b8a9f] transition-colors line-clamp-2 mb-2">
                      {blog.title}
                    </h4>
                    {blog.publishedAt && (
                      <time className="text-xs text-gray-500">
                        {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Tags Section */}
          {tags && tags.length > 0 && (
            <section className="pt-6 border-t border-gray-200">
              <h3 className="text-xs font-bold text-[#5b8a9f] mb-4 uppercase tracking-wider">
                TAGS
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
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
  );
}

