export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  url: string | null;
  phone: string | null;
  region: string | null;
  languages: string[];
  tags: string[];
  isFeatured: boolean;
  featured: boolean;
}

interface CrisisSectionProps {
  featuredHelplines: ResourceItem[];
  otherHelplines: ResourceItem[];
}

export default function CrisisSection({ featuredHelplines, otherHelplines }: CrisisSectionProps) {
  const hasAny = featuredHelplines.length > 0 || otherHelplines.length > 0;

  return (
    <section id="helplines" className="scroll-mt-20">
      <h2 className="text-3xl font-bold text-on-surface mb-6">
        Helplines &amp; crisis support
      </h2>

      {/* Emergency info box */}
      <div className="bg-surface-container-low border-l-4 border-primary p-6 mb-8 rounded-xl">
        <p className="font-semibold text-on-surface mb-2">
          If you or someone near you is in immediate danger
        </p>
        <p className="text-on-surface text-sm leading-relaxed mb-2">
          If you or someone near you is in immediate danger, or has taken steps to harm themselves,
          please:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-on-surface text-sm">
          <li>
            Call local emergency services (for many parts of India, that&apos;s{' '}
            <strong>112</strong>), or
          </li>
          <li>Go to the nearest hospital emergency department, or</li>
          <li>Ask a trusted person to help you reach medical care.</li>
        </ul>
      </div>

      {!hasAny && (
        <p className="text-on-surface-variant">No helplines listed yet. Check back soon.</p>
      )}

      {/* Featured helplines */}
      {featuredHelplines.length > 0 && (
        <div className="space-y-6 mb-8">
          {featuredHelplines.map((resource) => (
            <div key={resource.id} className="bg-surface-container-high rounded-xl p-6">
              <h3 className="text-2xl font-bold text-on-surface mb-3">{resource.title}</h3>
              <p className="text-on-surface mb-6 leading-relaxed">{resource.description}</p>
              <div className="flex flex-wrap gap-4 items-center">
                {resource.phone && (
                  <a
                    href={`tel:${resource.phone.replace(/\s+/g, '').replace(/\//g, ',')}`}
                    className="text-2xl font-bold text-primary hover:text-primary-container font-mono"
                  >
                    {resource.phone}
                  </a>
                )}
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-container font-medium"
                  >
                    Visit website →
                  </a>
                )}
              </div>
              {resource.region && (
                <p className="text-sm text-on-surface-variant mt-2">Region: {resource.region}</p>
              )}
              {resource.languages && resource.languages.length > 0 && (
                <p className="text-sm text-on-surface-variant">
                  Languages: {resource.languages.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Other helplines */}
      {otherHelplines.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-on-surface mb-6">Other Helplines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherHelplines.map((resource) => (
              <div
                key={resource.id}
                className="bg-surface-container-lowest rounded-xl p-5"
                style={{ boxShadow: 'var(--shadow-ambient)' }}
              >
                <h4 className="text-lg font-semibold text-on-surface mb-2">{resource.title}</h4>
                <p className="text-on-surface-variant text-sm mb-3">{resource.description}</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  {resource.phone && (
                    <a
                      href={`tel:${resource.phone.replace(/\s+/g, '').replace(/\//g, ',')}`}
                      className="text-primary hover:text-primary-container font-medium"
                    >
                      {resource.phone}
                    </a>
                  )}
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-container font-medium"
                    >
                      Website →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
