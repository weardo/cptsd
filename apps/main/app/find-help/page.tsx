import { Metadata } from 'next';
import { getAllResources } from '@/lib/dataActions';
import { getAllMentalHealthProfessionals } from '@/lib/getAllMentalHealthProfessionals';
import { ResourceType } from '@cptsd/db';
import HeroSection from './HeroSection';
import CrisisSection from './CrisisSection';
import TherapistPreviewSection from './TherapistPreviewSection';
import GuidanceSection from './GuidanceSection';
import DirectoriesSection from './DirectoriesSection';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Find Help',
  description:
    'Find mental health support in India — crisis helplines, trauma-informed therapists, therapy directories, and organisations. A safe starting point for your healing journey.',
};

export default async function FindHelpPage() {
  const [resources, professionals] = await Promise.all([
    getAllResources(),
    getAllMentalHealthProfessionals({ featured: true, limit: 6 }),
  ]);

  const helplines = resources[ResourceType.HELPLINE] || [];
  const featuredHelplines = helplines.filter((h) => h.isFeatured || h.featured);
  const otherHelplines = helplines.filter((h) => !h.isFeatured && !h.featured);
  const therapyDirectories = resources[ResourceType.THERAPY_DIRECTORY] || [];
  const ngos = resources[ResourceType.NGO] || [];

  return (
    <div>
      <HeroSection />

      <section className="bg-surface py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CrisisSection
            featuredHelplines={featuredHelplines}
            otherHelplines={otherHelplines}
          />
        </div>
      </section>

      <TherapistPreviewSection professionals={professionals} />

      <GuidanceSection />

      <section className="bg-surface py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DirectoriesSection
            therapyDirectories={therapyDirectories}
            ngos={ngos}
          />
        </div>
      </section>
    </div>
  );
}
