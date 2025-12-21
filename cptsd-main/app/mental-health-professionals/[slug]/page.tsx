import { getMentalHealthProfessionalBySlug } from '@/lib/getAllMentalHealthProfessionals';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

interface ProfessionalPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({
	params,
}: ProfessionalPageProps): Promise<Metadata> {
	const { slug } = await params;
	const professional = await getMentalHealthProfessionalBySlug(slug);

	if (!professional) {
		return {
			title: 'Professional Not Found',
		};
	}

	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cptsd.in';
	const url = `${siteUrl}/mental-health-professionals/${slug}`;

	return {
		title: `${professional.name} - Mental Health Professional | CPTSD.in`,
		description: professional.about || professional.metaDescription || `Mental health professional ${professional.name}`,
		openGraph: {
			title: `${professional.name} - Mental Health Professional`,
			description: professional.about || professional.metaDescription || '',
			url,
			type: 'profile',
		},
	};
}

export default async function MentalHealthProfessionalPage({
	params,
}: ProfessionalPageProps) {
	const { slug } = await params;
	const professional = await getMentalHealthProfessionalBySlug(slug);

	if (!professional) {
		notFound();
	}

	return (
		<main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
			<article className="space-y-8">
				{/* Header */}
				<header className="flex items-start gap-6">
					{professional.profilePicture ? (
						<img
							src={professional.profilePicture}
							alt={professional.name}
							className="w-32 h-32 rounded-full object-cover flex-shrink-0"
						/>
					) : (
						<div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
							<span className="text-5xl">👤</span>
						</div>
					)}
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-2">
							<span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
								{professional.type.replace(/_/g, ' ')}
							</span>
							{professional.featured && (
								<span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
									Featured
								</span>
							)}
							{professional.verified && (
								<span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
									✓ Verified
								</span>
							)}
						</div>
						<h1 className="text-4xl font-bold text-gray-900 mb-2">{professional.name}</h1>
						{professional.designation && (
							<p className="text-lg text-gray-600">
								{professional.designation.replace(/_/g, ' ')}
								{professional.designationOther && ` - ${professional.designationOther}`}
							</p>
						)}
					</div>
				</header>

				{/* About */}
				{professional.about && (
					<section>
						<h2 className="text-2xl font-semibold text-gray-900 mb-3">About</h2>
						<div className="prose max-w-none">
							<p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{professional.about}</p>
						</div>
					</section>
				)}

				{/* Qualification */}
				{professional.qualification && (
					<section className="bg-gray-50 rounded-lg p-6">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">Qualification</h2>
						<div className="space-y-3">
							{professional.qualification.degree && (
								<div>
									<strong className="text-gray-900">Degree:</strong>{' '}
									<span className="text-gray-700">{professional.qualification.degree}</span>
								</div>
							)}
							{professional.qualification.institution && (
								<div>
									<strong className="text-gray-900">Institution:</strong>{' '}
									<span className="text-gray-700">{professional.qualification.institution}</span>
								</div>
							)}
							{professional.qualification.year && (
								<div>
									<strong className="text-gray-900">Year:</strong>{' '}
									<span className="text-gray-700">{professional.qualification.year}</span>
								</div>
							)}
							{professional.qualification.licenseNumber && (
								<div>
									<strong className="text-gray-900">License Number:</strong>{' '}
									<span className="text-gray-700">{professional.qualification.licenseNumber}</span>
								</div>
							)}
							{professional.qualification.licenseIssuingAuthority && (
								<div>
									<strong className="text-gray-900">License Issuing Authority:</strong>{' '}
									<span className="text-gray-700">
										{professional.qualification.licenseIssuingAuthority}
									</span>
								</div>
							)}
							{professional.qualification.certifications &&
								professional.qualification.certifications.length > 0 && (
									<div>
										<strong className="text-gray-900">Certifications:</strong>{' '}
										<span className="text-gray-700">
											{professional.qualification.certifications.join(', ')}
										</span>
									</div>
								)}
						</div>
					</section>
				)}

				{/* Location */}
				{professional.location && (
					<section>
						<h2 className="text-2xl font-semibold text-gray-900 mb-3">Location</h2>
						<div className="bg-white border border-gray-200 rounded-lg p-6">
							<div className="space-y-2">
								{professional.location.address && (
									<p className="text-gray-700">{professional.location.address}</p>
								)}
								<p className="text-gray-700">
									{professional.location.city}
									{professional.location.state && `, ${professional.location.state}`}
									{professional.location.pincode && ` - ${professional.location.pincode}`}
								</p>
								{professional.location.country && (
									<p className="text-gray-700">{professional.location.country}</p>
								)}
							</div>
						</div>
					</section>
				)}

				{/* Contact Information */}
				<section>
					<h2 className="text-2xl font-semibold text-gray-900 mb-3">Contact Information</h2>
					<div className="bg-white border border-gray-200 rounded-lg p-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{professional.contact.phone && (
								<div>
									<strong className="text-gray-900 block mb-1">Phone:</strong>
									<a
										href={`tel:${professional.contact.phone}`}
										className="text-blue-600 hover:text-blue-700"
									>
										📞 {professional.contact.phone}
									</a>
								</div>
							)}
							{professional.contact.helpline && (
								<div>
									<strong className="text-gray-900 block mb-1">Helpline:</strong>
									<a
										href={`tel:${professional.contact.helpline}`}
										className="text-blue-600 hover:text-blue-700"
									>
										🆘 {professional.contact.helpline}
									</a>
								</div>
							)}
							{professional.contact.email && (
								<div>
									<strong className="text-gray-900 block mb-1">Email:</strong>
									<a
										href={`mailto:${professional.contact.email}`}
										className="text-blue-600 hover:text-blue-700"
									>
										{professional.contact.email}
									</a>
								</div>
							)}
							{professional.contact.website && (
								<div>
									<strong className="text-gray-900 block mb-1">Website:</strong>
									<a
										href={professional.contact.website}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:text-blue-700"
									>
										Visit website →
									</a>
								</div>
							)}
							{professional.contact.whatsapp && (
								<div>
									<strong className="text-gray-900 block mb-1">WhatsApp:</strong>
									<a
										href={`https://wa.me/${professional.contact.whatsapp.replace(/[^0-9]/g, '')}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:text-blue-700"
									>
										💬 {professional.contact.whatsapp}
									</a>
								</div>
							)}
							{professional.contact.emergency && (
								<div>
									<strong className="text-gray-900 block mb-1">Emergency:</strong>
									<a
										href={`tel:${professional.contact.emergency}`}
										className="text-red-600 hover:text-red-700"
									>
										🚨 {professional.contact.emergency}
									</a>
								</div>
							)}
						</div>
					</div>
				</section>

				{/* Services */}
				<section>
					<h2 className="text-2xl font-semibold text-gray-900 mb-3">Services</h2>
					<div className="bg-white border border-gray-200 rounded-lg p-6">
						<div className="space-y-4">
							<div>
								<strong className="text-gray-900">Mode of Delivery:</strong>{' '}
								<span className="text-gray-700">
									{professional.modeOfDelivery.replace(/_/g, ' ')}
								</span>
							</div>

							{professional.experienceYears && (
								<div>
									<strong className="text-gray-900">Years of Experience:</strong>{' '}
									<span className="text-gray-700">{professional.experienceYears}</span>
								</div>
							)}

							{professional.sessionDuration && (
								<div>
									<strong className="text-gray-900">Session Duration:</strong>{' '}
									<span className="text-gray-700">{professional.sessionDuration} minutes</span>
								</div>
							)}

							{professional.languages && professional.languages.length > 0 && (
								<div>
									<strong className="text-gray-900">Languages:</strong>{' '}
									<span className="text-gray-700">{professional.languages.join(', ')}</span>
								</div>
							)}

							{professional.ageGroups && professional.ageGroups.length > 0 && (
								<div>
									<strong className="text-gray-900">Age Groups:</strong>{' '}
									<span className="text-gray-700">{professional.ageGroups.join(', ')}</span>
								</div>
							)}

							{professional.specializations && professional.specializations.length > 0 && (
								<div>
									<strong className="text-gray-900 block mb-2">Specializations:</strong>
									<div className="flex flex-wrap gap-2">
										{professional.specializations.map((spec, idx) => (
											<span
												key={idx}
												className="inline-flex items-center rounded px-2 py-1 text-sm bg-gray-100 text-gray-700"
											>
												{spec.replace(/_/g, ' ')}
											</span>
										))}
									</div>
								</div>
							)}

							{professional.specializationOther && professional.specializationOther.length > 0 && (
								<div>
									<strong className="text-gray-900 block mb-2">Other Specializations:</strong>
									<div className="flex flex-wrap gap-2">
										{professional.specializationOther.map((spec, idx) => (
											<span
												key={idx}
												className="inline-flex items-center rounded px-2 py-1 text-sm bg-gray-100 text-gray-700"
											>
												{spec}
											</span>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</section>

				{/* Session Fee */}
				{professional.sessionFee && (
					<section>
						<h2 className="text-2xl font-semibold text-gray-900 mb-3">Session Fee</h2>
						<div className="bg-white border border-gray-200 rounded-lg p-6">
							<div className="space-y-2">
								{professional.sessionFee.amount && (
									<div>
										<strong className="text-gray-900">Fee:</strong>{' '}
										<span className="text-gray-700">
											{professional.sessionFee.currency || 'INR'} {professional.sessionFee.amount}
										</span>
									</div>
								)}
								{professional.sessionFee.notes && (
									<div>
										<strong className="text-gray-900">Notes:</strong>{' '}
										<span className="text-gray-700">{professional.sessionFee.notes}</span>
									</div>
								)}
								{professional.insuranceAccepted && (
									<div>
										<strong className="text-gray-900">Insurance Accepted:</strong>{' '}
										<span className="text-gray-700">Yes</span>
									</div>
								)}
								{professional.insuranceProviders && professional.insuranceProviders.length > 0 && (
									<div>
										<strong className="text-gray-900">Insurance Providers:</strong>{' '}
										<span className="text-gray-700">
											{professional.insuranceProviders.join(', ')}
										</span>
									</div>
								)}
							</div>
						</div>
					</section>
				)}

				{/* Availability */}
				{professional.availability && (
					<section>
						<h2 className="text-2xl font-semibold text-gray-900 mb-3">Availability</h2>
						<div className="bg-white border border-gray-200 rounded-lg p-6">
							<div className="space-y-2">
								{professional.availability.days && professional.availability.days.length > 0 && (
									<div>
										<strong className="text-gray-900">Days:</strong>{' '}
										<span className="text-gray-700">
											{professional.availability.days.join(', ')}
										</span>
									</div>
								)}
								{professional.availability.timeSlots && professional.availability.timeSlots.length > 0 && (
									<div>
										<strong className="text-gray-900">Time Slots:</strong>{' '}
										<span className="text-gray-700">
											{professional.availability.timeSlots.join(', ')}
										</span>
									</div>
								)}
								{professional.availability.timezone && (
									<div>
										<strong className="text-gray-900">Timezone:</strong>{' '}
										<span className="text-gray-700">{professional.availability.timezone}</span>
									</div>
								)}
							</div>
						</div>
					</section>
				)}

				{/* Organization Info */}
				{professional.organizationInfo && (
					<section>
						<h2 className="text-2xl font-semibold text-gray-900 mb-3">Organization Information</h2>
						<div className="bg-white border border-gray-200 rounded-lg p-6">
							<div className="space-y-2">
								{professional.organizationInfo.foundedYear && (
									<div>
										<strong className="text-gray-900">Founded Year:</strong>{' '}
										<span className="text-gray-700">
											{professional.organizationInfo.foundedYear}
										</span>
									</div>
								)}
								{professional.organizationInfo.registrationNumber && (
									<div>
										<strong className="text-gray-900">Registration Number:</strong>{' '}
										<span className="text-gray-700">
											{professional.organizationInfo.registrationNumber}
										</span>
									</div>
								)}
								{professional.organizationInfo.services &&
									professional.organizationInfo.services.length > 0 && (
										<div>
											<strong className="text-gray-900">Services:</strong>{' '}
											<span className="text-gray-700">
												{professional.organizationInfo.services.join(', ')}
											</span>
										</div>
									)}
								{professional.organizationInfo.targetAudience &&
									professional.organizationInfo.targetAudience.length > 0 && (
										<div>
											<strong className="text-gray-900">Target Audience:</strong>{' '}
											<span className="text-gray-700">
												{professional.organizationInfo.targetAudience.join(', ')}
											</span>
										</div>
									)}
								{professional.organizationInfo.funding && (
									<div>
										<strong className="text-gray-900">Funding:</strong>{' '}
										<span className="text-gray-700">{professional.organizationInfo.funding}</span>
									</div>
								)}
							</div>
						</div>
					</section>
				)}
			</article>
		</main>
	);
}

