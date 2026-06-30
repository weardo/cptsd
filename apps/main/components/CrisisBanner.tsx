import Link from 'next/link';

export default function CrisisBanner() {
  return (
    <div className="bg-surface-container-high py-3 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm text-on-surface">
          <span className="font-semibold">In crisis or feeling unsafe right now?</span>{' '}
          This website cannot support emergencies.{' '}
          <Link href="/find-help#helplines" className="font-medium text-primary hover:text-primary-container">
            See Indian mental health helplines and emergency options on our Find Help page
          </Link>
        </p>
      </div>
    </div>
  );
}

