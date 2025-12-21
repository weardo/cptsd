import { getMentalHealthProfessionals } from '@/app/actions/mental-health-professionals';
import MentalHealthProfessionalsList from '@/components/MentalHealthProfessionalsList';
import { revalidatePath } from 'next/cache';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

export default async function MentalHealthProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    designation?: string;
    city?: string;
    state?: string;
    modeOfDelivery?: string;
    specialization?: string;
    language?: string;
    status?: string;
    featured?: string;
    verified?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const professionalsResult = await getMentalHealthProfessionals({
    type: params.type as any,
    designation: params.designation as any,
    city: params.city,
    state: params.state,
    modeOfDelivery: params.modeOfDelivery as any,
    specialization: params.specialization as any,
    language: params.language,
    status: params.status,
    featured: params.featured ? params.featured === 'true' : undefined,
    verified: params.verified ? params.verified === 'true' : undefined,
    search: params.search,
  });

  const professionals = professionalsResult.professionals || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mental Health Professionals Directory</h1>
          <a href="/mental-health-professionals/new" className="btn btn-primary">
            New Professional
          </a>
        </div>

        <MentalHealthProfessionalsList professionals={professionals} initialFilters={params} />

        {professionals.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No professionals found.</p>
            <p className="text-sm text-gray-400 mb-6">
              Create a new mental health professional or organization entry.
            </p>
            <a href="/mental-health-professionals/new" className="btn btn-primary">
              New Professional
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

