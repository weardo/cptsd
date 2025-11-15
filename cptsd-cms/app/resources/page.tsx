import { getResources } from '@/app/actions/resources';
import ResourcesList from '@/components/ResourcesList';
import Filters from '@/components/Filters';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; status?: string; search?: string; featured?: string }>;
}) {
  const params = await searchParams;
  const resourcesResult = await getResources({
    type: params.type as any,
    category: params.category as any,
    status: params.status,
    featured: params.featured === 'true',
    search: params.search,
  });

  const resources = resourcesResult.resources || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">CPTSD Resources</h1>
          <a href="/resources/new" className="btn btn-primary">
            New Resource
          </a>
        </div>

        <ResourcesList resources={resources} initialFilters={params} />

        {resources.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500">No resources found. Create your first resource to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

