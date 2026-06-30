'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettings } from '@/app/actions/settings';
import PasswordChangeForm from './PasswordChangeForm';
import UserManagement from './UserManagement';

type SettingsFormProps = {
  initialSettings: {
    defaultModel: string;
    systemPrompt: string;
  };
  availableModels: Array<{ value: string; label: string; cost: 'low' | 'medium' | 'high' }>;
};

export default function SettingsForm({ initialSettings, availableModels }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [defaultModel, setDefaultModel] = useState(initialSettings.defaultModel);
  const [systemPrompt, setSystemPrompt] = useState(initialSettings.systemPrompt);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateSettings(formData);

      if (result.success) {
        setSuccess(result.message || 'Settings updated successfully');
        router.refresh();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to update settings');
      }
    });
  };

  const getCostColor = (cost: 'low' | 'medium' | 'high') => {
    switch (cost) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          {success}
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">OpenAI Model Settings</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure the default OpenAI model used for content generation. This affects cost and quality.
        </p>

        <div>
          <label htmlFor="defaultModel" className="block text-sm font-medium mb-2">
            Default Model
          </label>
          <select
            id="defaultModel"
            name="defaultModel"
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="input"
          >
            {availableModels.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label} ({model.cost === 'low' ? '$' : model.cost === 'medium' ? '$$' : '$$$'})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Selected model: {availableModels.find((m) => m.value === defaultModel)?.label}
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">System Prompt</h2>
        <p className="text-sm text-gray-600 mb-4">
          Set the default system prompt used for content generation. This affects how AI interprets and generates content.
          <strong className="block mt-2 text-gray-700">
            Note: This does NOT affect the standalone media generation form.
          </strong>
        </p>

        <div>
          <label htmlFor="systemPrompt" className="block text-sm font-medium mb-2">
            System Prompt
          </label>
          <textarea
            id="systemPrompt"
            name="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={8}
            className="input"
            placeholder="Enter system prompt..."
          />
          <p className="text-xs text-gray-500 mt-2">
            This prompt defines the AI's role and behavior for content generation.
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Model Cost Reference</h2>
        <div className="space-y-2">
          {availableModels.map((model) => (
            <div
              key={model.value}
              className={`p-3 rounded border ${
                model.value === defaultModel ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{model.label}</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${getCostColor(model.cost)}`}>
                    {model.cost === 'low' ? 'Low Cost' : model.cost === 'medium' ? 'Medium Cost' : 'High Cost'}
                  </span>
                </div>
                <code className="text-sm text-gray-600">{model.value}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary"
          disabled={isPending}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>

    <div className="mt-8 space-y-6">
      <PasswordChangeForm />
      <UserManagement />
    </div>
    </div>
  );
}

