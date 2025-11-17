import Link from 'next/link';
import { getLearnSections } from '@/app/actions/learn';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function LearnSectionsPage() {
  const result = await getLearnSections();
  const sections = result.success ? result.sections : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learn Page Sections</h1>
            <p className="text-gray-600 mt-2">
              Manage sections and items displayed on the Learn page (cptsd.in/learn)
            </p>
          </div>
          <Link href="/studio/learn/new" className="btn btn-primary">
            New Section
          </Link>
        </div>

        {sections.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-600 mb-4">No sections yet. Create your first section to get started.</p>
            <Link href="/studio/learn/new" className="btn btn-primary">
              Create First Section
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          section.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {section.status}
                      </span>
                      <span className="text-sm text-gray-500">Order: {section.order}</span>
                    </div>
                    {section.description && (
                      <p className="text-gray-600 text-sm mb-2">{section.description}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {section.items.length} item{section.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/studio/learn/${section.id}`}
                      className="btn btn-secondary text-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
                {section.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Items:</h3>
                    <ul className="space-y-1">
                      {section.items
                        .sort((a, b) => a.order - b.order)
                        .map((item) => (
                          <li key={item.id} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="font-medium">{item.title}</span>
                            <span className="text-xs text-gray-400">
                              ({item.type === 'ARTICLE' ? 'Article' : 'External Link'})
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


