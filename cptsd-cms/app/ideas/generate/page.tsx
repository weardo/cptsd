import { getTopics } from '@/app/actions/topics';
import { getTemplates } from '@/app/actions/templates';
import { getSettings } from '@/app/actions/settings';
import { getAvailableModels } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import GenerateIdeasForm from '@/components/ideas/GenerateIdeasForm';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function GenerateIdeasPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  const [topicsResult, templatesResult, settingsResult] = await Promise.all([
    getTopics(),
    getTemplates(true), // Active templates only
    getSettings(),
  ]);

  const topics = topicsResult.success ? topicsResult.topics : [];
  const templates = templatesResult.success ? templatesResult.templates : [];
  const availableModels = getAvailableModels();
  const defaultModel = settingsResult.settings?.defaultModel || 'gpt-4o';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Generate Ideas with AI</h1>
          <p className="text-gray-600 mt-2">
            Use AI to generate content ideas for your CPTSD awareness posts
          </p>
        </div>

        <GenerateIdeasForm 
          topics={topics} 
          templates={templates} 
          availableModels={availableModels}
          defaultModel={defaultModel}
        />
      </div>
    </div>
  );
}

