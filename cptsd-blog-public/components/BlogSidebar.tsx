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
                    currentTopicId === topic.id
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
          {recentBlogs.length > 0 && (
            <section className="pt-6 border-t border-gray-200">
              <h3 className="text-xs font-bold text-[#5b8a9f] mb-4 uppercase tracking-wider">
                RECENT POSTS
              </h3>
              <div className="space-y-4">
                {recentBlogs.slice(0, 5).map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/blog/${blog.slug}`}
                    className="block group p-2 -m-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-[#5b8a9f] transition-colors line-clamp-2 mb-1">
                      {blog.title}
                    </h4>
                    {blog.publishedAt && (
                      <time className="text-xs text-gray-500">
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

