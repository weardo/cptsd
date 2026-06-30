import { getPublishedLearnSections } from '@/lib/learnActions';
import LearnBrowser from './learn-browser';

export const dynamic = 'force-dynamic';

export default async function LearnPage() {
  const sections = await getPublishedLearnSections();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-on-surface mb-4">Learn</h1>
        <p className="text-xl text-on-surface leading-relaxed">
          "Learn" is our library of content about complex trauma and CPTSD. We are slowly building
          India-focused articles and linking to high-quality international resources.
        </p>
      </div>

      {sections.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-8 text-center" style={{ boxShadow: 'var(--shadow-ambient)' }}>
          <p className="text-on-surface-variant">
            Learn sections are being set up. Check back soon!
          </p>
        </div>
      ) : (
        <LearnBrowser sections={sections} />
      )}
    </div>
  );
}
