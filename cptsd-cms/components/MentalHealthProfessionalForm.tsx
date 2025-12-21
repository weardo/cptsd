'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createMentalHealthProfessional, updateMentalHealthProfessional } from '@/app/actions/mental-health-professionals';
import { uploadProfilePicture } from '@/app/actions/uploads';
import { ProfessionalType, Designation, ModeOfDelivery, Specialization } from '@cptsd/db/client';

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
  ageGroups?: string[] | null;
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
};

type MentalHealthProfessionalFormProps = {
  initialProfessional?: Professional | null;
};

export default function MentalHealthProfessionalForm({ initialProfessional }: MentalHealthProfessionalFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>(initialProfessional?.profilePicture || '');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<ProfessionalType>(initialProfessional?.type || ProfessionalType.INDIVIDUAL);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadProfilePicture(formData);

      if (result.success && result.url) {
        setProfilePictureUrl(result.url);
        // Update the hidden input field
        if (fileInputRef.current) {
          const hiddenInput = document.getElementById('profilePicture') as HTMLInputElement;
          if (hiddenInput) {
            hiddenInput.value = result.url;
          }
        }
      } else {
        setError(result.error || 'Failed to upload profile picture');
      }
    } catch (err) {
      setError('An error occurred while uploading the file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = initialProfessional
        ? await updateMentalHealthProfessional(initialProfessional.id, formData)
        : await createMentalHealthProfessional(formData);

      if (result.success && result.professional) {
        router.push(`/mental-health-professionals/${result.professional.id}`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to save professional');
      }
    });
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Basic Information Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-2">
                Type *
              </label>
              <select
                id="type"
                name="type"
                required
                value={type}
                onChange={(e) => setType(e.target.value as ProfessionalType)}
                className="input w-full"
              >
                {Object.values(ProfessionalType).map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name / Organization Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={initialProfessional?.name || ''}
                className="input w-full"
              />
            </div>

            {type === ProfessionalType.INDIVIDUAL && (
              <>
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium mb-2">
                    Designation
                  </label>
                  <select
                    id="designation"
                    name="designation"
                    defaultValue={initialProfessional?.designation || ''}
                    className="input w-full"
                  >
                    <option value="">Select designation</option>
                    {Object.values(Designation).map((d) => (
                      <option key={d} value={d}>
                        {d.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="designationOther" className="block text-sm font-medium mb-2">
                    Custom Designation (if Other)
                  </label>
                  <input
                    type="text"
                    id="designationOther"
                    name="designationOther"
                    defaultValue={initialProfessional?.designationOther || ''}
                    className="input w-full"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Profile Picture
              </label>
              <input
                type="hidden"
                id="profilePicture"
                name="profilePicture"
                value={profilePictureUrl}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              
              {profilePictureUrl ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={profilePictureUrl}
                      alt="Profile picture"
                      className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="btn btn-secondary text-sm"
                    >
                      {uploading ? 'Uploading...' : 'Change Picture'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePictureUrl('');
                        const hiddenInput = document.getElementById('profilePicture') as HTMLInputElement;
                        if (hiddenInput) {
                          hiddenInput.value = '';
                        }
                      }}
                      disabled={uploading}
                      className="btn btn-secondary text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Or enter URL manually:
                    </p>
                    <input
                      type="url"
                      value={profilePictureUrl}
                      onChange={(e) => {
                        setProfilePictureUrl(e.target.value);
                        const hiddenInput = document.getElementById('profilePicture') as HTMLInputElement;
                        if (hiddenInput) {
                          hiddenInput.value = e.target.value;
                        }
                      }}
                      className="input w-full text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <p className="text-gray-500">Uploading...</p>
                    ) : (
                      <>
                        <p className="text-gray-600 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, GIF, WEBP up to 5MB
                        </p>
                      </>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Or enter image URL:
                    </p>
                    <input
                      type="url"
                      value={profilePictureUrl}
                      onChange={(e) => {
                        setProfilePictureUrl(e.target.value);
                        const hiddenInput = document.getElementById('profilePicture') as HTMLInputElement;
                        if (hiddenInput) {
                          hiddenInput.value = e.target.value;
                        }
                      }}
                      className="input w-full text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="about" className="block text-sm font-medium mb-2">
                About / Bio
              </label>
              <textarea
                id="about"
                name="about"
                rows={6}
                defaultValue={initialProfessional?.about || ''}
                className="input w-full"
                placeholder="About the professional or organization..."
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Location</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="location.city" className="block text-sm font-medium mb-2">
                City
              </label>
              <input
                type="text"
                id="location.city"
                name="location.city"
                defaultValue={initialProfessional?.location?.city || ''}
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="location.state" className="block text-sm font-medium mb-2">
                State
              </label>
              <input
                type="text"
                id="location.state"
                name="location.state"
                defaultValue={initialProfessional?.location?.state || ''}
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="location.country" className="block text-sm font-medium mb-2">
                Country
              </label>
              <input
                type="text"
                id="location.country"
                name="location.country"
                defaultValue={initialProfessional?.location?.country || 'India'}
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="location.pincode" className="block text-sm font-medium mb-2">
                Pincode
              </label>
              <input
                type="text"
                id="location.pincode"
                name="location.pincode"
                defaultValue={initialProfessional?.location?.pincode || ''}
                className="input w-full"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="location.address" className="block text-sm font-medium mb-2">
              Full Address
            </label>
            <textarea
              id="location.address"
              name="location.address"
              rows={2}
              defaultValue={initialProfessional?.location?.address || ''}
              className="input w-full"
            />
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact.phone" className="block text-sm font-medium mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="contact.phone"
                name="contact.phone"
                defaultValue={initialProfessional?.contact?.phone || ''}
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="contact.helpline" className="block text-sm font-medium mb-2">
                Helpline Number
              </label>
              <input
                type="tel"
                id="contact.helpline"
                name="contact.helpline"
                defaultValue={initialProfessional?.contact?.helpline || ''}
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="contact.email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="contact.email"
                name="contact.email"
                defaultValue={initialProfessional?.contact?.email || ''}
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="contact.website" className="block text-sm font-medium mb-2">
                Website
              </label>
              <input
                type="url"
                id="contact.website"
                name="contact.website"
                defaultValue={initialProfessional?.contact?.website || ''}
                className="input w-full"
                placeholder="https://..."
              />
            </div>

            <div>
              <label htmlFor="contact.whatsapp" className="block text-sm font-medium mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                id="contact.whatsapp"
                name="contact.whatsapp"
                defaultValue={initialProfessional?.contact?.whatsapp || ''}
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="contact.emergency" className="block text-sm font-medium mb-2">
                Emergency Contact
              </label>
              <input
                type="tel"
                id="contact.emergency"
                name="contact.emergency"
                defaultValue={initialProfessional?.contact?.emergency || ''}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* Qualification Section (for individuals) */}
        {type === ProfessionalType.INDIVIDUAL && (
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Qualification</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="qualification.degree" className="block text-sm font-medium mb-2">
                  Degree / Qualification *
                </label>
                <input
                  type="text"
                  id="qualification.degree"
                  name="qualification.degree"
                  defaultValue={initialProfessional?.qualification?.degree || ''}
                  className="input w-full"
                  placeholder="e.g., M.A in Applied Psychology (Counselling Psychology)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="qualification.institution" className="block text-sm font-medium mb-2">
                    Institution
                  </label>
                  <input
                    type="text"
                    id="qualification.institution"
                    name="qualification.institution"
                    defaultValue={initialProfessional?.qualification?.institution || ''}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label htmlFor="qualification.year" className="block text-sm font-medium mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    id="qualification.year"
                    name="qualification.year"
                    defaultValue={initialProfessional?.qualification?.year || ''}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="qualification.licenseNumber" className="block text-sm font-medium mb-2">
                    License Number
                  </label>
                  <input
                    type="text"
                    id="qualification.licenseNumber"
                    name="qualification.licenseNumber"
                    defaultValue={initialProfessional?.qualification?.licenseNumber || ''}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label htmlFor="qualification.licenseIssuingAuthority" className="block text-sm font-medium mb-2">
                    License Issuing Authority
                  </label>
                  <input
                    type="text"
                    id="qualification.licenseIssuingAuthority"
                    name="qualification.licenseIssuingAuthority"
                    defaultValue={initialProfessional?.qualification?.licenseIssuingAuthority || ''}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="qualification.certifications" className="block text-sm font-medium mb-2">
                  Additional Certifications (comma-separated)
                </label>
                <input
                  type="text"
                  id="qualification.certifications"
                  name="qualification.certifications"
                  defaultValue={initialProfessional?.qualification?.certifications?.join(', ') || ''}
                  className="input w-full"
                  placeholder="Certification 1, Certification 2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Services Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="modeOfDelivery" className="block text-sm font-medium mb-2">
                Mode of Delivery *
              </label>
              <select
                id="modeOfDelivery"
                name="modeOfDelivery"
                required
                defaultValue={initialProfessional?.modeOfDelivery || ''}
                className="input w-full"
              >
                {Object.values(ModeOfDelivery).map((mode) => (
                  <option key={mode} value={mode}>
                    {mode.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="specializations" className="block text-sm font-medium mb-2">
                Specializations (comma-separated or select multiple)
              </label>
              <select
                id="specializations"
                name="specializations"
                multiple
                className="input w-full"
                size={10}
                defaultValue={initialProfessional?.specializations || []}
              >
                {Object.values(Specialization).map((spec) => (
                  <option key={spec} value={spec}>
                    {spec.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              <p className="text-xs text-gray-500 mt-1">
                Or enter comma-separated values: {Object.values(Specialization).slice(0, 3).join(', ')}...
              </p>
            </div>

            <div>
              <label htmlFor="specializationOther" className="block text-sm font-medium mb-2">
                Other Specializations (comma-separated)
              </label>
              <input
                type="text"
                id="specializationOther"
                name="specializationOther"
                defaultValue={initialProfessional?.specializationOther?.join(', ') || ''}
                className="input w-full"
                placeholder="Custom specialization 1, Custom specialization 2"
              />
            </div>

            <div>
              <label htmlFor="languages" className="block text-sm font-medium mb-2">
                Languages (comma-separated) *
              </label>
              <input
                type="text"
                id="languages"
                name="languages"
                required
                defaultValue={initialProfessional?.languages?.join(', ') || ''}
                className="input w-full"
                placeholder="English, Hindi, Marathi"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="experienceYears" className="block text-sm font-medium mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  id="experienceYears"
                  name="experienceYears"
                  min="0"
                  defaultValue={initialProfessional?.experienceYears || ''}
                  className="input w-full"
                />
              </div>

              <div>
                <label htmlFor="sessionDuration" className="block text-sm font-medium mb-2">
                  Session Duration (minutes)
                </label>
                <input
                  type="number"
                  id="sessionDuration"
                  name="sessionDuration"
                  min="15"
                  step="15"
                  defaultValue={initialProfessional?.sessionDuration || ''}
                  className="input w-full"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ageGroups" className="block text-sm font-medium mb-2">
                Age Groups Served (comma-separated)
              </label>
              <input
                type="text"
                id="ageGroups"
                name="ageGroups"
                defaultValue={initialProfessional?.ageGroups?.join(', ') || ''}
                className="input w-full"
                placeholder="Children, Adolescents, Adults, Elderly"
              />
            </div>
          </div>
        </div>

        {/* Session Fee Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Session Fee</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="sessionFee.amount" className="block text-sm font-medium mb-2">
                Amount
              </label>
              <input
                type="number"
                id="sessionFee.amount"
                name="sessionFee.amount"
                min="0"
                step="0.01"
                defaultValue={initialProfessional?.sessionFee?.amount || ''}
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="sessionFee.currency" className="block text-sm font-medium mb-2">
                Currency
              </label>
              <input
                type="text"
                id="sessionFee.currency"
                name="sessionFee.currency"
                defaultValue={initialProfessional?.sessionFee?.currency || 'INR'}
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="sessionFee.notes" className="block text-sm font-medium mb-2">
                Notes
              </label>
              <input
                type="text"
                id="sessionFee.notes"
                name="sessionFee.notes"
                defaultValue={initialProfessional?.sessionFee?.notes || ''}
                className="input w-full"
                placeholder="e.g., Sliding scale available"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="insuranceAccepted"
                value="true"
                defaultChecked={initialProfessional?.insuranceAccepted || false}
                className="mr-2"
              />
              <span className="text-sm font-medium">Insurance Accepted</span>
            </label>
          </div>

          <div className="mt-4">
            <label htmlFor="insuranceProviders" className="block text-sm font-medium mb-2">
              Insurance Providers (comma-separated)
            </label>
            <input
              type="text"
              id="insuranceProviders"
              name="insuranceProviders"
              defaultValue={initialProfessional?.insuranceProviders?.join(', ') || ''}
              className="input w-full"
            />
          </div>
        </div>

        {/* Availability Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Availability</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="availability.days" className="block text-sm font-medium mb-2">
                Days Available (comma-separated)
              </label>
              <input
                type="text"
                id="availability.days"
                name="availability.days"
                defaultValue={initialProfessional?.availability?.days?.join(', ') || ''}
                className="input w-full"
                placeholder="Monday, Wednesday, Friday"
              />
            </div>

            <div>
              <label htmlFor="availability.timeSlots" className="block text-sm font-medium mb-2">
                Time Slots (comma-separated)
              </label>
              <input
                type="text"
                id="availability.timeSlots"
                name="availability.timeSlots"
                defaultValue={initialProfessional?.availability?.timeSlots?.join(', ') || ''}
                className="input w-full"
                placeholder="Morning, Afternoon, Evening"
              />
            </div>

            <div>
              <label htmlFor="availability.timezone" className="block text-sm font-medium mb-2">
                Timezone
              </label>
              <input
                type="text"
                id="availability.timezone"
                name="availability.timezone"
                defaultValue={initialProfessional?.availability?.timezone || ''}
                className="input w-full"
                placeholder="IST"
              />
            </div>
          </div>
        </div>

        {/* Organization Info Section (for NGOs) */}
        {type === ProfessionalType.NGO && (
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Organization Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="organizationInfo.foundedYear" className="block text-sm font-medium mb-2">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    id="organizationInfo.foundedYear"
                    name="organizationInfo.foundedYear"
                    min="1900"
                    max={new Date().getFullYear()}
                    defaultValue={initialProfessional?.organizationInfo?.foundedYear || ''}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label htmlFor="organizationInfo.registrationNumber" className="block text-sm font-medium mb-2">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    id="organizationInfo.registrationNumber"
                    name="organizationInfo.registrationNumber"
                    defaultValue={initialProfessional?.organizationInfo?.registrationNumber || ''}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="organizationInfo.services" className="block text-sm font-medium mb-2">
                  Services Offered (comma-separated)
                </label>
                <input
                  type="text"
                  id="organizationInfo.services"
                  name="organizationInfo.services"
                  defaultValue={initialProfessional?.organizationInfo?.services?.join(', ') || ''}
                  className="input w-full"
                />
              </div>

              <div>
                <label htmlFor="organizationInfo.targetAudience" className="block text-sm font-medium mb-2">
                  Target Audience (comma-separated)
                </label>
                <input
                  type="text"
                  id="organizationInfo.targetAudience"
                  name="organizationInfo.targetAudience"
                  defaultValue={initialProfessional?.organizationInfo?.targetAudience?.join(', ') || ''}
                  className="input w-full"
                />
              </div>

              <div>
                <label htmlFor="organizationInfo.funding" className="block text-sm font-medium mb-2">
                  Funding Source
                </label>
                <input
                  type="text"
                  id="organizationInfo.funding"
                  name="organizationInfo.funding"
                  defaultValue={initialProfessional?.organizationInfo?.funding || ''}
                  className="input w-full"
                  placeholder="Government, Private, Donations"
                />
              </div>
            </div>
          </div>
        )}

        {/* Metadata Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Metadata</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                defaultValue={initialProfessional?.tags?.join(', ') || ''}
                className="input w-full"
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div>
              <label htmlFor="metaDescription" className="block text-sm font-medium mb-2">
                Meta Description (for SEO)
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                rows={2}
                defaultValue={initialProfessional?.metaDescription || ''}
                className="input w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={initialProfessional?.status || 'ACTIVE'}
                  className="input w-full"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  value="true"
                  defaultChecked={initialProfessional?.featured || false}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Featured</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="verified"
                  value="true"
                  defaultChecked={initialProfessional?.verified || false}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Verified (credentials checked)</span>
              </label>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Admin Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={initialProfessional?.notes || ''}
                className="input w-full"
                placeholder="Internal notes about this professional..."
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button type="submit" disabled={isPending} className="btn btn-primary">
            {isPending ? 'Saving...' : initialProfessional ? 'Update Professional' : 'Create Professional'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
            disabled={isPending}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

