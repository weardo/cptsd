import { getTopics } from '@/app/actions/topics';

import PostForm from '@/components/PostForm';

export default async function NewPostPage() {
  const topicsResult = await getTopics();
  const topics = topicsResult.topics || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">New Post</h1>
        <PostForm topics={topics} />
      </div>
    </div>
  );
}

