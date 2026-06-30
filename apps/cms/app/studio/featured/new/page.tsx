import FeaturedContentForm from '@/components/FeaturedContentForm';

export const dynamic = 'force-dynamic';

export default function NewFeaturedPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add featured item</h1>
      <FeaturedContentForm />
    </div>
  );
}


