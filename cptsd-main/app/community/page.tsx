import Link from 'next/link';

const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL || '#';
const TELEGRAM_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || '#';
const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#';

export default function CommunityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Community</h1>

      {/* Why stories matter */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Why stories matter</h2>
        <p className="text-gray-700 text-lg leading-relaxed mb-4">
          Hearing other people's experiences can break isolation and shame, but no one is required
          to share. CPTSD.in will host <strong>anonymised, moderated stories</strong> from community
          members.
        </p>
        <p className="text-gray-700 text-lg leading-relaxed">
          Reading stories can help you feel less alone. Sharing your story (if you choose to) can be
          a way to process your experiences and support others on similar journeys.
        </p>
      </section>

      {/* What this community is / is not */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">What this community is / is not</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">This community IS:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>A place for gentle validation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Normalising trauma responses</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Sharing recovery moments</span>
              </li>
            </ul>
          </div>
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">This community IS NOT:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Crisis counselling</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>A place to diagnose others</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>A replacement for therapy</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Community guidelines */}
      <section className="mb-12 bg-blue-50 border-l-4 border-blue-400 p-6 rounded">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Community guidelines</h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              <strong>Be kind;</strong> avoid shaming, blaming, or identity-based attacks.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              <strong>No graphic details</strong> of violence, abuse or self-harm.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              <strong>Don't give prescriptive medical advice</strong> ("stop your meds", "don't
              trust psychiatrists").
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              You can talk about therapy experiences, but <strong>not promote or defame specific
              individuals</strong>.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              <strong>Respect anonymity;</strong> don't try to identify people from their stories.
            </span>
          </li>
        </ul>
      </section>

      {/* Call to action */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Get involved</h2>
        <div className="space-y-4">
          <Link
            href="/stories"
            className="btn btn-primary block text-center"
          >
            Read stories
          </Link>
          <Link
            href="/stories/submit"
            className="btn btn-secondary block text-center"
          >
            Share your story anonymously
          </Link>
        </div>
      </section>

      {/* External communities (optional) */}
      {(WHATSAPP_URL !== '#' || TELEGRAM_URL !== '#' || INSTAGRAM_URL !== '#') && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect on social media</h2>
          <p className="text-gray-700 mb-4">
            Join our community spaces for ongoing support and discussion:
          </p>
          <div className="flex flex-wrap gap-4">
            {WHATSAPP_URL !== '#' && (
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-medium"
              >
                WhatsApp
              </a>
            )}
            {TELEGRAM_URL !== '#' && (
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
              >
                Telegram
              </a>
            )}
            {INSTAGRAM_URL !== '#' && (
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 font-medium"
              >
                Instagram
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
