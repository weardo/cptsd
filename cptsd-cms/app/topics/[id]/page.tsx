import { getTopic, updateTopic, deleteTopic } from '@/app/actions/topics';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TopicForm from '@/components/TopicForm';
import DeleteButton from '@/components/DeleteButton';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getTopic(id);

  if (!result.success || !result.topic) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-red-600">Topic not found</p>
        </div>
      </div>
    );
  }

  async function handleDelete() {
    'use server';
    const { id: topicId } = await params;
    const result = await deleteTopic(topicId);
    if (result.success) {
      redirect('/topics');
    }
    return result;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Topic</h1>
          <DeleteButton
            onDelete={handleDelete}
            itemName={result.topic.name}
            hasDependencies={result.topic._count.posts > 0}
            dependencyCount={result.topic._count.posts}
            dependencyName="posts"
          />
        </div>
        <TopicForm
          action={updateTopic.bind(null, id)}
          topic={result.topic}
        />
      </div>
    </div>
  );
}

