import { getMentalHealthProfessional } from '@/app/actions/mental-health-professionals';
import MentalHealthProfessionalDetail from '@/components/MentalHealthProfessionalDetail';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

export default async function MentalHealthProfessionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const professionalResult = await getMentalHealthProfessional(id);

  if (!professionalResult.success || !professionalResult.professional) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <p className="text-red-600">
              {professionalResult.error || 'Mental health professional not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MentalHealthProfessionalDetail professional={professionalResult.professional} />
      </div>
    </div>
  );
}

