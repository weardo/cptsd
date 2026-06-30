import { getSupportiveMessageById } from '@/app/actions/supportiveMessages';
import SupportiveMessageForm from '@/components/SupportiveMessageForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditSupportiveMessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const message = await getSupportiveMessageById(id);

  if (!message) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Supportive Message</h1>
        <SupportiveMessageForm message={message} />
      </div>
    </div>
  );
}

