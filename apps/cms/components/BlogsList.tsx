import Link from 'next/link';

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  featuredImage: string | null;
  readingTime: number | null;
  publishedAt: Date | null;
  createdAt: Date;
  topic: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type BlogsListProps = {
  blogs: Blog[];
};

export default function BlogsList({ blogs }: BlogsListProps) {
  if (blogs.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No blog posts found. Create your first blog post to get started.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'GENERATING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card">
      <div className="grid grid-cols-1 gap-4">
        {blogs.map((blog) => (
          <Link
            key={blog.id}
            href={`/blogs/${blog.id}`}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start space-x-4">
              {blog.featuredImage && (
                <div className="flex-shrink-0">
                  <img
                    src={blog.featuredImage}
                    alt={blog.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(blog.status)}`}>
                    {blog.status}
                  </span>
                  {blog.topic && (
                    <span className="text-sm text-gray-500">{blog.topic.name}</span>
                  )}
                  {blog.readingTime && (
                    <span className="text-xs text-gray-400">{blog.readingTime} min read</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{blog.title}</h3>
                {blog.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{blog.excerpt}</p>
                )}
                <p className="text-xs text-gray-500">
                  {blog.publishedAt
                    ? `Published ${new Date(blog.publishedAt).toLocaleDateString()}`
                    : `Created ${new Date(blog.createdAt).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

