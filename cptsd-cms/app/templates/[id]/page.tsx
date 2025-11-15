import { getTemplate, deleteTemplate } from '@/app/actions/templates';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import DeleteButton from '@/components/DeleteButton';

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Redirect "new" to the create page (though we'll create it separately)
  if (id === 'new') {
    redirect('/templates/new');
  }
  
  const result = await getTemplate(id);

  if (!result.success || !result.template) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-red-600">Template not found</p>
        </div>
      </div>
    );
  }

  const template = result.template;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'awareness':
        return 'bg-blue-100 text-blue-800';
      case 'somatic':
        return 'bg-green-100 text-green-800';
      case 'validation':
        return 'bg-purple-100 text-purple-800';
      case 'journal':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <a href="/templates" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to Templates
          </a>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
              <span className={`inline-block mt-2 px-3 py-1 text-sm font-medium rounded ${getCategoryColor(template.category)}`}>
                {template.category}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {!template.isActive && (
                <span className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-600">
                  Inactive
                </span>
              )}
              <DeleteButton
                onDelete={async () => {
                  'use server';
                  return deleteTemplate(id);
                }}
                itemName={template.name}
                hasDependencies={false}
                redirectPath="/templates"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-gray-700">{template.description}</p>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Suggested Settings</h2>
            <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Post Types:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {template.suggestedPostTypes.map((type: string) => (
                        <span key={type} className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tones:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {template.suggestedTones.map((tone: string) => (
                        <span key={tone} className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded">
                          {tone}
                        </span>
                      ))}
                    </div>
                  </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">System Prompt</h2>
            <pre className="bg-gray-50 p-4 rounded border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
              {template.systemPrompt}
            </pre>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">User Prompt Template</h2>
            <pre className="bg-gray-50 p-4 rounded border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
              {template.userPromptTemplate}
            </pre>
            <p className="text-xs text-gray-500 mt-2">
              Variables: {'{topic}'}, {'{tone}'}, {'{postType}'}, {'{intent}'}, {'{count}'}
            </p>
          </div>

          {template.exampleOutput && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Example Output</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{template.exampleOutput}</p>
            </div>
          )}

          <div className="card">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-2">Usage Statistics</h2>
                <p className="text-sm text-gray-600">
                  This template has been used <span className="font-medium">{template.usageCount}</span> time{template.usageCount !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

