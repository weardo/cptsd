import { getPost, updatePost, generateContentWithN8n, updatePostStatus } from '@/app/actions/posts';
import { getTopics } from '@/app/actions/topics';
import { getPostAssets } from '@/app/actions/assets';
import { getSettings } from '@/app/actions/settings';
import { getAvailableModels } from '@/lib/settings';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PostDetail from '@/components/PostDetail';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [postResult, topicsResult, assetsResult, settingsResult] = await Promise.all([
    getPost(id),
    getTopics(),
    getPostAssets(id),
    getSettings(),
  ]);

  if (!postResult.success || !postResult.post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-red-600">Post not found</p>
        </div>
      </div>
    );
  }

  const topics = topicsResult.topics || [];
  const assets = assetsResult.success ? assetsResult.assets : [];
  const availableModels = getAvailableModels();
  const defaultModel = settingsResult.settings?.defaultModel || 'gpt-4o';

  async function handleGenerateContent(
    tone: 'educational' | 'validating' | 'gentle-cta',
    model?: string,
    systemPrompt?: string
  ) {
    'use server';
    const { id: postId } = await params;
    const result = await generateContentWithN8n(postId, tone, model, systemPrompt);
    if (result.success) {
      return result;
    }
    return result;
  }

  async function handleUpdateStatus(status: 'DRAFT' | 'GENERATED' | 'APPROVED' | 'POSTED') {
    'use server';
    const { id: postId } = await params;
    const result = await updatePostStatus(postId, status);
    if (result.success) {
      return result;
    }
    return result;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PostDetail
          post={postResult.post}
          topics={topics}
          assets={assets}
          availableModels={availableModels}
          defaultModel={defaultModel}
          onUpdate={updatePost.bind(null, id)}
          onGenerateContent={handleGenerateContent}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </div>
  );
}

