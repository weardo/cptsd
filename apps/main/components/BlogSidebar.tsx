import Link from 'next/link';

interface Topic {
  id: string;
  name: string;
}

interface Blog {
  id: string;
  slug: string;
  title: string;
  publishedAt?: Date;
  featuredImage?: string;
}

interface BlogSidebarProps {
  topics: Topic[];
  recentBlogs: Blog[];
  currentTopicId?: string;
}

export default function BlogSidebar({ topics, recentBlogs, currentTopicId }: BlogSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0 bg-surface-container-low">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Topics Section */}
          <section>
            <h3 className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">
              TOPICS
            </h3>
            <nav className="space-y-1">
              <Link
                href="/blog"
                className="block px-3 py-2 text-sm text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg transition-colors font-medium no-underline"
              >
                All Topics
              </Link>
              {topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/blog?topic=${topic.id}`}
                  className={`block px-3 py-2 text-sm rounded-lg transition-colors no-underline ${
                    currentTopicId === topic.id
                      ? 'text-primary bg-surface-variant font-semibold'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant'
                  }`}
                >
                  {topic.name}
                </Link>
              ))}
            </nav>
          </section>

          {/* Recent Posts Section */}
          {recentBlogs.length > 0 && (
            <section className="pt-6">
              <h3 className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">
                RECENT POSTS
              </h3>
              <div className="space-y-6">
                {recentBlogs.slice(0, 5).map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/blog/${blog.slug}`}
                    className="block group p-2 -m-2 rounded-lg hover:bg-surface-variant transition-colors no-underline"
                  >
                    <h4 className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {blog.title}
                    </h4>
                    {blog.publishedAt && (
                      <time className="text-xs text-on-surface-variant">
                        {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                    )}
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
