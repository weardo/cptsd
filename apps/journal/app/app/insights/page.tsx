'use client';

import { useEffect, useState } from 'react';

interface WeeklyInsight {
  id: string;
  weekStart: string;
  summaryText: string;
  topThemes: Array<{ label: string; count: number }>;
  topStressors: Array<{ label: string; count: number }>;
  positives: Array<{ label: string; count: number }>;
  createdAt: string;
}

interface JobStatus {
  id: string;
  type: string;
  status: string;
  attempts: number;
  lastError?: string;
  createdAt: string;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<WeeklyInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [showJobs, setShowJobs] = useState(false);

  useEffect(() => {
    loadInsights();
    loadJobStatus();
  }, []);

  const loadInsights = async () => {
    try {
      const response = await fetch('/api/v1/insights/weekly');
      if (!response.ok) throw new Error('Failed to load insights');
      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobStatus = async () => {
    try {
      const response = await fetch('/api/v1/jobs/status?type=WEEKLY_INSIGHT');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to load job status:', err);
    }
  };

  const handleGenerate = async () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    const response = await fetch('/api/v1/insights/weekly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart: weekStart.toISOString() }),
    });
    if (response.ok) {
      const data = await response.json();
      alert(
        `Insight generation job enqueued (Job ID: ${data.jobId}).\n\n` +
        `⚠️ Make sure the worker service is running!\n` +
        `Run: cd services/worker && ./start.sh\n\n` +
        `The worker will process this job automatically.`
      );
      loadInsights();
      setTimeout(loadJobStatus, 1000);
    } else {
      const error = await response.json();
      alert(`Failed to enqueue job: ${error.error}`);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Weekly Insights</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJobs(!showJobs)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              {showJobs ? 'Hide' : 'Show'} Job Status
            </button>
            <button
              onClick={handleGenerate}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Generate Weekly Insight
            </button>
          </div>
        </div>

        {showJobs && jobs.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold mb-2">Recent Jobs</h2>
            <div className="space-y-2 text-sm">
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex justify-between items-center">
                  <span>
                    {job.type} - <span className="font-semibold">{job.status}</span>
                    {job.attempts > 0 && ` (attempt ${job.attempts})`}
                  </span>
                  <span className="text-gray-500">
                    {new Date(job.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            {jobs.some((j) => j.status === 'PENDING' || j.status === 'RUNNING') && (
              <p className="text-sm text-yellow-800 mt-2">
                ⚠️ Jobs are queued. Make sure the worker is running to process them.
              </p>
            )}
          </div>
        )}

        {insights.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              No insights available yet. Complete some journal entries to generate insights.
            </p>
            <button
              onClick={handleGenerate}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Generate Weekly Insight
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {insights.map((insight) => (
              <div key={insight.id} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-2">
                  Week of {new Date(insight.weekStart).toLocaleDateString()}
                </h2>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{insight.summaryText}</p>

                {insight.topThemes.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Top Themes</h3>
                    <div className="flex flex-wrap gap-2">
                      {insight.topThemes.map((theme, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {theme.label} ({theme.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {insight.topStressors.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Top Stressors</h3>
                    <div className="flex flex-wrap gap-2">
                      {insight.topStressors.map((stressor, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                        >
                          {stressor.label} ({stressor.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {insight.positives.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Positive Moments</h3>
                    <div className="flex flex-wrap gap-2">
                      {insight.positives.map((positive, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {positive.label} ({positive.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
