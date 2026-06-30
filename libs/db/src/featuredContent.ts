import mongoose from 'mongoose';
import FeaturedContent, { IFeaturedContent } from './models/FeaturedContent';

type FetchOptions = {
  kind?: IFeaturedContent['kind'] | IFeaturedContent['kind'][];
  tags?: string[];
  featured?: boolean;
  limit?: number;
};

export async function fetchPublishedFeaturedContent(options: FetchOptions = {}) {
  const query: any = { status: 'PUBLISHED' };
  if (options.kind) {
    query.kind = Array.isArray(options.kind) ? { $in: options.kind } : options.kind;
  }
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  if (typeof options.featured === 'boolean') {
    query.isFeatured = options.featured;
  }
  const cursor = FeaturedContent.find(query).sort({ isFeatured: -1, createdAt: -1 });
  if (options.limit) cursor.limit(options.limit);
  return cursor.lean();
}

export async function incrementFeaturedContentClick(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const updated = await FeaturedContent.findByIdAndUpdate(
    id,
    { $inc: { clickCount: 1 } },
    { new: true }
  ).lean();
  return updated;
}


