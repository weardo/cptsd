'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface EntryDetail {
  entry: {
    id: string;
    source: 'checkin' | 'freewrite';
    rawText: string;
    createdAt: string;
  };
  analysis: {
    emotions: Array<{ label: string; score: number }>;
    themes: Array<{ label: string; score: number }>;
    stressors: Array<{ label: string; score: number }>;
    coping?: Array<{ label: string; score: number }>;
    sentimentScore: number;
    risk: { level: string; reasons: string[] };
    createdAt: string;
  } | null;
}

export default function EntryDetailPage() {
  const params = useParams();
  const [data, setData] = useState<EntryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntry();
  }, [params.id]);

  const loadEntry = async () => {
    try {
      const response = await fetch(`/api/v1/journal/entry/${params.id}`);
      if (!response.ok) throw new Error('Failed to load entry');
      const data = await response.json();
      setData(data);
    } catch (err) {
      console.error('Failed to load entry:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Loading entry...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Entry not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/app/entries" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          ← Back to Entries
        </Link>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <span
              className={`px-2 py-1 rounded text-xs ${
                data.entry.source === 'checkin'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {data.entry.source}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(data.entry.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{data.entry.rawText}</p>
        </div>

        {data.analysis && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analysis</h2>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Sentiment Score</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {data.analysis.sentimentScore > 0.3 ? '😊' : data.analysis.sentimentScore < -0.3 ? '😔' : '😐'}
                </span>
                <span>{data.analysis.sentimentScore.toFixed(2)}</span>
              </div>
            </div>

            {data.analysis.emotions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Emotions</h3>
                <div className="flex flex-wrap gap-2">
                  {data.analysis.emotions.map((emotion, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {emotion.label} ({(emotion.score * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.analysis.themes.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Themes</h3>
                <div className="flex flex-wrap gap-2">
                  {data.analysis.themes.map((theme, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {theme.label} ({(theme.score * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.analysis.stressors.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Stressors</h3>
                <div className="flex flex-wrap gap-2">
                  {data.analysis.stressors.map((stressor, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                    >
                      {stressor.label} ({(stressor.score * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.analysis.coping && data.analysis.coping.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Coping Strategies</h3>
                <div className="flex flex-wrap gap-2">
                  {data.analysis.coping.map((coping, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {coping.label} ({(coping.score * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <h3 className="font-semibold mb-2">Risk Assessment</h3>
              <div
                className={`px-3 py-2 rounded ${
                  data.analysis.risk.level === 'high'
                    ? 'bg-red-100 text-red-800'
                    : data.analysis.risk.level === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                <span className="font-semibold">Level: {data.analysis.risk.level}</span>
                {data.analysis.risk.reasons.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {data.analysis.risk.reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



