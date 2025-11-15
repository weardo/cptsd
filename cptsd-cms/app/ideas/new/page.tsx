import { getTopics } from '@/app/actions/topics';
import { getTemplates } from '@/app/actions/templates';
import Navbar from '@/components/Navbar';
import IdeaForm from '@/components/ideas/IdeaForm';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function NewIdeaPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  const [topicsResult, templatesResult] = await Promise.all([
    getTopics(),
    getTemplates(true), // Active templates only
  ]);

  const topics = topicsResult.success ? topicsResult.topics : [];
  const templates = templatesResult.success ? templatesResult.templates : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">New Idea</h1>
          <p className="text-gray-600 mt-2">
            Create a new content idea for your CPTSD awareness posts
          </p>
        </div>

        <IdeaForm topics={topics} templates={templates} />
      </div>
    </div>
  );
}

