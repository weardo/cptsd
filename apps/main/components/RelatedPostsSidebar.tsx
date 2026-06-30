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
  manuallyRelatedBlogs?: Blog[];
  tags?: string[];
}

export default function RelatedPostsSidebar({ relatedBlogs, manuallyRelatedBlogs = [], tags }: RelatedPostsSidebarProps) {
  const renderBlogCard = (blog: Blog) => (
    <Link
      key={blog.id}
      href={`/blog/${blog.slug}`}
      className="block group p-3 -m-3 rounded-xl hover:bg-surface-variant transition-colors no-underline"
    >
      {blog.featuredImage && (
        <div className="w-full h-32 overflow-hidden rounded-lg mb-3 bg-surface-container-low">
          <img
            src={blog.featuredImage}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}
      <h4 className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-2 mb-2">
        {blog.title}
      </h4>
      {blog.publishedAt && (
        <time className="text-xs text-on-surface-variant">
          {new Date(blog.publishedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </time>
      )}
    </Link>
  );

  return (
    <aside className="hidden xl:block w-80 flex-shrink-0 bg-surface-container-low">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-6 space-y-8">
          {manuallyRelatedBlogs.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">
                RECOMMENDED ARTICLES
              </h3>
              <div className="space-y-6">
                {manuallyRelatedBlogs.slice(0, 5).map(renderBlogCard)}
              </div>
            </section>
          )}

          {relatedBlogs.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">
                {manuallyRelatedBlogs.length > 0 ? 'YOU MIGHT ALSO LIKE' : 'RELATED ARTICLES'}
              </h3>
              <div className="space-y-6">
                {relatedBlogs.slice(0, 5).map(renderBlogCard)}
              </div>
            </section>
          )}

          {tags && tags.length > 0 && (
            <section className="pt-6">
              <h3 className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">
                TAGS
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <Link
                    key={idx}
                    href={`/blog?search=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 text-xs bg-surface-container-lowest text-on-surface-variant rounded-full font-medium hover:text-primary hover:bg-surface-variant transition-colors no-underline"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </aside>
  );
}
