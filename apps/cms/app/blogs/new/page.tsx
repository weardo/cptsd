import { getTopics } from '@/app/actions/topics';
import { getBlogs } from '@/app/actions/blogs';

import BlogForm from '@/components/BlogForm';

export const dynamic = 'force-dynamic';

export default async function NewBlogPage() {
  const [topicsResult, blogsResult] = await Promise.all([
    getTopics(),
    getBlogs({ published: false }), // Get all blogs for related articles selection
  ]);
  const topics = topicsResult.topics || [];
  const blogs = (blogsResult.blogs || []).map(blog => ({
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">New Blog Post</h1>
        <BlogForm topics={topics} blogs={blogs} />
      </div>
    </div>
  );
}

