import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Image 
          src="/logo-final.svg" 
          alt="CPTSD.in" 
          width={48}
          height={48}
          className="h-12 w-12"
        />
        <h1 className="text-4xl font-bold text-gray-900">About CPTSD.in</h1>
      </div>

      <div className="prose prose-lg max-w-none">
        {/* Who we are */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Who we are</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            CPTSD.in is a volunteer-run digital project. Our goal is to make information about
            complex trauma, emotional neglect, and CPTSD more accessible in an Indian context.
          </p>
        </section>

        {/* What we do */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What we do</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">We work to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 text-lg">
            <li>Curate Indian and international resources about CPTSD</li>
            <li>Publish psychoeducational articles (via our blog)</li>
            <li>Host anonymised community stories</li>
            <li>Highlight support pathways (helplines, directories, NGOs)</li>
          </ul>
        </section>

        {/* What we cannot do */}
        <section className="mb-12 bg-amber-50 border-l-4 border-amber-400 p-6 rounded">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What we cannot do</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-amber-600 mr-2">•</span>
              <span>
                <strong>Not a clinic or hospital.</strong> We do not provide medical services.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-600 mr-2">•</span>
              <span>
                <strong>No diagnosis, prescriptions, or emergency intervention.</strong> Only
                qualified professionals can provide these services.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-600 mr-2">•</span>
              <span>
                <strong>No guarantee about any external resource.</strong> We encourage people to do
                their own checks and verify information before relying on it.
              </span>
            </li>
          </ul>
        </section>

        {/* Our values */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our values</h2>
          <ul className="space-y-3 text-gray-700 text-lg">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                <strong>Trauma-informed, consent-focused, inclusive.</strong> We believe in
                respecting people's boundaries and choices.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                <strong>Open to people of all genders, castes, classes, religions, and
                backgrounds.</strong> CPTSD affects people across all identities and communities.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                <strong>Committed to reducing shame and stigma</strong> around trauma and mental
                health.
              </span>
            </li>
          </ul>
        </section>

        {/* Contact & Support */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact & Support</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            For questions, feedback, or to report issues with the site, please use the contact
            methods available through our community channels.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            <strong>Important:</strong> Email or contact forms (if any) are not monitored for
            emergencies. For immediate support or crisis resources, please visit our{' '}
            <Link href="/support#helplines" className="text-blue-600 hover:text-blue-700">
              support page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
