import { getSettings } from '@/app/actions/settings';
import { getAvailableModels } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import SettingsForm from '@/components/SettingsForm';

export default async function SettingsPage() {
  const result = await getSettings();
  const settings = result.settings;
  const availableModels = getAvailableModels();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <SettingsForm initialSettings={settings} availableModels={availableModels} />
      </div>
    </div>
  );
}

