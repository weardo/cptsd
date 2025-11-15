import { getIdea, deleteIdea } from '@/app/actions/ideas';
import { getTopics } from '@/app/actions/topics';
import { convertIdeaToPost } from '@/app/actions/ideas';
import Navbar from '@/components/Navbar';
import IdeaDetail from '@/components/ideas/IdeaDetail';
import DeleteButton from '@/components/DeleteButton';
import { redirect } from 'next/navigation';

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ideaResult, topicsResult] = await Promise.all([
    getIdea(id),
    getTopics(),
  ]);

  if (!ideaResult.success || !ideaResult.idea) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-red-600">Idea not found</p>
        </div>
      </div>
    );
  }

  const topics = topicsResult.topics || [];

  async function handleConvertToPost() {
    'use server';
    const { id: ideaId } = await params;
    const result = await convertIdeaToPost(ideaId);
    if (result.success && result.post) {
      redirect(`/posts/${result.post.id}`);
    }
    return result;
  }

  async function handleDelete() {
    'use server';
    const { id: ideaId } = await params;
    const result = await deleteIdea(ideaId);
    if (result.success) {
      redirect('/ideas');
    }
    return result;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Idea Details</h1>
          <DeleteButton
            onDelete={handleDelete}
            itemName={ideaResult.idea.intent || 'idea'}
            hasDependencies={!!ideaResult.idea.linkedPostId}
            dependencyCount={ideaResult.idea.linkedPostId ? 1 : 0}
            dependencyName="linked post"
          />
        </div>
        <IdeaDetail
          idea={ideaResult.idea}
          topics={topics}
          onUpdate={updateIdea.bind(null, id)}
          onConvertToPost={handleConvertToPost}
        />
      </div>
    </div>
  );
}

async function updateIdea(ideaId: string, formData: FormData) {
  'use server';
  const { updateIdea } = await import('@/app/actions/ideas');
  return updateIdea(ideaId, formData);
}

