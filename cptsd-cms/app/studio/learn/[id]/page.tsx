import { getLearnSection, deleteLearnSection } from '@/app/actions/learn';
import LearnSectionForm from '@/components/LearnSectionForm';
import LearnItemManager from '@/components/LearnItemManager';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EditLearnSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { success, section } = await getLearnSection(id);

  if (!success || !section) {
    redirect('/studio/learn');
  }

  async function onDelete(formData: FormData) {
    'use server';
    const sectionId = formData.get('id') as string;
    const res = await deleteLearnSection(sectionId);
    revalidatePath('/studio/learn');
    redirect('/studio/learn');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/studio/learn" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
                ← Back to Learn Sections
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Edit Learn Section</h1>
            </div>
            <form action={onDelete}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="btn btn-danger">
                Delete Section
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <LearnSectionForm initial={section} />
              <LearnItemManager sectionId={id} items={section.items} />
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Section Info</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p
                      className={`font-medium ${
                        section.status === 'PUBLISHED' ? 'text-green-600' : 'text-gray-600'
                      }`}
                    >
                      {section.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Order</p>
                    <p className="font-medium text-gray-900">{section.order}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Items Count</p>
                    <p className="font-medium text-gray-900">{section.items.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="text-gray-900">
                      {new Date(section.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Updated</p>
                    <p className="text-gray-900">
                      {new Date(section.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
                <p className="text-sm text-gray-600 mb-2">
                  This section will appear on the Learn page at:
                </p>
                <a
                  href="https://cptsd.in/learn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  cptsd.in/learn
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


