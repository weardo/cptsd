import { getIdeas } from '@/app/actions/ideas';
import { getTopics } from '@/app/actions/topics';

import IdeasBoard from '@/components/ideas/IdeasBoard';
import Link from 'next/link';
import { Suspense } from 'react';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

export default async function IdeasPage() {
  const [ideasResult, topicsResult] = await Promise.all([getIdeas(), getTopics()]);

  const ideas = ideasResult.success ? ideasResult.ideas : [];
  const topics = topicsResult.success ? topicsResult.topics : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Idea Board</h1>
          <div className="flex space-x-3">
            <Link href="/ideas/new" className="btn btn-primary">
              New Idea
            </Link>
            <Link href="/ideas/generate" className="btn btn-secondary">
              Generate Ideas with AI
            </Link>
          </div>
        </div>

        <Suspense fallback={<div>Loading ideas...</div>}>
          <IdeasBoard ideas={ideas} topics={topics} />
        </Suspense>
      </div>
    </div>
  );
}

