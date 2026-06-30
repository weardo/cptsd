'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Entry {
  id: string;
  source: 'checkin' | 'freewrite';
  rawText: string;
  createdAt: string;
  analysis: {
    emotions: Array<{ label: string; score: number }>;
    themes: Array<{ label: string; score: number }>;
    sentimentScore: number;
    risk: { level: string; reasons: string[] };
  } | null;
}

export default function EntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadEntries();
  }, [page]);

  const loadEntries = async () => {
    try {
      const response = await fetch(`/api/v1/journal/entries?page=${page}&limit=20`);
      if (!response.ok) throw new Error('Failed to load entries');
      const data = await response.json();
      setEntries(data.entries);
    } catch (err) {
      console.error('Failed to load entries:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Loading entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Journal Entries</h1>
        {entries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No entries yet. Start journaling to see your entries here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/app/entries/${entry.id}`}
                className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      entry.source === 'checkin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {entry.source}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 line-clamp-3">{entry.rawText}</p>
                {entry.analysis && (
                  <div className="mt-4 flex gap-4 text-sm">
                    <span className="text-gray-600">
                      Sentiment: {entry.analysis.sentimentScore > 0 ? '😊' : '😔'}{' '}
                      {entry.analysis.sentimentScore.toFixed(2)}
                    </span>
                    {entry.analysis.emotions.length > 0 && (
                      <span className="text-gray-600">
                        Emotions: {entry.analysis.emotions.slice(0, 3).map((e) => e.label).join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



