import Link from 'next/link';
import { getPublishedLearnSections } from '@/lib/learnActions';

// Force dynamic rendering to fetch data at request time
export const dynamic = 'force-dynamic';

export default async function LearnPage() {
  const sections = await getPublishedLearnSections();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Learn</h1>
        <p className="text-xl text-gray-700 leading-relaxed">
          "Learn" is our library of content about complex trauma and CPTSD. We are slowly building
          India-focused articles and linking to high-quality international resources.
        </p>
      </div>

      {sections.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">
            Learn sections are being set up. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.id} className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
              {section.description && (
                <p className="text-gray-600 mb-6">{section.description}</p>
              )}

              {section.items.length > 0 ? (
                <ul className="space-y-3">
                  {section.items.map((item: any) => {
                    let itemUrl = '#';
                    if (item.type === 'ARTICLE' && item.articleSlug) {
                      itemUrl = `/learn/${item.articleSlug}`;
                    } else if (item.type === 'RESOURCE' && item.resourceUrl) {
                      itemUrl = item.resourceUrl;
                    } else if (item.type === 'EXTERNAL_LINK' && item.externalUrl) {
                      itemUrl = item.externalUrl;
                    }

                    const displayTitle = item.title || 'Untitled';

                    return (
                      <li key={item.id}>
                        {item.type === 'ARTICLE' ? (
                          <Link
                            href={itemUrl}
                            className="text-blue-600 hover:text-blue-700 font-medium text-lg"
                          >
                            {displayTitle}
                          </Link>
                        ) : item.type === 'RESOURCE' ? (
                          <a
                            href={itemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium text-lg"
                          >
                            {displayTitle}
                            <span className="text-xs text-gray-400 ml-2">(Resource)</span>
                          </a>
                        ) : (
                          <a
                            href={itemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium text-lg"
                          >
                            {displayTitle}
                            <span className="text-xs text-gray-400 ml-2">(External)</span>
                          </a>
                        )}
                        {item.description && (
                          <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-gray-500 italic">
                  No items in this section yet.
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
