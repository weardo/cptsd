import Navbar from '@/components/Navbar';
import StandaloneGenerator from '@/components/StandaloneGenerator';
import { getAvailableModels } from '@/lib/settings';
import { getStandaloneGenerations } from '@/app/actions/standalone';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

export default async function GeneratePage() {
  const availableModels = getAvailableModels();
  const generationsResult = await getStandaloneGenerations();
  const previousGenerations = generationsResult.success ? generationsResult.generations : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Standalone Media Generator</h1>
        <p className="text-gray-600 mb-6">
          Generate media and text content from a prompt with custom system prompts and attachments.
          This form uses its own system prompt and is not affected by global settings.
        </p>
        <StandaloneGenerator 
          availableModels={availableModels} 
          previousGenerations={previousGenerations}
        />
      </div>
    </div>
  );
}

