import connectDB from './mongodb';
import { MentalHealthProfessional, ProfessionalType, ModeOfDelivery, Specialization } from '@cptsd/db';

export interface MentalHealthProfessionalDoc {
	_id: string;
	type: ProfessionalType;
	name: string;
	designation?: string;
	designationOther?: string;
	profilePicture?: string;
	about?: string;
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
	};
	contact: {
		phone?: string;
		helpline?: string;
		email?: string;
		website?: string;
		whatsapp?: string;
		emergency?: string;
	};
	modeOfDelivery: ModeOfDelivery;
	specializations: Specialization[];
	specializationOther?: string[];
	languages: string[];
	experienceYears?: number;
	ageGroups?: string[];
	sessionDuration?: number;
	sessionFee?: {
		amount?: number;
		currency?: string;
		notes?: string;
	};
	insuranceAccepted?: boolean;
	insuranceProviders?: string[];
	availability?: {
		days?: string[];
		timeSlots?: string[];
		timezone?: string;
	};
	organizationInfo?: {
		foundedYear?: number;
		registrationNumber?: string;
		services?: string[];
		targetAudience?: string[];
		funding?: string;
	};
	featured: boolean;
	verified: boolean;
	slug?: string;
	metaDescription?: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export async function getAllMentalHealthProfessionals(): Promise<MentalHealthProfessionalDoc[]> {
	try {
		await connectDB();
		const docs = await MentalHealthProfessional.find({ status: 'ACTIVE' })
			.sort({ featured: -1, verified: -1, name: 1 })
			.lean();
		return docs.map((d: any) => ({
			_id: d._id.toString(),
			type: d.type,
			name: d.name,
			designation: d.designation,
			designationOther: d.designationOther,
			profilePicture: d.profilePicture,
			about: d.about,
			location: d.location || {},
			qualification: d.qualification,
			contact: d.contact || {},
			modeOfDelivery: d.modeOfDelivery,
			specializations: d.specializations || [],
			specializationOther: d.specializationOther || [],
			languages: d.languages || [],
			experienceYears: d.experienceYears,
			ageGroups: d.ageGroups || [],
			sessionDuration: d.sessionDuration,
			sessionFee: d.sessionFee,
			insuranceAccepted: d.insuranceAccepted,
			insuranceProviders: d.insuranceProviders || [],
			availability: d.availability,
			organizationInfo: d.organizationInfo,
			featured: Boolean(d.featured),
			verified: Boolean(d.verified),
			slug: d.slug,
			metaDescription: d.metaDescription,
			tags: d.tags || [],
			createdAt: d.createdAt?.toISOString?.() ?? '',
			updatedAt: d.updatedAt?.toISOString?.() ?? '',
		}));
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message.includes('MONGODB_URI is not set') ||
				error.message.includes('buffering timed out'))
		) {
			console.warn('⚠️  MongoDB not available. Returning empty professionals list.');
			return [];
		}
		console.error('Error fetching mental health professionals:', error);
		return [];
	}
}

export async function getMentalHealthProfessionalBySlug(slug: string): Promise<MentalHealthProfessionalDoc | null> {
	try {
		await connectDB();
		const doc = await MentalHealthProfessional.findOne({ slug, status: 'ACTIVE' }).lean();
		if (!doc) return null;
		return {
			_id: doc._id.toString(),
			type: doc.type,
			name: doc.name,
			designation: doc.designation,
			designationOther: doc.designationOther,
			profilePicture: doc.profilePicture,
			about: doc.about,
			location: doc.location || {},
			qualification: doc.qualification,
			contact: doc.contact || {},
			modeOfDelivery: doc.modeOfDelivery,
			specializations: doc.specializations || [],
			specializationOther: doc.specializationOther || [],
			languages: doc.languages || [],
			experienceYears: doc.experienceYears,
			ageGroups: doc.ageGroups || [],
			sessionDuration: doc.sessionDuration,
			sessionFee: doc.sessionFee,
			insuranceAccepted: doc.insuranceAccepted,
			insuranceProviders: doc.insuranceProviders || [],
			availability: doc.availability,
			organizationInfo: doc.organizationInfo,
			featured: Boolean(doc.featured),
			verified: Boolean(doc.verified),
			slug: doc.slug,
			metaDescription: doc.metaDescription,
			tags: doc.tags || [],
			createdAt: doc.createdAt?.toISOString?.() ?? '',
			updatedAt: doc.updatedAt?.toISOString?.() ?? '',
		};
	} catch (error) {
		console.error('Error fetching mental health professional:', error);
		return null;
	}
}

