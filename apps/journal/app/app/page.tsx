import Link from 'next/link';

export default function AppHomePage() {
  return (
    <div className="px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome to Your Journal</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/app/chat"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-2">Start Chatting</h2>
            <p className="text-gray-600">
              Have a conversation with your AI journaling assistant. Share your thoughts and
              feelings freely.
            </p>
          </Link>
          <Link
            href="/app/checkin"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-2">Daily Check-in</h2>
            <p className="text-gray-600">
              Complete a guided check-in to track your mood, energy, and daily experiences.
            </p>
          </Link>
          <Link
            href="/app/insights"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-2">Weekly Insights</h2>
            <p className="text-gray-600">
              View AI-generated insights about your journaling patterns and emotional trends.
            </p>
          </Link>
          <Link
            href="/app/entries"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-2">Entry History</h2>
            <p className="text-gray-600">
              Browse your past journal entries and see how your thoughts have evolved.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}



