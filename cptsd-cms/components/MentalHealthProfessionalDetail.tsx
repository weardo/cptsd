'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateMentalHealthProfessional } from '@/app/actions/mental-health-professionals';
import DeleteButton from './DeleteButton';
import MentalHealthProfessionalForm from './MentalHealthProfessionalForm';
import { ProfessionalType, ModeOfDelivery } from '@cptsd/db/client';

type Professional = {
  id: string;
  type: ProfessionalType;
  name: string;
  designation?: string | null;
  designationOther?: string | null;
  profilePicture?: string | null;
  about?: string | null;
  location: {
    city?: string;
    state?: string;
    country?: string;
    address?: string;
    pincode?: string;
  };
  qualification?: {
    degree?: string;
    institution?: string;
    year?: number;
    licenseNumber?: string;
    licenseIssuingAuthority?: string;
    certifications?: string[];
  } | null;
  contact: {
    phone?: string;
    helpline?: string;
    email?: string;
    website?: string;
    whatsapp?: string;
    emergency?: string;
  };
  modeOfDelivery: ModeOfDelivery;
  specializations: string[];
  specializationOther: string[];
  languages: string[];
  experienceYears?: number | null;
  ageGroups?: string[];
  sessionDuration?: number | null;
  sessionFee?: {
    amount?: number;
    currency?: string;
    notes?: string;
  } | null;
  insuranceAccepted?: boolean;
  insuranceProviders?: string[];
  availability?: {
    days?: string[];
    timeSlots?: string[];
    timezone?: string;
  } | null;
  organizationInfo?: {
    foundedYear?: number;
    registrationNumber?: string;
    services?: string[];
    targetAudience?: string[];
    funding?: string;
  } | null;
  featured: boolean;
  verified: boolean;
  status: string;
  tags: string[];
  notes?: string | null;
  metaDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MentalHealthProfessionalDetailProps = {
  professional: Professional;
};

export default function MentalHealthProfessionalDetail({
  professional,
}: MentalHealthProfessionalDetailProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div>
        <button
          onClick={() => setIsEditing(false)}
          className="btn btn-secondary mb-4"
        >
          ← Back to View
        </button>
        <MentalHealthProfessionalForm initialProfessional={professional} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          {professional.profilePicture ? (
            <img
              src={professional.profilePicture}
              alt={professional.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {professional.type.replace(/_/g, ' ')}
              </span>
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
              <span className="text-xs text-gray-500">{professional.status}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{professional.name}</h1>
            {professional.designation && (
              <p className="text-gray-600 mt-1">
                {professional.designation.replace(/_/g, ' ')}
                {professional.designationOther && ` - ${professional.designationOther}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(true)} className="btn btn-primary">
            Edit
          </button>
          <DeleteButton
            onDelete={async () => {
              const { deleteMentalHealthProfessional } = await import('@/app/actions/mental-health-professionals');
              return await deleteMentalHealthProfessional(professional.id);
            }}
            itemName="professional"
            redirectPath="/mental-health-professionals"
          />
        </div>
      </div>

      {/* About */}
      {professional.about && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{professional.about}</p>
        </div>
      )}

      {/* Location */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Location</h2>
        <div className="grid grid-cols-2 gap-4">
          {professional.location.city && (
            <div>
              <label className="text-sm font-medium text-gray-600">City</label>
              <p className="text-gray-900">{professional.location.city}</p>
            </div>
          )}
          {professional.location.state && (
            <div>
              <label className="text-sm font-medium text-gray-600">State</label>
              <p className="text-gray-900">{professional.location.state}</p>
            </div>
          )}
          {professional.location.country && (
            <div>
              <label className="text-sm font-medium text-gray-600">Country</label>
              <p className="text-gray-900">{professional.location.country}</p>
            </div>
          )}
          {professional.location.pincode && (
            <div>
              <label className="text-sm font-medium text-gray-600">Pincode</label>
              <p className="text-gray-900">{professional.location.pincode}</p>
            </div>
          )}
          {professional.location.address && (
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-600">Address</label>
              <p className="text-gray-900">{professional.location.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {professional.contact.phone && (
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <p className="text-gray-900">📞 {professional.contact.phone}</p>
            </div>
          )}
          {professional.contact.helpline && (
            <div>
              <label className="text-sm font-medium text-gray-600">Helpline</label>
              <p className="text-gray-900">🆘 {professional.contact.helpline}</p>
            </div>
          )}
          {professional.contact.email && (
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-900">
                <a href={`mailto:${professional.contact.email}`} className="text-blue-600 hover:underline">
                  {professional.contact.email}
                </a>
              </p>
            </div>
          )}
          {professional.contact.website && (
            <div>
              <label className="text-sm font-medium text-gray-600">Website</label>
              <p className="text-gray-900">
                <a
                  href={professional.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {professional.contact.website}
                </a>
              </p>
            </div>
          )}
          {professional.contact.whatsapp && (
            <div>
              <label className="text-sm font-medium text-gray-600">WhatsApp</label>
              <p className="text-gray-900">💬 {professional.contact.whatsapp}</p>
            </div>
          )}
          {professional.contact.emergency && (
            <div>
              <label className="text-sm font-medium text-gray-600">Emergency</label>
              <p className="text-gray-900">🚨 {professional.contact.emergency}</p>
            </div>
          )}
        </div>
      </div>

      {/* Qualification */}
      {professional.qualification && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Qualification</h2>
          <div className="space-y-2">
            {professional.qualification.degree && (
              <div>
                <label className="text-sm font-medium text-gray-600">Degree</label>
                <p className="text-gray-900">{professional.qualification.degree}</p>
              </div>
            )}
            {professional.qualification.institution && (
              <div>
                <label className="text-sm font-medium text-gray-600">Institution</label>
                <p className="text-gray-900">{professional.qualification.institution}</p>
              </div>
            )}
            {professional.qualification.year && (
              <div>
                <label className="text-sm font-medium text-gray-600">Year</label>
                <p className="text-gray-900">{professional.qualification.year}</p>
              </div>
            )}
            {professional.qualification.licenseNumber && (
              <div>
                <label className="text-sm font-medium text-gray-600">License Number</label>
                <p className="text-gray-900">{professional.qualification.licenseNumber}</p>
              </div>
            )}
            {professional.qualification.licenseIssuingAuthority && (
              <div>
                <label className="text-sm font-medium text-gray-600">License Issuing Authority</label>
                <p className="text-gray-900">{professional.qualification.licenseIssuingAuthority}</p>
              </div>
            )}
            {professional.qualification.certifications && professional.qualification.certifications.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Certifications</label>
                <p className="text-gray-900">{professional.qualification.certifications.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Services</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Mode of Delivery</label>
            <p className="text-gray-900">{professional.modeOfDelivery.replace(/_/g, ' ')}</p>
          </div>
          {professional.experienceYears && (
            <div>
              <label className="text-sm font-medium text-gray-600">Years of Experience</label>
              <p className="text-gray-900">{professional.experienceYears}</p>
            </div>
          )}
          {professional.sessionDuration && (
            <div>
              <label className="text-sm font-medium text-gray-600">Session Duration</label>
              <p className="text-gray-900">{professional.sessionDuration} minutes</p>
            </div>
          )}
        </div>
        {professional.specializations.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-600">Specializations</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {professional.specializations.map((spec, idx) => (
                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {spec.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
        {professional.specializationOther.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-600">Other Specializations</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {professional.specializationOther.map((spec, idx) => (
                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}
        {professional.languages.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-600">Languages</label>
            <p className="text-gray-900">{professional.languages.join(', ')}</p>
          </div>
        )}
        {professional.ageGroups && professional.ageGroups.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-600">Age Groups</label>
            <p className="text-gray-900">{professional.ageGroups.join(', ')}</p>
          </div>
        )}
      </div>

      {/* Session Fee */}
      {professional.sessionFee && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Session Fee</h2>
          <div className="grid grid-cols-2 gap-4">
            {professional.sessionFee.amount && (
              <div>
                <label className="text-sm font-medium text-gray-600">Amount</label>
                <p className="text-gray-900">
                  {professional.sessionFee.currency || 'INR'} {professional.sessionFee.amount}
                </p>
              </div>
            )}
            {professional.sessionFee.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notes</label>
                <p className="text-gray-900">{professional.sessionFee.notes}</p>
              </div>
            )}
            {professional.insuranceAccepted && (
              <div>
                <label className="text-sm font-medium text-gray-600">Insurance Accepted</label>
                <p className="text-gray-900">Yes</p>
              </div>
            )}
            {professional.insuranceProviders && professional.insuranceProviders.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Insurance Providers</label>
                <p className="text-gray-900">{professional.insuranceProviders.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Availability */}
      {professional.availability && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Availability</h2>
          <div className="grid grid-cols-2 gap-4">
            {professional.availability.days && professional.availability.days.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Days</label>
                <p className="text-gray-900">{professional.availability.days.join(', ')}</p>
              </div>
            )}
            {professional.availability.timeSlots && professional.availability.timeSlots.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Time Slots</label>
                <p className="text-gray-900">{professional.availability.timeSlots.join(', ')}</p>
              </div>
            )}
            {professional.availability.timezone && (
              <div>
                <label className="text-sm font-medium text-gray-600">Timezone</label>
                <p className="text-gray-900">{professional.availability.timezone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Organization Info */}
      {professional.organizationInfo && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Organization Information</h2>
          <div className="grid grid-cols-2 gap-4">
            {professional.organizationInfo.foundedYear && (
              <div>
                <label className="text-sm font-medium text-gray-600">Founded Year</label>
                <p className="text-gray-900">{professional.organizationInfo.foundedYear}</p>
              </div>
            )}
            {professional.organizationInfo.registrationNumber && (
              <div>
                <label className="text-sm font-medium text-gray-600">Registration Number</label>
                <p className="text-gray-900">{professional.organizationInfo.registrationNumber}</p>
              </div>
            )}
            {professional.organizationInfo.services && professional.organizationInfo.services.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Services</label>
                <p className="text-gray-900">{professional.organizationInfo.services.join(', ')}</p>
              </div>
            )}
            {professional.organizationInfo.targetAudience && professional.organizationInfo.targetAudience.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Target Audience</label>
                <p className="text-gray-900">{professional.organizationInfo.targetAudience.join(', ')}</p>
              </div>
            )}
            {professional.organizationInfo.funding && (
              <div>
                <label className="text-sm font-medium text-gray-600">Funding</label>
                <p className="text-gray-900">{professional.organizationInfo.funding}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {professional.tags.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {professional.tags.map((tag, idx) => (
              <span key={idx} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Admin Notes */}
      {professional.notes && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Admin Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{professional.notes}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-sm text-gray-500">
        Created: {new Date(professional.createdAt).toLocaleString()} | Updated:{' '}
        {new Date(professional.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}

