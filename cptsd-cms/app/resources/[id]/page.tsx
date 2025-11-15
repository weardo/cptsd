import { getResource } from '@/app/actions/resources';

import ResourceDetail from '@/components/ResourceDetail';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resourceResult = await getResource(id);

  if (!resourceResult.success || !resourceResult.resource) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <p className="text-red-600">
              {resourceResult.error || 'Resource not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResourceDetail resource={resourceResult.resource} />
      </div>
    </div>
  );
}

