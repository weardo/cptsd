import { getBlogs, getTopics } from '@/app/actions';
import Navbar from '@/components/Navbar';
import BlogsList from '@/components/BlogsList';
import Filters from '@/components/Filters';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const [blogsResult, topicsResult] = await Promise.all([
    getBlogs({
      topicId: params.topic,
      status: params.status,
      search: params.search,
    }),
    getTopics(),
  ]);

  const blogs = blogsResult.blogs || [];
  const topics = topicsResult.topics || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
          <a href="/blogs/new" className="btn btn-primary">
            New Blog Post
          </a>
        </div>

        <Filters topics={topics} initialFilters={params} />

        <BlogsList blogs={blogs} />
      </div>
    </div>
  );
}

