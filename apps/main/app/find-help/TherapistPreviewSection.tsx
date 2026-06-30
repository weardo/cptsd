import Link from 'next/link';
import { MentalHealthProfessionalDoc } from '@/lib/getAllMentalHealthProfessionals';

interface TherapistPreviewSectionProps {
  professionals: MentalHealthProfessionalDoc[];
}

export default function TherapistPreviewSection({ professionals }: TherapistPreviewSectionProps) {
  const isEmpty = professionals.length === 0;

  return (
    <section className="bg-surface py-16">
      <h2 className="text-3xl font-bold text-on-surface mb-6">
        Mental health professionals
      </h2>

      <div className="bg-surface-container-high border-l-4 border-primary-container p-4 rounded-xl mb-8">
        <p className="text-sm text-on-surface leading-relaxed">
          We cannot vet individual therapists. These listings are maintained by the professionals
          themselves.
        </p>
      </div>

      {isEmpty ? (
        <div className="mb-8">
          <p className="text-on-surface-variant mb-4">No featured professionals yet.</p>
          <Link
            href="/mental-health-professionals"
            className="text-primary hover:text-primary-container font-medium"
          >
            Browse all professionals →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {professionals.map((p) => {
              const locationParts = [
                p.location?.city,
                p.location?.state ? p.location.state : undefined,
              ].filter(Boolean);
              const locationText =
                locationParts.length > 0
                  ? `${p.location?.city}${p.location?.state ? ', ' + p.location.state : ''}`
                  : null;
              const topSpecializations = p.specializations.slice(0, 3);

              return (
                <Link
                  key={p._id}
                  href={`/mental-health-professionals/${p.slug}`}
                  className="block bg-surface-container-lowest rounded-xl p-5 hover:bg-surface-variant transition-colors"
                  style={{ boxShadow: 'var(--shadow-ambient)' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-on-surface">{p.name}</h3>
                    {p.verified && (
                      <span className="shrink-0 text-xs font-medium text-primary bg-surface-container-high px-2 py-0.5 rounded">
                        Verified
                      </span>
                    )}
                  </div>

                  {p.designation && (
                    <p className="text-sm text-on-surface-variant mb-2">{p.designation}</p>
                  )}

                  {locationText && (
                    <p className="text-sm text-on-surface-variant mb-3">{locationText}</p>
                  )}

                  {topSpecializations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {topSpecializations.map((spec) => (
                        <span
                          key={spec}
                          className="px-2 py-1 rounded bg-surface-container-high text-xs text-on-surface-variant"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              href="/mental-health-professionals"
              className="inline-block bg-gradient-to-r from-primary to-primary-container text-white rounded-lg px-12 py-3 font-medium hover:opacity-90 transition-opacity"
            >
              Browse all professionals →
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
