import Link from 'next/link';
import { getPublishedBlogs, getApprovedStories } from '@/lib/dataActions';
import { getFeaturedContent } from '@/lib/getFeaturedContent';
import FeaturedCard from './featured/featured-card';

// Force dynamic rendering to fetch data at request time
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [latestBlogs, stories, featuredItems] = await Promise.all([
    getPublishedBlogs({ limit: 5, featured: true }),
    getApprovedStories(3),
    getFeaturedContent(6),
  ]);

  return (
    <div>
      {/* ── Hero Section ── */}
      <section className="bg-surface-container-low py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-5 lg:gap-12 lg:items-center">
            <div className="lg:col-span-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-on-surface mb-6">
                Complex trauma, emotional neglect, and CPTSD — in an Indian context.
              </h1>
              <p className="text-xl text-on-surface leading-relaxed mb-4">
                CPTSD.in is a volunteer-run space for people who grew up with long-term stress, emotional
                neglect, or abuse and are now trying to understand what happened to them.
              </p>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-10">
                We offer psychoeducation, curated resources, and community stories. We're not a hospital
                or clinic — we help you put words to your experience and find support.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/start-here" className="btn btn-primary">
                  Start here
                </Link>
                <Link href="/learn" className="btn btn-secondary">
                  Learn about CPTSD
                </Link>
                <Link href="/support" className="btn btn-tertiary">
                  Get support
                </Link>
              </div>
            </div>
            {/* Deliberate empty space — reduces visual clutter per design system */}
            <div className="hidden lg:block lg:col-span-2" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ── Featured & highlights ── */}
      <section className="bg-surface py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-on-surface mb-8">
            Featured &amp; highlights from the community &amp; beyond
          </h2>
          {featuredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <FeaturedCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-8" style={{ boxShadow: 'var(--shadow-ambient)' }}>
              <p className="text-on-surface-variant">Curated highlights will appear here.</p>
            </div>
          )}
          <div className="mt-8">
            <Link href="/featured" className="btn btn-tertiary inline-block">
              Browse all highlights →
            </Link>
          </div>
        </div>
      </section>

      {/* ── What is CPTSD? ── */}
      <section className="bg-surface-container-low py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-on-surface mb-6">What is CPTSD?</h2>
            <div className="bg-surface-container-lowest rounded-xl p-8" style={{ boxShadow: 'var(--shadow-ambient)' }}>
              <p className="text-lg text-on-surface leading-relaxed mb-6">
                Trauma can be one-time or long-term. CPTSD describes the impact of long-term trauma:
                intrusive memories, avoidance, feeling on edge, plus long-lasting difficulties with
                emotions, self-worth and relationships.
              </p>
              <Link href="/learn" className="btn btn-tertiary inline-block px-0">
                Learn more about CPTSD →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Living with CPTSD in India ── */}
      <section className="bg-surface py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-on-surface mb-8">Living with CPTSD in India</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-6" style={{ boxShadow: 'var(--shadow-ambient)' }}>
              <h3 className="text-xl font-semibold text-on-surface mb-3">
                Emotional neglect in families
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                Many people in India grow up with emotional needs that weren't met, even when physical
                needs were provided. This can shape how you relate to yourself and others.
              </p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-6" style={{ boxShadow: 'var(--shadow-ambient)' }}>
              <h3 className="text-xl font-semibold text-on-surface mb-3">
                "Log kya kahenge", shame and pressure
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                The pressure to maintain appearances, fear of judgment, and deep shame can be
                especially intense in Indian contexts, making it harder to seek help or talk about
                trauma.
              </p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-6" style={{ boxShadow: 'var(--shadow-ambient)' }}>
              <h3 className="text-xl font-semibold text-on-surface mb-3">
                Burnout, study/work stress, and feeling "too sensitive" or "too numb"
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                Trauma responses can show up as perfectionism and overwork, or as freezing and
                procrastination. Both are valid survival responses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── From the community ── */}
      <section className="bg-surface-container-low py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-on-surface mb-8">From the community</h2>
          {stories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.id}`}
                    className="bg-surface-container-lowest rounded-xl p-6 flex flex-col no-underline hover:bg-surface-variant transition-colors"
                    style={{ boxShadow: 'var(--shadow-ambient)' }}
                  >
                    <h3 className="text-xl font-semibold text-on-surface mb-2">{story.title}</h3>
                    <p className="text-sm text-on-surface-variant mb-3">By {story.pseudonym}</p>
                    <p className="text-on-surface-variant line-clamp-3 mb-4 flex-1">{story.excerpt}...</p>
                    <span className="text-primary font-medium text-sm">Read more →</span>
                  </Link>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/stories" className="btn btn-tertiary inline-block">
                  View all stories →
                </Link>
              </div>
            </>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-8 text-center" style={{ boxShadow: 'var(--shadow-ambient)' }}>
              <p className="text-on-surface mb-6 leading-relaxed">
                Community stories help break isolation and shame. Share your experience anonymously to
                support others on similar journeys.
              </p>
              <Link href="/stories/submit" className="btn btn-primary inline-block">
                Share your story
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Featured reading ── */}
      <section className="bg-surface py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-on-surface mb-8">Featured reading</h2>
          {latestBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestBlogs.slice(0, 4).map((blog) => {
                const blogUrl = blog.isLearnResource
                  ? `/learn/${blog.slug}`
                  : `/blog/${blog.slug}`;
                return (
                  <Link
                    key={blog.id}
                    href={blogUrl}
                    className="bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col no-underline hover:bg-surface-variant transition-colors"
                    style={{ boxShadow: 'var(--shadow-ambient)' }}
                  >
                    {blog.featuredImage && (
                      <img
                        src={blog.featuredImage}
                        alt={blog.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-semibold text-on-surface mb-2 flex-1">{blog.title}</h3>
                      {blog.excerpt && (
                        <p className="text-on-surface-variant line-clamp-3 text-sm mt-2">{blog.excerpt}</p>
                      )}
                      {blog.publishedAt && (
                        <p className="text-xs text-on-surface-variant mt-4">
                          {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-8" style={{ boxShadow: 'var(--shadow-ambient)' }}>
              <p className="text-on-surface-variant">
                Articles will appear here as they are published. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
