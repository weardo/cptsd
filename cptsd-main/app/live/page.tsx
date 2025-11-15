import Link from 'next/link';
import { getPublishedBlogs } from '@/lib/dataActions';

const BLOG_DOMAIN = process.env.NEXT_PUBLIC_BLOG_DOMAIN || 'https://blog.cptsd.in';

// Force dynamic rendering to fetch data at request time
export const dynamic = 'force-dynamic';

export default async function LivePage() {
  // Fetch articles for relevant sections
  const numbArticles = await getPublishedBlogs({ limit: 3, tags: ['numbness', 'sensitivity', 'emotional-regulation'] });
  const peoplePleasingArticles = await getPublishedBlogs({ limit: 3, tags: ['boundaries', 'people-pleasing', 'self-care'] });
  const workArticles = await getPublishedBlogs({ limit: 3, tags: ['work', 'burnout', 'studies', 'productivity'] });
  const bodyArticles = await getPublishedBlogs({ limit: 3, tags: ['health', 'sleep', 'body', 'physical'] });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Living with CPTSD</h1>
      <p className="text-xl text-gray-700 mb-12">
        This page is for <strong>day-to-day life with CPTSD traits</strong>. These sections offer
        practical insights and small practices that may help.
      </p>

      <div className="space-y-16">
        {/* Section 1: Feeling numb or "too sensitive" */}
        <section className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Feeling numb or "too sensitive"
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Emotional numbing and overwhelm are both valid survival responses. When your nervous
            system has adapted to long-term stress, you might swing between feeling too much and
            feeling nothing at all.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Here are some very small, low-demand practices you can try:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Noticing your feet on the floor</li>
            <li>Naming 3 things you can see around you</li>
            <li>Gentle stretching or movement</li>
            <li>Taking slow, deep breaths</li>
            <li>Holding something warm or cold in your hands</li>
          </ul>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-gray-700">
              <strong>Important:</strong> Pause if anything feels too much. These practices are
              suggestions, not requirements. Be gentle with yourself.
            </p>
          </div>
          {numbArticles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Articles</h3>
              <ul className="space-y-2">
                {numbArticles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`${BLOG_DOMAIN}/learn/${article.slug}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Section 2: People-pleasing and fawning */}
        <section className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            People-pleasing and fawning
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Always saying "yes", over-apologising, or trying to keep everyone happy can be a trauma
            response. In Indian contexts, this might show up as being "accommodating", "sanskaari",
            or the "good child" who never causes trouble.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Small steps toward boundaries:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Delaying your answer: "I'll think about it and get back to you"</li>
            <li>Practising saying "no" to small, low-stakes requests</li>
            <li>Noticing when you're saying "yes" from fear rather than genuine desire</li>
            <li>Remembering that setting boundaries is not selfish—it's necessary for your
              wellbeing</li>
          </ul>
          {peoplePleasingArticles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Articles</h3>
              <ul className="space-y-2">
                {peoplePleasingArticles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`${BLOG_DOMAIN}/learn/${article.slug}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Section 3: Work, studies and burnout */}
        <section className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Work, studies and burnout
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Common patterns include:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>
              <strong>Overworking + perfectionism:</strong> pushing yourself until you collapse,
              feeling like nothing is ever good enough
            </li>
            <li>
              <strong>Freezing + procrastination + shame spirals:</strong> feeling stuck, unable to
              start, then shaming yourself for not being productive
            </li>
          </ul>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">Small reframes:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Breaking tasks into smaller steps (even "open the document" can be a step)</li>
            <li>Setting realistic "good enough" goals instead of perfect ones</li>
            <li>Prioritising rest as a form of recovery, not laziness</li>
            <li>Recognising that productivity is not your worth</li>
          </ul>
          {workArticles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Articles</h3>
              <ul className="space-y-2">
                {workArticles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`${BLOG_DOMAIN}/learn/${article.slug}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Section 4: Body and health */}
        <section className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Body and health</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Trauma can show up in the body. Common experiences include:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Sleep issues (insomnia, nightmares, restless sleep)</li>
            <li>Digestion issues</li>
            <li>Chronic pain or tension</li>
            <li>Fatigue that doesn't improve with rest</li>
          </ul>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded mb-4">
            <p className="text-gray-700">
              <strong>Important:</strong> Please seek medical evaluation for physical symptoms. Do
              NOT dismiss physical symptoms as "just trauma". Mental and physical health are
              connected, and both deserve proper care.
            </p>
          </div>
          {bodyArticles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Articles</h3>
              <ul className="space-y-2">
                {bodyArticles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`${BLOG_DOMAIN}/learn/${article.slug}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
