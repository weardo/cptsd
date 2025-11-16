import connectDB from './mongodb';
import { Resource } from '@cptsd/db';

export type ResourceType =
	| 'HELPLINE'
	| 'NGO'
	| 'THERAPY_DIRECTORY'
	| 'COMMUNITY'
	| 'EDUCATIONAL_SITE'
	| 'BOOK';

export interface ResourceDoc {
	_id: string;
	type: ResourceType;
	title: string;
	description: string;
	url?: string;
	phone?: string;
	region?: string;
	languages?: string[];
	tags?: string[];
	isFeatured?: boolean;
	createdAt: string;
	updatedAt: string;
}

export async function getAllResources(): Promise<ResourceDoc[]> {
	try {
		await connectDB();
		const docs = await Resource.find({ status: 'ACTIVE' })
			.sort({ type: 1, title: 1 })
			.lean();
		return docs.map((d: any) => ({
			_id: d._id.toString(),
			type: d.type,
			title: d.title,
			description: d.description,
			url: d.url,
			phone: d.phone,
			region: d.region,
			languages: d.languages ?? [],
			tags: d.tags ?? [],
			isFeatured: Boolean(d.isFeatured),
			createdAt: d.createdAt?.toISOString?.() ?? '',
			updatedAt: d.updatedAt?.toISOString?.() ?? '',
		}));
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message.includes('MONGODB_URI is not set') ||
				error.message.includes('buffering timed out'))
		) {
			console.warn('⚠️  MongoDB not available. Returning empty resources list.');
			return [];
		}
		console.error('Error fetching resources:', error);
		return [];
	}
}

