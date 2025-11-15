import { getResources, seedInitialResources } from '@/app/actions/resources';
import ResourcesList from '@/components/ResourcesList';
import Filters from '@/components/Filters';
import { revalidatePath } from 'next/cache';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

async function seedResourcesAction(formData: FormData) {
  'use server';
  await seedInitialResources();
  revalidatePath('/resources');
}

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
          <div className="flex space-x-3">
            <form action={seedResourcesAction}>
              <button type="submit" className="btn btn-secondary">
                Seed Initial Resources
              </button>
            </form>
            <a href="/resources/new" className="btn btn-primary">
              New Resource
            </a>
          </div>
        </div>

        <ResourcesList resources={resources} initialFilters={params} />

        {resources.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No resources found.</p>
            <p className="text-sm text-gray-400 mb-6">
              You can seed initial resources (helplines, therapy directories, educational sites) or create your own.
            </p>
            <form action={seedResourcesAction}>
              <button type="submit" className="btn btn-primary">
                Seed Initial Resources
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

