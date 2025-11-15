import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none">
        <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-8 rounded">
          <p className="text-gray-700 text-sm leading-relaxed">
            <strong>Legal Notice:</strong> This is a simple, non-legal-advice template. This privacy
            policy should be reviewed by a qualified lawyer before launch.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Collect</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            CPTSD.in collects minimal information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <strong>Basic site analytics:</strong> If we use analytics tools (e.g., anonymised
              logs, Vercel Analytics, Plausible), we collect anonymised usage data to understand how
              the site is used.
            </li>
            <li>
              <strong>Story submissions:</strong> When you submit a story, we collect:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Pseudonym (as provided by you)</li>
                <li>Story text/content</li>
                <li>No requirement to share full name, phone, or address</li>
              </ul>
            </li>
            <li>
              <strong>Contact forms (if any):</strong> If you use a contact form, we collect the
              information you provide. Note that contact forms are not monitored for emergencies.
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">We commit to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <strong>Not selling personal data.</strong> We do not sell, rent, or trade your
              information to third parties.
            </li>
            <li>
              <strong>Using submissions to display anonymised stories</strong> and improve the site.
            </li>
            <li>
              <strong>Using analytics data</strong> (if collected) to understand site usage and
              improve user experience.
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Storage</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            Story submissions are stored securely. Pseudonyms and story content are kept separate from
            any identifying information. We take reasonable steps to protect your data, but no
            online service is 100% secure.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Analytics</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            If we use analytics tools (e.g., Vercel Analytics, Plausible, Google Analytics), they may
            use cookies or similar technologies. These tools help us understand:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>How many people visit the site</li>
            <li>Which pages are most viewed</li>
            <li>General geographic information (country/region level, not personal addresses)</li>
          </ul>
          <p className="text-gray-700 text-lg leading-relaxed mt-4">
            You can control cookies through your browser settings. Disabling cookies may affect site
            functionality.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            This website may link to external sites (helplines, directories, educational resources).
            We are not responsible for the privacy practices of these external sites. Please review
            their privacy policies separately.
          </p>
        </section>

        <section className="mb-12 bg-red-50 border-l-4 border-red-400 p-6 rounded">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Emergency Contact</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            <strong>Email or contact forms are not monitored for emergencies.</strong> If you are in
            crisis or immediate danger, please contact emergency services, a crisis helpline, or go
            to the nearest hospital. See our{' '}
            <Link href="/support#helplines" className="text-blue-600 hover:text-blue-700">
              support page
            </Link>{' '}
            for helpline numbers.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Request access to information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your story submission (contact us through community channels)</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Privacy Policy</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            CPTSD.in may update this privacy policy from time to time. We will notify users of
            significant changes. Continued use of the website constitutes acceptance of any changes.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            For questions about this privacy policy, please contact us through our community
            channels. Note that contact forms are not monitored for emergencies.
          </p>
        </section>
      </div>
    </div>
  );
}

