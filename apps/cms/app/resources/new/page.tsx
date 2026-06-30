
import ResourceForm from '@/components/ResourceForm';

export default async function NewResourcePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">New Resource</h1>
        <ResourceForm />
      </div>
    </div>
  );
}

