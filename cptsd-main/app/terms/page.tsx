import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>

      <div className="prose prose-lg max-w-none">
        <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-8 rounded">
          <p className="text-gray-700 text-sm leading-relaxed">
            <strong>Legal Notice:</strong> This is a simple, non-legal-advice template. These terms
            should be reviewed by a qualified lawyer before launch.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Use of Website</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Use of the website is voluntary. Content is for informational purposes only.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            CPTSD.in does not provide medical, psychiatric, psychological, or legal services. The
            information on this website is not intended to be a substitute for professional medical
            advice, diagnosis, or treatment.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">External Links</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            External links are provided for convenience. CPTSD.in is not responsible for content,
            availability, or quality of services provided by external sites or helplines. We encourage
            users to verify information independently.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Community Stories</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Users should not post identifying information in community stories. By submitting a story,
            you agree that:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Your story may be reviewed and moderated before publication</li>
            <li>CPTSD.in reserves the right to remove content that breaks guidelines or local laws</li>
            <li>Stories are shared anonymously and should not contain personally identifiable
              information</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Moderation</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            CPTSD.in reserves the right to remove content (stories, comments, etc.) that breaks
            community guidelines, violates local laws, or is harmful to others.
          </p>
        </section>

        <section className="mb-12 bg-red-50 border-l-4 border-red-400 p-6 rounded">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Emergency Services</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            <strong>This website does not provide emergency or crisis support.</strong> If you are in
            immediate danger or experiencing a mental health crisis, please contact emergency
            services, a crisis helpline, or go to the nearest hospital. See our{' '}
            <Link href="/support#helplines" className="text-blue-600 hover:text-blue-700">
              support page
            </Link>{' '}
            for helpline numbers.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            CPTSD.in may update these terms from time to time. Continued use of the website
            constitutes acceptance of any changes.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            For questions about these terms, please contact us through our community channels. Note
            that contact forms are not monitored for emergencies.
          </p>
        </section>
      </div>
    </div>
  );
}

