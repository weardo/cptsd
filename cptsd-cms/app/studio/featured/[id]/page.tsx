import { getFeaturedItem, deleteFeaturedItem } from '@/app/actions/featured';
import FeaturedContentForm from '@/components/FeaturedContentForm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditFeaturedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { success, item } = await getFeaturedItem(id);
  if (!success || !item) {
    redirect('/studio/featured');
  }

  async function onDelete(formData: FormData) {
    'use server';
    const itemId = formData.get('id') as string;
    const res = await deleteFeaturedItem(itemId);
    revalidatePath('/studio/featured');
    redirect('/studio/featured');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Edit featured item</h1>
            <form action={onDelete}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="btn btn-danger">Delete</button>
            </form>
          </div>
          
          <FeaturedContentForm initial={item as any} />
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{item.clickCount ?? 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="text-gray-900">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="text-gray-900">{new Date(item.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


