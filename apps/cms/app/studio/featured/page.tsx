import Link from 'next/link';
import { getFeaturedItems } from '@/app/actions/featured';

export const dynamic = 'force-dynamic';

type FeaturedSearchParams = { kind?: string; status?: string; q?: string };

export default async function FeaturedListPage(props: { searchParams: Promise<FeaturedSearchParams> }) {
  const sp = await props.searchParams;
  const { success, items } = await getFeaturedItems({
    kind: sp.kind,
    status: (sp.status as any) || undefined,
    search: sp.q,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Featured content & highlights</h1>
          <Link href="/studio/featured/new" className="btn btn-primary">
            Add featured item
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-12 gap-3 mb-4">
          <form className="col-span-12 md:col-span-6">
            <input
              name="q"
              defaultValue={sp.q || ''}
              placeholder="Search title/description/tags/creator"
              className="input w-full"
            />
          </form>
          <form className="col-span-6 md:col-span-3">
            <select name="kind" defaultValue={sp.kind || ''} className="input w-full">
              <option value="">All kinds</option>
              {['EXTERNAL_LINK','INTERNAL_ARTICLE','INTERNAL_RESOURCE','ARTWORK','BOOK','COPING_TOOL','RESEARCH','OTHER'].map(k => (
                <option key={k} value={k}>{k.replace(/_/g,' ')}</option>
              ))}
            </select>
          </form>
          <form className="col-span-6 md:col-span-3">
            <select name="status" defaultValue={sp.status || ''} className="input w-full">
              <option value="">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </form>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Kind</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Featured</th>
                <th className="py-2 pr-4">Creator</th>
                <th className="py-2 pr-4">Clicks</th>
                <th className="py-2 pr-4">Updated</th>
              </tr>
            </thead>
            <tbody>
              {success && items.length > 0 ? (
                items.map((it: any) => (
                  <tr key={it.id} className="border-t">
                    <td className="py-2 pr-4">
                      <Link href={`/studio/featured/${it.id}`} className="text-blue-600 hover:text-blue-700">
                        {it.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{it.kind.replace(/_/g,' ')}</td>
                    <td className="py-2 pr-4">{it.status}</td>
                    <td className="py-2 pr-4">{it.isFeatured ? 'Yes' : 'No'}</td>
                    <td className="py-2 pr-4">{it.creatorName || '-'}</td>
                    <td className="py-2 pr-4">{it.clickCount ?? 0}</td>
                    <td className="py-2 pr-4">{new Date(it.updatedAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-6 text-gray-600" colSpan={7}>No items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
}


