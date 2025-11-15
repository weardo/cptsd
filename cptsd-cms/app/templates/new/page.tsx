import { getTemplates } from '@/app/actions/templates';
import { createTemplate } from '@/app/actions/templates';

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TemplateForm from '@/components/TemplateForm';

export default async function NewTemplatePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <a href="/templates" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
            ← Back to Templates
          </a>
          <h1 className="text-3xl font-bold text-gray-900">New Template</h1>
          <p className="text-gray-600 mt-2">
            Create a new prompt template for generating content ideas
          </p>
        </div>

        <TemplateForm />
      </div>
    </div>
  );
}


