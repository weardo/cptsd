"use server";

import connectDB from "@/lib/mongodb";
import { FeaturedContent } from "@cptsd/db";
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import mongoose from 'mongoose';

const featuredSchema = z.object({
  kind: z.enum([
    'EXTERNAL_LINK',
    'INTERNAL_ARTICLE',
    'INTERNAL_RESOURCE',
    'ARTWORK',
    'BOOK',
    'COPING_TOOL',
    'RESEARCH',
    'OTHER',
  ]),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  slug: z.string().optional(),
  externalUrl: z.string().url().optional().or(z.literal('')),
  internalArticleSlug: z.string().optional(),
  internalResourceId: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  creatorName: z.string().optional(),
  creatorUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  isFeatured: z.boolean().optional(),
});

export async function createFeaturedItem(formData: FormData) {
  try {
    await connectDB();
    const data = parseForm(formData);
    validateLinkTargets(data);
    const doc = await FeaturedContent.create(mapToDoc(data));
    revalidate();
    return { success: true, item: serialize(doc) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateFeaturedItem(id: string, formData: FormData) {
  try {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid id');
    const data = parseForm(formData);
    validateLinkTargets(data);
    const updated = await FeaturedContent.findByIdAndUpdate(id, mapToDoc(data), {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return { success: false, error: 'Not found' };
    revalidate(id);
    return { success: true, item: serialize(updated) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteFeaturedItem(id: string) {
  try {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid id');
    await FeaturedContent.findByIdAndDelete(id);
    revalidate(id);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

type FeaturedFilters = {
  kind?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  tag?: string;
  search?: string;
};

export async function getFeaturedItems(filters?: FeaturedFilters) {
  await connectDB();
  const q: Record<string, unknown> = {};
  if (filters?.kind) q.kind = filters.kind;
  if (filters?.status) q.status = filters.status;
  if (filters?.tag) q.tags = filters.tag;
  if (filters?.search) {
    q.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { tags: { $regex: filters.search, $options: 'i' } },
      { creatorName: { $regex: filters.search, $options: 'i' } },
    ];
  }
  const docs = await FeaturedContent.find(q).sort({ isFeatured: -1, updatedAt: -1 }).lean();
  return { success: true, items: docs.map(serialize) };
}

export async function getFeaturedItem(id: string) {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, error: 'Invalid id' };
  const doc = await FeaturedContent.findById(id).lean();
  if (!doc) return { success: false, error: 'Not found' };
  return { success: true, item: serialize(doc) };
}

function parseForm(formData: FormData): z.infer<typeof featuredSchema> {
  const base = {
    kind: formData.get('kind') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    slug: (formData.get('slug') as string) || undefined,
    externalUrl: (formData.get('externalUrl') as string) || undefined,
    internalArticleSlug: (formData.get('internalArticleSlug') as string) || undefined,
    internalResourceId: (formData.get('internalResourceId') as string) || undefined,
    thumbnailUrl: (formData.get('thumbnailUrl') as string) || undefined,
    creatorName: (formData.get('creatorName') as string) || undefined,
    creatorUrl: (formData.get('creatorUrl') as string) || undefined,
    tags: (formData.get('tags') as string)
      ? (formData.get('tags') as string).split(',').map((t) => t.trim()).filter(Boolean)
      : [],
    status: ((formData.get('status') as string) as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
    isFeatured: formData.get('isFeatured') === 'true',
  };
  return featuredSchema.parse(base);
}

function validateLinkTargets(data: z.infer<typeof featuredSchema>) {
  const hasAny = !!(data.externalUrl || data.internalArticleSlug || data.internalResourceId);
  if (!hasAny) {
    throw new Error('Provide at least one of externalUrl, internalArticleSlug or internalResourceId');
  }
}

function mapToDoc(data: z.infer<typeof featuredSchema>) {
  return {
    ...data,
    internalResourceId: data.internalResourceId && mongoose.Types.ObjectId.isValid(data.internalResourceId)
      ? new mongoose.Types.ObjectId(data.internalResourceId)
      : undefined,
  };
}

function serialize(doc: any) {
  return {
    id: String(doc._id),
    _id: String(doc._id),
    kind: doc.kind,
    title: doc.title,
    slug: doc.slug || null,
    description: doc.description,
    externalUrl: doc.externalUrl || null,
    internalArticleSlug: doc.internalArticleSlug || null,
    internalResourceId: doc.internalResourceId 
      ? (typeof doc.internalResourceId === 'string' 
          ? doc.internalResourceId 
          : String(doc.internalResourceId)) 
      : null,
    thumbnailUrl: doc.thumbnailUrl || null,
    creatorName: doc.creatorName || null,
    creatorUrl: doc.creatorUrl || null,
    tags: doc.tags || [],
    status: doc.status,
    isFeatured: !!doc.isFeatured,
    clickCount: doc.clickCount || 0,
    viewCount: doc.viewCount || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function revalidate(id?: string) {
  revalidatePath('/studio/featured');
  if (id) revalidatePath(`/studio/featured/${id}`);
  revalidatePath('/');
}


