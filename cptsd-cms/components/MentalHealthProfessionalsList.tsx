'use client';

import Link from 'next/link';
import { ProfessionalType, Designation, ModeOfDelivery, Specialization } from '@cptsd/db/client';

type Professional = {
  id: string;
  type: ProfessionalType;
  name: string;
  designation?: string | null;
  profilePicture?: string | null;
  about?: string | null;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  contact: {
    phone?: string;
    helpline?: string;
    email?: string;
    website?: string;
  };
  modeOfDelivery: ModeOfDelivery;
  specializations: string[];
  languages: string[];
  featured: boolean;
  verified: boolean;
  status: string;
  tags: string[];
};

type MentalHealthProfessionalsListProps = {
  professionals: Professional[];
  initialFilters?: Record<string, string>;
};

export default function MentalHealthProfessionalsList({
  professionals,
  initialFilters,
}: MentalHealthProfessionalsListProps) {
  const getTypeColor = (type: ProfessionalType) => {
    switch (type) {
      case ProfessionalType.INDIVIDUAL:
        return 'bg-blue-100 text-blue-800';
      case ProfessionalType.NGO:
        return 'bg-green-100 text-green-800';
      case ProfessionalType.CLINIC:
        return 'bg-purple-100 text-purple-800';
      case ProfessionalType.HOSPITAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <select
            defaultValue={initialFilters?.type || ''}
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              if (e.target.value) {
                params.set('type', e.target.value);
              } else {
                params.delete('type');
              }
              window.location.search = params.toString();
            }}
            className="input text-sm"
          >
            <option value="">All Types</option>
            {Object.values(ProfessionalType).map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            defaultValue={initialFilters?.designation || ''}
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              if (e.target.value) {
                params.set('designation', e.target.value);
              } else {
                params.delete('designation');
              }
              window.location.search = params.toString();
            }}
            className="input text-sm"
          >
            <option value="">All Designations</option>
            {Object.values(Designation).map((designation) => (
              <option key={designation} value={designation}>
                {designation.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            defaultValue={initialFilters?.modeOfDelivery || ''}
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              if (e.target.value) {
                params.set('modeOfDelivery', e.target.value);
              } else {
                params.delete('modeOfDelivery');
              }
              window.location.search = params.toString();
            }}
            className="input text-sm"
          >
            <option value="">All Modes</option>
            {Object.values(ModeOfDelivery).map((mode) => (
              <option key={mode} value={mode}>
                {mode.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="City..."
            defaultValue={initialFilters?.city || ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const params = new URLSearchParams(window.location.search);
                const value = (e.target as HTMLInputElement).value;
                if (value) {
                  params.set('city', value);
                } else {
                  params.delete('city');
                }
                window.location.search = params.toString();
              }
            }}
            className="input text-sm"
          />

          <input
            type="text"
            placeholder="State..."
            defaultValue={initialFilters?.state || ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const params = new URLSearchParams(window.location.search);
                const value = (e.target as HTMLInputElement).value;
                if (value) {
                  params.set('state', value);
                } else {
                  params.delete('state');
                }
                window.location.search = params.toString();
              }
            }}
            className="input text-sm"
          />

          <select
            defaultValue={initialFilters?.status || ''}
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              if (e.target.value) {
                params.set('status', e.target.value);
              } else {
                params.delete('status');
              }
              window.location.search = params.toString();
            }}
            className="input text-sm"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <input
            type="text"
            placeholder="Search professionals..."
            defaultValue={initialFilters?.search || ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const params = new URLSearchParams(window.location.search);
                const value = (e.target as HTMLInputElement).value;
                if (value) {
                  params.set('search', value);
                } else {
                  params.delete('search');
                }
                window.location.search = params.toString();
              }
            }}
            className="input text-sm flex-1"
          />
        </div>
      </div>

      {/* Professionals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.map((professional) => (
          <Link
            key={professional.id}
            href={`/mental-health-professionals/${professional.id}`}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                {professional.profilePicture ? (
                  <img
                    src={professional.profilePicture}
                    alt={professional.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{professional.name}</h3>
                  {professional.designation && (
                    <p className="text-sm text-gray-600">
                      {professional.designation.replace(/_/g, ' ')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {professional.featured && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                  {professional.verified && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      ✓ Verified
                    </span>
                  )}
                  {professional.status !== 'ACTIVE' && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        professional.status === 'DRAFT'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}
                    >
                      {professional.status}
                    </span>
                  )}
                </div>
              </div>

              {professional.about && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{professional.about}</p>
              )}

              <div className="space-y-2 mb-3">
                {professional.location.city && (
                  <div className="text-xs text-gray-600">
                    📍 {professional.location.city}
                    {professional.location.state && `, ${professional.location.state}`}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${getTypeColor(professional.type)}`}
                  >
                    {professional.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {professional.modeOfDelivery.replace(/_/g, ' ')}
                  </span>
                </div>

                {professional.languages.length > 0 && (
                  <div className="text-xs text-gray-600">
                    Languages: {professional.languages.join(', ')}
                  </div>
                )}

                {professional.contact.phone && (
                  <div className="text-xs text-gray-600">📞 {professional.contact.phone}</div>
                )}
                {professional.contact.helpline && (
                  <div className="text-xs text-gray-600">🆘 {professional.contact.helpline}</div>
                )}
              </div>

              {professional.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {professional.specializations.slice(0, 3).map((spec, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {spec.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {professional.specializations.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{professional.specializations.length - 3}
                    </span>
                  )}
                </div>
              )}

              {professional.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {professional.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

