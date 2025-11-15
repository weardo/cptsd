import { getBlog, getTopics } from '@/app/actions';

import BlogDetail from '@/components/BlogDetail';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [blogResult, topicsResult] = await Promise.all([
    getBlog(id),
    getTopics(),
  ]);

  if (!blogResult.success || !blogResult.blog) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <p className="text-red-600">
              {blogResult.error || 'Blog post not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const topics = topicsResult.topics || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BlogDetail blog={blogResult.blog} topics={topics} />
      </div>
    </div>
  );
}

