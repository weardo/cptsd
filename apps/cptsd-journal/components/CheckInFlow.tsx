'use client';

import { useState } from 'react';
import { createLogger } from '@/lib/logger';

type CheckInStep = 'mood' | 'energy' | 'sleep' | 'stressor' | 'positive' | 'complete';

interface CheckInData {
  mood: number | null;
  energy: number | null;
  sleep: number | null;
  stressor: string;
  positive: string;
}

export default function CheckInFlow() {
  const [step, setStep] = useState<CheckInStep>('mood');
  const [data, setData] = useState<CheckInData>({
    mood: null,
    energy: null,
    sleep: null,
    stressor: '',
    positive: '',
  });
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const logger = createLogger();

  const handleNext = () => {
    if (step === 'mood') setStep('energy');
    else if (step === 'energy') setStep('sleep');
    else if (step === 'sleep') setStep('stressor');
    else if (step === 'stressor') setStep('positive');
    else if (step === 'positive') handleSubmit();
  };

  const handleBack = () => {
    if (step === 'energy') setStep('mood');
    else if (step === 'sleep') setStep('energy');
    else if (step === 'stressor') setStep('sleep');
    else if (step === 'positive') setStep('stressor');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Build check-in text
      const checkInText = `Daily Check-in:
Mood: ${data.mood}/10
Energy: ${data.energy}/10
Sleep: ${data.sleep} hours
Main Stressor: ${data.stressor}
One Good Thing: ${data.positive}`;

      // Send as chat message
      const response = await fetch('/api/v1/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: checkInText,
          mode: 'checkin',
        }),
      });

      if (!response.ok) throw new Error('Failed to submit check-in');

      const result = await response.json();
      setConversationId(result.conversationId || conversationId);
      setStep('complete');
    } catch (err: any) {
      logger.error('Failed to submit check-in', err);
      alert('Failed to submit check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 'mood') return data.mood !== null;
    if (step === 'energy') return data.energy !== null;
    if (step === 'sleep') return data.sleep !== null && data.sleep > 0;
    if (step === 'stressor') return data.stressor.trim().length > 0;
    if (step === 'positive') return data.positive.trim().length > 0;
    return false;
  };

  if (step === 'complete') {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Check-in Complete!</h2>
        <p className="text-gray-600 mb-6">
          Your check-in has been saved. Weekly insights are built from these check-ins.
        </p>
        <button
          onClick={() => {
            setStep('mood');
            setData({ mood: null, energy: null, sleep: null, stressor: '', positive: '' });
          }}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Start New Check-in
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Step {['mood', 'energy', 'sleep', 'stressor', 'positive'].indexOf(step) + 1} of 5
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{
              width: `${((['mood', 'energy', 'sleep', 'stressor', 'positive'].indexOf(step) + 1) / 5) * 100}%`,
            }}
          />
        </div>
      </div>

      {step === 'mood' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">How is your mood today? (1-10)</h2>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => setData({ ...data, mood: num })}
                className={`w-12 h-12 rounded-full ${
                  data.mood === num
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'energy' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">How is your energy level? (1-10)</h2>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => setData({ ...data, energy: num })}
                className={`w-12 h-12 rounded-full ${
                  data.energy === num
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'sleep' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">How many hours did you sleep last night?</h2>
          <div className="flex gap-2 justify-center flex-wrap">
            {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((hours) => (
              <button
                key={hours}
                onClick={() => setData({ ...data, sleep: hours })}
                className={`px-4 py-2 rounded ${
                  data.sleep === hours
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {hours} hrs
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'stressor' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">What's your main stressor today?</h2>
          <textarea
            value={data.stressor}
            onChange={(e) => setData({ ...data, stressor: e.target.value })}
            placeholder="Share what's causing you stress..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
          />
        </div>
      )}

      {step === 'positive' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">What's one good thing that happened today?</h2>
          <textarea
            value={data.positive}
            onChange={(e) => setData({ ...data, positive: e.target.value })}
            placeholder="Share something positive..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
          />
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={step === 'mood'}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 'positive' ? (loading ? 'Submitting...' : 'Submit') : 'Next'}
        </button>
      </div>
    </div>
  );
}



