import { getTemplates, seedDefaultTemplates } from '@/app/actions/templates';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

async function seedTemplatesAction(formData: FormData) {
  'use server';
  await seedDefaultTemplates();
  revalidatePath('/templates');
}

export default async function TemplatesPage() {
  const result = await getTemplates();

  const templates = result.success ? result.templates : [];

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Prompt Templates</h1>
          <div className="flex space-x-3">
            {templates.length === 0 && (
              <form action={seedTemplatesAction}>
                <button type="submit" className="btn btn-primary">
                  Seed Default Templates
                </button>
              </form>
            )}
            <a href="/templates/new" className="btn btn-primary">
              New Template
            </a>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No templates found.</p>
            <p className="text-sm text-gray-400 mb-6">
              You can seed default templates or create your own.
            </p>
            <form action={seedTemplatesAction}>
              <button type="submit" className="btn btn-primary">
                Seed Default Templates
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                  </div>
                  {!template.isActive && (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                      Inactive
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Suggested Post Types:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.suggestedPostTypes.map((type: string) => (
                        <span key={type} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Suggested Tones:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.suggestedTones.map((tone: string) => (
                        <span key={tone} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                          {tone}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}
                  </span>
                  <Link
                    href={`/templates/${template.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

