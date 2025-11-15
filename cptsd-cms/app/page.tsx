import { getPosts, getTopics } from '@/app/actions';
import Navbar from '@/components/Navbar';
import PostsList from '@/components/PostsList';
import Filters from '@/components/Filters';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; postType?: string; status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const [postsResult, topicsResult] = await Promise.all([
    getPosts({
      topicId: params.topic,
      postType: params.postType,
      status: params.status,
      search: params.search,
    }),
    getTopics(),
  ]);

  const posts = postsResult.posts || [];
  const topics = topicsResult.topics || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
          <a
            href="/posts/new"
            className="btn btn-primary"
          >
            New Post
          </a>
        </div>

        <Filters topics={topics} initialFilters={params} />

        <PostsList posts={posts} />
      </div>
    </div>
  );
}
