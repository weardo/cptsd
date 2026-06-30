import { getStoryById, updateStory, approveStory, rejectStory } from '@/app/actions/stories';

import StoryDetailForm from '@/components/StoryDetailForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const storyResult = await getStoryById(id);

  if (!storyResult.success || !storyResult.story) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StoryDetailForm story={storyResult.story} />
      </div>
    </div>
  );
}

