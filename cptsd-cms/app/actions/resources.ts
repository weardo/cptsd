'use server';

import connectDB from '@/lib/mongodb';
import Resource, { ResourceType, ResourceCategory } from '@cptsd/db/models/Resource';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import mongoose from 'mongoose';

const resourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.nativeEnum(ResourceType),
  category: z.nativeEnum(ResourceCategory),
  url: z.string().url().optional().or(z.literal('')),
  author: z.string().optional(),
  publisher: z.string().optional(),
  isbn: z.string().optional(),
  duration: z.number().optional(),
  thumbnail: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT']).optional(),
});

export async function createResource(formData: FormData) {
  try {
    await connectDB();

    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as ResourceType,
      category: formData.get('category') as ResourceCategory,
      url: formData.get('url') as string | null,
      phone: formData.get('phone') as string | null,
      region: formData.get('region') as string | null,
      languages: formData.get('languages') ? (formData.get('languages') as string).split(',').map(l => l.trim()).filter(Boolean) : undefined,
      author: formData.get('author') as string | null,
      publisher: formData.get('publisher') as string | null,
      isbn: formData.get('isbn') as string | null,
      duration: formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined,
      thumbnail: formData.get('thumbnail') as string | null,
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean) : [],
      featured: formData.get('featured') === 'true',
      isFeatured: formData.get('featured') === 'true',
      rating: formData.get('rating') ? parseFloat(formData.get('rating') as string) : undefined,
      notes: formData.get('notes') as string | null,
      status: (formData.get('status') as 'ACTIVE' | 'ARCHIVED' | 'DRAFT') || 'ACTIVE',
    };

    const validated = resourceSchema.parse(data);

    const resource = await Resource.create(validated);

    revalidatePath('/resources');
    revalidatePath('/');

    return {
      success: true,
      resource: await transformResource(String(resource._id)),
    };
  } catch (error) {
    console.error('Error creating resource:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create resource',
    };
  }
}

export async function updateResource(id: string, formData: FormData) {
  try {
    await connectDB();

    const updateData: any = {};

    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const type = formData.get('type') as string | null;
    const category = formData.get('category') as string | null;
    const url = formData.get('url') as string | null;
    const phone = formData.get('phone') as string | null;
    const region = formData.get('region') as string | null;
    const languages = formData.get('languages') as string | null;
    const author = formData.get('author') as string | null;
    const publisher = formData.get('publisher') as string | null;
    const isbn = formData.get('isbn') as string | null;
    const duration = formData.get('duration') as string | null;
    const thumbnail = formData.get('thumbnail') as string | null;
    const tags = formData.get('tags') as string | null;
    const featured = formData.get('featured') as string | null;
    const rating = formData.get('rating') as string | null;
    const notes = formData.get('notes') as string | null;
    const status = formData.get('status') as string | null;

    if (title !== null) updateData.title = title;
    if (description !== null) updateData.description = description;
    if (type !== null) updateData.type = type;
    if (category !== null) updateData.category = category;
    if (url !== null) updateData.url = url || undefined;
    if (phone !== null) updateData.phone = phone || undefined;
    if (region !== null) updateData.region = region || undefined;
    if (languages !== null) {
      updateData.languages = languages.split(',').map(l => l.trim()).filter(Boolean);
    }
    if (author !== null) updateData.author = author || undefined;
    if (publisher !== null) updateData.publisher = publisher || undefined;
    if (isbn !== null) updateData.isbn = isbn || undefined;
    if (duration !== null) updateData.duration = duration ? parseInt(duration) : undefined;
    if (thumbnail !== null) updateData.thumbnail = thumbnail || undefined;
    if (tags !== null) {
      updateData.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (featured !== null) {
      updateData.featured = featured === 'true';
      updateData.isFeatured = featured === 'true';
    }
    if (rating !== null) updateData.rating = rating ? parseFloat(rating) : undefined;
    if (notes !== null) updateData.notes = notes || undefined;
    if (status !== null) updateData.status = status;

    const resource = await Resource.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!resource) {
      return { success: false, error: 'Resource not found' };
    }

    revalidatePath('/resources');
    revalidatePath(`/resources/${id}`);

    return {
      success: true,
      resource: transformResourceFromDoc(resource),
    };
  } catch (error) {
    console.error('Error updating resource:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update resource',
    };
  }
}

export async function deleteResource(id: string) {
  try {
    await connectDB();
    await Resource.findByIdAndDelete(id);

    revalidatePath('/resources');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting resource:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete resource',
    };
  }
}

export async function getResources(filters?: {
  type?: ResourceType;
  category?: ResourceCategory;
  status?: string;
  featured?: boolean;
  search?: string;
}) {
  try {
    await connectDB();

    const query: any = {};

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.status) {
      query.status = filters.status;
    } else {
      query.status = 'ACTIVE'; // Default to active only
    }

    if (filters?.featured !== undefined) {
      query.featured = filters.featured;
    }

    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { tags: { $regex: filters.search, $options: 'i' } },
        { author: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const resources = await Resource.find(query)
      .sort({ featured: -1, createdAt: -1 })
      .lean();

    return {
      success: true,
      resources: resources.map((resource) => transformResourceFromDoc(resource)),
    };
  } catch (error) {
    console.error('Error fetching resources:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch resources',
      resources: [],
    };
  }
}

export async function getResource(id: string) {
  try {
    await connectDB();

    const resource = await Resource.findById(id).lean();

    if (!resource) {
      return { success: false, error: 'Resource not found' };
    }

    return {
      success: true,
      resource: transformResourceFromDoc(resource),
    };
  } catch (error) {
    console.error('Error fetching resource:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch resource',
    };
  }
}

// Helper functions
async function transformResource(id: string) {
  const resource = await Resource.findById(id).lean();
  if (!resource) throw new Error('Resource not found');
  return transformResourceFromDoc(resource);
}

function transformResourceFromDoc(resource: any) {
  return {
    id: String(resource._id),
    _id: String(resource._id),
    title: resource.title,
    description: resource.description,
    type: resource.type,
    category: resource.category,
    url: resource.url || null,
    author: resource.author || null,
    publisher: resource.publisher || null,
    isbn: resource.isbn || null,
    duration: resource.duration || null,
    thumbnail: resource.thumbnail || null,
    tags: resource.tags || [],
    featured: resource.featured || false,
    rating: resource.rating || null,
    notes: resource.notes || null,
    status: resource.status,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  };
}

