import { getAllResources } from '@/lib/dataActions';
import { ResourceType } from '@cptsd/db';

export const dynamic = 'force-dynamic';

export default async function SupportPage() {
  const resources = await getAllResources();

  const helplines = resources[ResourceType.HELPLINE] || [];
  const featuredHelplines = helplines.filter((h) => h.isFeatured || h.featured);
  const otherHelplines = helplines.filter((h) => !h.isFeatured && !h.featured);
  const therapyDirectories = resources[ResourceType.THERAPY_DIRECTORY] || [];
  const ngos = resources[ResourceType.NGO] || [];
  const educationalSites = resources[ResourceType.EDUCATIONAL_SITE] || [];
  const communities = resources[ResourceType.COMMUNITY] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-on-surface mb-6">Get Support</h1>

        {/* Top Disclaimer */}
        <div className="bg-surface-container-high border-l-4 border-primary-container p-6 mb-8 rounded-xl">
          <p className="font-semibold text-on-surface mb-2">Important Disclaimer</p>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            This page lists support options that may help you if you are struggling. We do not run
            any helplines, NGOs, or therapy services ourselves. Information can change, so please
            always check the official website or number before relying on it.
          </p>
        </div>

        {/* Emergency Note */}
        <div className="bg-surface-container-low border-l-4 border-primary p-6 mb-8 rounded-xl">
          <p className="font-semibold text-on-surface mb-2">If you or someone near you is in immediate danger</p>
          <p className="text-on-surface text-sm leading-relaxed mb-2">
            If you or someone near you is in immediate danger, or has taken steps to harm themselves, please:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-on-surface text-sm">
            <li>Call local emergency services (for many parts of India, that's <strong>112</strong>), or</li>
            <li>Go to the nearest hospital emergency department, or</li>
            <li>Ask a trusted person to help you reach medical care.</li>
          </ul>
        </div>

        {/* Helplines */}
        <section id="helplines" className="mb-12 scroll-mt-20">
          <h2 className="text-3xl font-bold text-on-surface mb-6">Helplines (India)</h2>

          {featuredHelplines.length > 0 && (
            <div className="space-y-6 mb-8">
              {featuredHelplines.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-surface-container-high rounded-xl p-6"
                >
                  <h3 className="text-2xl font-bold text-on-surface mb-3">{resource.title}</h3>
                  <p className="text-on-surface mb-6 leading-relaxed">{resource.description}</p>
                  <div className="flex flex-wrap gap-4 items-center">
                    {resource.phone && (
                      <a
                        href={`tel:${resource.phone.replace(/\s+/g, '').replace(/\//g, ',')}`}
                        className="text-2xl font-bold text-primary hover:text-primary-container font-mono"
                      >
                        📞 {resource.phone}
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
                          📞 {resource.phone}
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

          {helplines.length === 0 && (
            <p className="text-on-surface-variant">No helplines listed yet. Check back soon.</p>
          )}
        </section>

        {/* Find a therapist */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-on-surface mb-6">
            Find a therapist or support group (India)
          </h2>
          <div className="bg-surface-container-low border-l-4 border-primary-container p-4 mb-6 rounded-xl">
            <p className="text-on-surface text-sm leading-relaxed">
              <strong>Note:</strong> We cannot vet individual therapists. These directories are
              maintained by their own organisations. When you reach out, you can ask therapists
              directly about their experience with trauma and complex trauma.
            </p>
          </div>
          <div className="space-y-6">
            {[...therapyDirectories, ...ngos].map((resource) => (
              <div
                key={resource.id}
                className="bg-surface-container-lowest rounded-xl p-6"
                style={{ boxShadow: 'var(--shadow-ambient)' }}
              >
                <h3 className="text-xl font-semibold text-on-surface mb-2">{resource.title}</h3>
                <p className="text-on-surface-variant mb-3">{resource.description}</p>
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
                  <p className="text-sm text-on-surface-variant mt-2">📞 {resource.phone}</p>
                )}
              </div>
            ))}
            {therapyDirectories.length === 0 && ngos.length === 0 && (
              <p className="text-on-surface-variant">No therapy directories or NGOs listed yet.</p>
            )}
          </div>
        </section>

        {/* International psychoeducation */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-on-surface mb-6">
            International psychoeducation
          </h2>
          <div className="bg-surface-container-high border-l-4 border-primary-container p-4 mb-6 rounded-xl">
            <p className="text-on-surface text-sm leading-relaxed">
              These sites are not India-specific, but they explain CPTSD in clear language and can
              help you understand the concepts.
            </p>
          </div>
          <div className="space-y-6">
            {educationalSites.map((resource) => (
              <div
                key={resource.id}
                className="bg-surface-container-lowest rounded-xl p-6"
                style={{ boxShadow: 'var(--shadow-ambient)' }}
              >
                <h3 className="text-xl font-semibold text-on-surface mb-2">{resource.title}</h3>
                <p className="text-on-surface-variant mb-3">{resource.description}</p>
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
            ))}
            {educationalSites.length === 0 && (
              <p className="text-on-surface-variant">No educational sites listed yet.</p>
            )}
          </div>
        </section>

        {/* Online communities */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-on-surface mb-6">Online communities</h2>
          <div className="bg-surface-container-low border-l-4 border-primary p-4 mb-6 rounded-xl">
            <p className="text-on-surface text-sm leading-relaxed">
              <strong>Trigger warning:</strong> Peer communities can be validating, but they may
              also contain distressing or triggering content. They are not a replacement for
              therapy or crisis services.
            </p>
          </div>
          <div className="space-y-6">
            {communities.map((resource) => (
              <div
                key={resource.id}
                className="bg-surface-container-lowest rounded-xl p-6"
                style={{ boxShadow: 'var(--shadow-ambient)' }}
              >
                <h3 className="text-xl font-semibold text-on-surface mb-2">{resource.title}</h3>
                <p className="text-on-surface-variant mb-3">{resource.description}</p>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-container font-medium"
                  >
                    Join community →
                  </a>
                )}
              </div>
            ))}
            {communities.length === 0 && (
              <p className="text-on-surface-variant">No peer communities listed yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
