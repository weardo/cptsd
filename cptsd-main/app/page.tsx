import Link from 'next/link';
import { getPublishedBlogs, getApprovedStories } from '@/lib/dataActions';
import { getFeaturedContent } from '@/lib/getFeaturedContent';
import FeaturedCard from './featured/featured-card';

// Blog is now integrated at /blog

// Force dynamic rendering to fetch data at request time
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [latestBlogs, stories, featuredItems] = await Promise.all([
    getPublishedBlogs({ limit: 5, featured: true }), // Only get featured articles
    getApprovedStories(3),
    getFeaturedContent(6),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Complex trauma, emotional neglect, and CPTSD — in an Indian context.
        </h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-4">
          CPTSD.in is a volunteer-run space for people who grew up with long-term stress, emotional
          neglect, or abuse and are now trying to understand what happened to them.
        </p>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
          We offer psychoeducation, curated resources, and community stories. We're not a hospital
          or clinic — we help you put words to your experience and find support.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link
            href="/start-here"
            className="btn btn-primary text-center"
          >
            Start here
          </Link>
          <Link
            href="/learn"
            className="btn btn-secondary text-center"
          >
            Learn about CPTSD
          </Link>
          <Link
            href="/support"
            className="btn btn-accent text-center"
          >
            Get support
          </Link>
        </div>
      </section>

      {/* Featured & highlights from the community & beyond */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Featured & highlights from the community & beyond</h2>
        {featuredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <FeaturedCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Curated highlights will appear here.</p>
        )}
        <div className="mt-6 text-center">
          <Link href="/featured" className="text-blue-600 hover:text-blue-700 font-medium">
            Browse all highlights →
          </Link>
        </div>
      </section>

      {/* What is CPTSD? summary section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">What is CPTSD?</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Trauma can be one-time or long-term. CPTSD describes the impact of long-term trauma:
            intrusive memories, avoidance, feeling on edge, plus long-lasting difficulties with
            emotions, self-worth and relationships.
          </p>
          <Link
            href="/learn"
            className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
          >
            Learn more about CPTSD →
          </Link>
        </div>
      </section>

      {/* Living with CPTSD in India */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Living with CPTSD in India</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Emotional neglect in families
            </h3>
            <p className="text-gray-600">
              Many people in India grow up with emotional needs that weren't met, even when physical
              needs were provided. This can shape how you relate to yourself and others.
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              "Log kya kahenge", shame and pressure
            </h3>
            <p className="text-gray-600">
              The pressure to maintain appearances, fear of judgment, and deep shame can be
              especially intense in Indian contexts, making it harder to seek help or talk about
              trauma.
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Burnout, study/work stress, and feeling "too sensitive" or "too numb"
            </h3>
            <p className="text-gray-600">
              Trauma responses can show up as perfectionism and overwork, or as freezing and
              procrastination. Both are valid survival responses.
            </p>
          </div>
        </div>
      </section>

      {/* From the community */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">From the community</h2>
        {stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{story.title}</h3>
                <p className="text-sm text-gray-500 mb-3">By {story.pseudonym}</p>
                <p className="text-gray-600 line-clamp-3 mb-4">{story.excerpt}...</p>
                <span className="text-blue-600 font-medium">Read more →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-gray-700 mb-4">
              Community stories help break isolation and shame. Share your experience anonymously to
              support others on similar journeys.
            </p>
            <Link
              href="/stories/submit"
              className="btn btn-primary inline-block text-center"
            >
              Share your story
            </Link>
          </div>
        )}
        {stories.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/stories"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View all stories →
            </Link>
          </div>
        )}
      </section>

      {/* Featured reading */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Featured reading</h2>
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
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                {blog.featuredImage && (
                  <img
                    src={blog.featuredImage}
                    alt={blog.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{blog.title}</h3>
                {blog.excerpt && (
                  <p className="text-gray-600 line-clamp-3">{blog.excerpt}</p>
                )}
                {blog.publishedAt && (
                  <p className="text-sm text-gray-500 mt-4">
                    {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">
            Articles will appear here as they are published. Check back soon!
          </p>
        )}
      </section>
    </div>
  );
}

