import Link from 'next/link';

export default function CrisisBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 py-3 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm text-amber-900">
          <span className="font-semibold">In crisis or feeling unsafe right now?</span>{' '}
          This website cannot support emergencies.{' '}
          <Link href="/support#helplines" className="underline font-medium hover:text-amber-700">
            See mental health helplines and emergency options
          </Link>
        </p>
      </div>
    </div>
  );
}

