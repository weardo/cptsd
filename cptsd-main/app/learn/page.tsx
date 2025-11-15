import Link from 'next/link';
import { getBlogsByCategory, getResourcesByType } from '@/lib/dataActions';
import { ResourceType } from '@cptsd/db';

const BLOG_DOMAIN = process.env.NEXT_PUBLIC_BLOG_DOMAIN || 'https://blog.cptsd.in';

const categoryInfo: Record<string, { name: string; description: string }> = {
  BASICS: {
    name: 'Basics',
    description: 'Definitions, symptoms, concepts',
  },
  INDIA_CONTEXT: {
    name: 'India Context',
    description: 'Family culture, emotional neglect, caste/class, gender roles',
  },
  DAILY_LIFE: {
    name: 'Daily Life',
    description: 'Work, studies, friendships, emotions',
  },
  HEALING: {
    name: 'Healing & Therapy',
    description: 'Therapy options, grounding, safety, boundaries',
  },
  RELATIONSHIPS: {
    name: 'Relationships',
    description: 'Attachment, trust, dating, family',
  },
};

export default async function LearnPage() {
  const blogsByCategory = await getBlogsByCategory();
  const educationalResources = await getResourcesByType(ResourceType.EDUCATIONAL_SITE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Learn</h1>
        <p className="text-xl text-gray-700 leading-relaxed">
          "Learn" is our library of content about complex trauma and CPTSD. We are slowly building
          India-focused articles and linking to high-quality international resources.
        </p>
      </div>

      <div className="space-y-12">
        {Object.entries(categoryInfo).map(([categoryKey, info]) => {
          const blogs = blogsByCategory[categoryKey] || [];
          return (
            <section key={categoryKey} className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{info.name}</h2>
              <p className="text-gray-600 mb-6">{info.description}</p>

              {/* Internal Articles */}
              {blogs.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Articles</h3>
                  <ul className="space-y-3">
                    {blogs.map((blog) => (
                      <li key={blog.id}>
                        <Link
                          href={`${BLOG_DOMAIN}/learn/${blog.slug}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-lg"
                        >
                          {blog.title}
                        </Link>
                        {blog.excerpt && (
                          <p className="text-gray-600 text-sm mt-1">{blog.excerpt}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* External Resources (shown when no articles or as supplement) */}
              {blogs.length === 0 && categoryKey === 'BASICS' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    External Resources
                  </h3>
                  <p className="text-sm text-gray-500 italic mb-3">
                    External link – may use non-Indian examples, still useful for concepts.
                  </p>
                  <ul className="space-y-3">
                    {educationalResources
                      .filter((r) => r.tags?.some((tag) => tag.toLowerCase().includes('cptsd')))
                      .slice(0, 2)
                      .map((resource) => (
                        <li key={resource.id}>
                          <a
                            href={resource.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium text-lg"
                          >
                            {resource.title}
                          </a>
                          <p className="text-gray-600 text-sm mt-1">{resource.description}</p>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {blogs.length === 0 && categoryKey !== 'BASICS' && (
                <p className="text-gray-500 italic">
                  Articles in this category will appear here as they are published.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
