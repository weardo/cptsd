import { createTopic } from '@/app/actions/topics';
import Navbar from '@/components/Navbar';
import TopicForm from '@/components/TopicForm';

export default function NewTopicPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">New Topic</h1>
        <TopicForm action={createTopic} />
      </div>
    </div>
  );
}

