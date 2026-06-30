import { ResourceItem } from './CrisisSection';

interface DirectoriesSectionProps {
  therapyDirectories: ResourceItem[];
  ngos: ResourceItem[];
}

export default function DirectoriesSection({ therapyDirectories, ngos }: DirectoriesSectionProps) {
  const combined = [...therapyDirectories, ...ngos];
  const hasAny = combined.length > 0;

  return (
    <section className="bg-surface py-16">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-on-surface mb-6">
          Therapy directories and organisations
        </h2>

        <div className="bg-surface-container-low border-l-4 border-primary-container p-4 rounded-xl mb-8">
          <p className="text-on-surface-variant text-sm leading-relaxed">
            We cannot vet individual therapists. These directories are maintained by their own
            organisations.
          </p>
        </div>

        {!hasAny && (
          <p className="text-on-surface-variant">
            No therapy directories or organisations listed yet.
          </p>
        )}

        {hasAny && (
          <div className="space-y-6">
            {combined.map((resource) => (
              <div
                key={resource.id}
                className="bg-surface-container-lowest rounded-xl p-6"
                style={{ boxShadow: 'var(--shadow-ambient)' }}
              >
                <h3 className="text-xl font-semibold text-on-surface mb-3">{resource.title}</h3>
                <p className="text-on-surface-variant mb-4 leading-relaxed">
                  {resource.description}
                </p>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-container font-medium"
                  >
                    Visit directory →
                  </a>
                )}
                {resource.phone && (
                  <p className="text-sm text-on-surface-variant mt-2">{resource.phone}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
