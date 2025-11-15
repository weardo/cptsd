import { getTopics } from '@/app/actions/topics';
import Navbar from '@/components/Navbar';
import BlogForm from '@/components/BlogForm';

export default async function NewBlogPage() {
  const topicsResult = await getTopics();
  const topics = topicsResult.topics || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">New Blog Post</h1>
        <BlogForm topics={topics} />
      </div>
    </div>
  );
}

