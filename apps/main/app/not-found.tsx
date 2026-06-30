import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
      <p className="text-xl text-gray-700 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="btn btn-primary inline-block text-center"
      >
        Go Home
      </Link>
    </div>
  );
}

