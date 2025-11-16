import connectDB from './mongodb';
import { fetchPublishedFeaturedContent } from '@cptsd/db';
import type { IFeaturedContent } from '@cptsd/db';

export type FeaturedKind =
	| 'EXTERNAL_LINK'
	| 'INTERNAL_ARTICLE'
	| 'INTERNAL_RESOURCE'
	| 'ARTWORK'
	| 'BOOK'
	| 'COPING_TOOL'
	| 'RESEARCH'
	| 'OTHER';

export type FeaturedItem = Omit<IFeaturedContent, 'id' | '_id'> & { _id: string };

export async function getFeaturedContent(limit = 6): Promise<FeaturedItem[]> {
	try {
		await connectDB();
		const docs = await fetchPublishedFeaturedContent({ featured: true, limit });
		return docs.map((d: any) => ({ ...d, _id: d._id?.toString?.() }));
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message.includes('MONGODB_URI is not set') ||
				error.message.includes('buffering timed out'))
		) {
			console.warn('⚠️  MongoDB not available. Returning empty featured list.');
			return [];
		}
		console.error('Error fetching featured content:', error);
		return [];
	}
}

export async function getAllFeaturedPublished(): Promise<FeaturedItem[]> {
	try {
		await connectDB();
		const docs = await fetchPublishedFeaturedContent();
		return docs.map((d: any) => ({ ...d, _id: d._id?.toString?.() }));
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message.includes('MONGODB_URI is not set') ||
				error.message.includes('buffering timed out'))
		) {
			console.warn('⚠️  MongoDB not available. Returning empty featured list.');
			return [];
		}
		console.error('Error fetching featured content:', error);
		return [];
	}
}


