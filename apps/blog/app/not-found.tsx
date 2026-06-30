import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-[#5b8a9f] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#5b8a9f] text-white rounded-lg hover:bg-[#4a7283] transition-colors font-semibold shadow-sm"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
