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

export async function seedInitialResources() {
  try {
    await connectDB();

    const seeds = [
      // --- HELPLINES (India) ---
      {
        type: ResourceType.HELPLINE,
        title: 'Tele-MANAS (National Tele Mental Health Programme)',
        description:
          "Government of India's free, 24x7 tele-mental health service. You can call to speak with trained mental health professionals for emotional distress, exam or work stress, anxiety, or trauma-related concerns. They can also connect you to local services.",
        phone: '14416 / 1800-89-14416',
        url: 'https://telemanas.mohfw.gov.in/',
        region: 'All India',
        languages: ['Multiple Indian languages', 'English'],
        tags: ['crisis', 'mental health', 'government'],
        isFeatured: true,
        featured: true,
        category: ResourceCategory.EMERGENCY,
        status: 'ACTIVE',
      },
      {
        type: ResourceType.HELPLINE,
        title: 'KIRAN Mental Health Rehabilitation Helpline',
        description:
          '24x7 toll-free helpline launched by the Ministry of Social Justice & Empowerment to support people facing anxiety, stress, depression, suicidal thoughts and other mental health concerns.',
        phone: '1800-599-0019',
        url: 'https://depwd.gov.in/en/others-helplines/',
        region: 'All India',
        languages: [
          'Hindi',
          'Assamese',
          'Tamil',
          'Marathi',
          'Odia',
          'Telugu',
          'Malayalam',
          'Gujarati',
          'Punjabi',
          'Kannada',
          'Bengali',
          'Urdu',
          'English',
        ],
        tags: ['crisis', 'rehabilitation', 'government'],
        isFeatured: true,
        featured: true,
        category: ResourceCategory.EMERGENCY,
        status: 'ACTIVE',
      },
      {
        type: ResourceType.HELPLINE,
        title: 'Aasra – Suicide Prevention & Counselling',
        description:
          'NGO-based helpline offering confidential emotional support for people in distress or with suicidal thoughts.',
        phone: '+91-9820466728',
        url: 'https://www.aasra.info/',
        region: 'All India (phone-based)',
        languages: [],
        tags: ['suicide prevention', 'NGO'],
        isFeatured: false,
        featured: false,
        category: ResourceCategory.EMERGENCY,
        status: 'ACTIVE',
      },
      {
        type: ResourceType.HELPLINE,
        title: 'Vandrevala Foundation Mental Health Helpline',
        description:
          '24x7 national crisis intervention and mental health helpline providing support via phone, WhatsApp and email.',
        phone: '+91-9999-666-555',
        url: 'https://www.vandrevalafoundation.com/',
        region: 'All India (phone / online)',
        languages: [],
        tags: ['crisis', 'NGO'],
        isFeatured: false,
        featured: false,
        category: ResourceCategory.EMERGENCY,
        status: 'ACTIVE',
      },

      // --- DIRECTORIES / NGOs (India-focused) ---
      {
        type: ResourceType.THERAPY_DIRECTORY,
        title: 'TheMindClan – Inclusive Therapists & Support Groups',
        description:
          'Curated directory of trauma-informed, queer-affirming, and inclusive therapists and support groups across India. Good starting point to search for trauma-aware therapists.',
        url: 'https://themindclan.com/',
        region: 'India / Indian diaspora',
        languages: [],
        tags: ['therapy', 'directory', 'inclusive'],
        isFeatured: true,
        featured: true,
        category: ResourceCategory.THERAPY,
        status: 'ACTIVE',
      },
      {
        type: ResourceType.THERAPY_DIRECTORY,
        title: 'Live Love Laugh – Therapist Directory',
        description:
          'Verified therapist directory from The Live Love Laugh Foundation. Lets you find mental health professionals across India by location and specialisation.',
        url: 'https://www.thelivelovelaughfoundation.org/find-help/therapist',
        region: 'India',
        languages: [],
        tags: ['therapy', 'directory'],
        isFeatured: true,
        featured: true,
        category: ResourceCategory.THERAPY,
        status: 'ACTIVE',
      },
      {
        type: ResourceType.NGO,
        title: 'Sangath',
        description:
          'Indian not-for-profit organisation working on community-based mental health services, research and digital mental health programs.',
        url: 'https://www.sangath.in/',
        region: 'India',
        languages: [],
        tags: ['NGO', 'community mental health'],
        isFeatured: false,
        featured: false,
        category: ResourceCategory.SUPPORT,
        status: 'ACTIVE',
      },

      // --- HELPLINE LISTS / META RESOURCES ---
      {
        type: ResourceType.HELPLINE,
        title: 'Live Love Laugh – Helpline List',
        description:
          'A curated list of free mental health helplines across India. Useful if Tele-MANAS or KIRAN lines are busy or if you prefer NGO-run lines.',
        url: 'https://www.thelivelovelaughfoundation.org/find-help/helplines',
        region: 'India',
        languages: [],
        tags: ['directory', 'helplines'],
        isFeatured: false,
        featured: false,
        category: ResourceCategory.EMERGENCY,
        status: 'ACTIVE',
      },

      // --- INTERNATIONAL EDUCATIONAL RESOURCES (psychoeducation only) ---
      {
        type: ResourceType.EDUCATIONAL_SITE,
        title: 'Mind (UK) – Complex PTSD',
        description:
          'Plain-language explanation of complex PTSD, including symptoms, examples and ideas for support. Good for understanding the condition in everyday language.',
        url: 'https://www.mind.org.uk/information-support/types-of-mental-health-problems/post-traumatic-stress-disorder-ptsd-and-complex-ptsd/complex-ptsd/',
        region: 'International (online)',
        languages: ['English'],
        tags: ['psychoeducation', 'CPTSD'],
        isFeatured: true,
        featured: true,
        category: ResourceCategory.EDUCATION,
        status: 'ACTIVE',
      },
      {
        type: ResourceType.EDUCATIONAL_SITE,
        title: 'NHS – Complex PTSD',
        description:
          'Official UK National Health Service information page on complex PTSD, including symptoms and treatment overview.',
        url: 'https://www.nhs.uk/mental-health/conditions/post-traumatic-stress-disorder-ptsd/complex/',
        region: 'International (online)',
        languages: ['English'],
        tags: ['psychoeducation', 'CPTSD'],
        isFeatured: true,
        featured: true,
        category: ResourceCategory.EDUCATION,
        status: 'ACTIVE',
      },
      {
        type: ResourceType.EDUCATIONAL_SITE,
        title: 'NHS Inform – PTSD and CPTSD Self-Help Guide',
        description:
          'Structured self-help workbook style guide for people experiencing PTSD or complex PTSD symptoms. Includes exercises and coping strategies.',
        url: 'https://www.nhsinform.scot/illnesses-and-conditions/mental-health/mental-health-self-help-guides/ptsd-and-cptsd-self-help-guide/',
        region: 'International (online)',
        languages: ['English'],
        tags: ['self-help', 'workbook'],
        isFeatured: false,
        featured: false,
        category: ResourceCategory.EDUCATION,
        status: 'ACTIVE',
      },
      {
        type: ResourceType.EDUCATIONAL_SITE,
        title: 'Cleveland Clinic – Complex PTSD (CPTSD)',
        description:
          'Medical overview of complex PTSD, including causes, symptoms and treatment options.',
        url: 'https://my.clevelandclinic.org/health/diseases/24881-cptsd-complex-ptsd',
        region: 'International (online)',
        languages: ['English'],
        tags: ['medical', 'CPTSD'],
        isFeatured: false,
        featured: false,
        category: ResourceCategory.EDUCATION,
        status: 'ACTIVE',
      },
      {
        type: ResourceType.EDUCATIONAL_SITE,
        title: 'VA National Center for PTSD – Complex PTSD',
        description:
          'Professional-level but accessible information about PTSD and complex PTSD, grounded in ICD-11 research.',
        url: 'https://www.ptsd.va.gov/understand/what/complex_ptsd.asp',
        region: 'International (online)',
        languages: ['English'],
        tags: ['research', 'PTSD', 'CPTSD'],
        isFeatured: false,
        featured: false,
        category: ResourceCategory.EDUCATION,
        status: 'ACTIVE',
      },

      // --- PEER COMMUNITIES (with strong disclaimers) ---
      {
        type: ResourceType.COMMUNITY,
        title: 'r/CPTSD – Reddit Community',
        description:
          'Large international peer-support community for people living with complex PTSD and long-term trauma. Not a replacement for therapy; conversations may be triggering for some readers.',
        url: 'https://www.reddit.com/r/CPTSD/',
        region: 'International (online)',
        languages: ['English'],
        tags: ['peer support', 'online community'],
        isFeatured: false,
        featured: false,
        category: ResourceCategory.COMMUNITY,
        status: 'ACTIVE',
      },
    ];

    let inserted = 0;
    let updated = 0;

    for (const seed of seeds) {
      const result = await Resource.updateOne(
        { title: seed.title, type: seed.type },
        { $set: seed },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        inserted++;
      } else if (result.modifiedCount > 0) {
        updated++;
      }
    }

    revalidatePath('/resources');
    revalidatePath('/');

    return { success: true, inserted, updated };
  } catch (error) {
    console.error('Error seeding resources:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to seed resources',
    };
  }
}

