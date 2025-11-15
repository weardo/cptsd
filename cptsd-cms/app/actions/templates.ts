'use server';

import connectDB from '@/lib/mongodb';
import PromptTemplate from '@/models/PromptTemplate';
import { generateSlug } from '@/lib/utils/slug';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['awareness', 'somatic', 'validation', 'journal', 'other']),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  userPromptTemplate: z.string().min(1, 'User prompt template is required'),
  suggestedPostTypes: z.array(z.enum(['CAROUSEL', 'REEL', 'STORY', 'MEME'])).optional().default([]),
  suggestedTones: z.array(z.enum(['educational', 'validating', 'gentle-cta'])).optional().default([]),
  exampleOutput: z.string().optional(),
});

export async function createTemplate(formData: FormData) {
  try {
    await connectDB();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const systemPrompt = formData.get('systemPrompt') as string;
    const userPromptTemplate = formData.get('userPromptTemplate') as string;
    const exampleOutput = formData.get('exampleOutput') as string | null;

    // Get arrays from form data
    const suggestedPostTypes = formData.getAll('suggestedPostTypes') as string[];
    const suggestedTones = formData.getAll('suggestedTones') as string[];

    const validated = templateSchema.parse({
      name,
      description,
      category,
      systemPrompt,
      userPromptTemplate,
      suggestedPostTypes: suggestedPostTypes.length > 0 ? suggestedPostTypes : undefined,
      suggestedTones: suggestedTones.length > 0 ? suggestedTones : undefined,
      exampleOutput: exampleOutput || undefined,
    });

    const slug = generateSlug(name);

    // Check if slug already exists
    const existing = await PromptTemplate.findOne({ slug });

    if (existing) {
      throw new Error('Template with this name already exists');
    }

    const template = await PromptTemplate.create({
      name: validated.name,
      slug,
      description: validated.description,
      category: validated.category,
      systemPrompt: validated.systemPrompt,
      userPromptTemplate: validated.userPromptTemplate,
      suggestedPostTypes: validated.suggestedPostTypes || [],
      suggestedTones: validated.suggestedTones || [],
      exampleOutput: validated.exampleOutput,
      isActive: true,
      usageCount: 0,
    });

    revalidatePath('/templates');
    revalidatePath('/');

      const templateDoc = template as any;
      
      return {
        success: true,
        template: {
          id: templateDoc._id.toString(),
          _id: templateDoc._id.toString(),
          name: templateDoc.name,
          slug: templateDoc.slug,
          description: templateDoc.description,
          category: templateDoc.category,
          systemPrompt: templateDoc.systemPrompt,
          userPromptTemplate: templateDoc.userPromptTemplate,
          suggestedPostTypes: templateDoc.suggestedPostTypes,
          suggestedTones: templateDoc.suggestedTones,
          exampleOutput: templateDoc.exampleOutput,
          isActive: templateDoc.isActive,
          usageCount: templateDoc.usageCount,
          createdAt: templateDoc.createdAt instanceof Date 
            ? templateDoc.createdAt.toISOString() 
            : new Date(templateDoc.createdAt).toISOString(),
          updatedAt: templateDoc.updatedAt instanceof Date 
            ? templateDoc.updatedAt.toISOString() 
            : new Date(templateDoc.updatedAt).toISOString(),
        },
      };
  } catch (error) {
    console.error('Error creating template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create template',
    };
  }
}

export async function getTemplates(activeOnly: boolean = false) {
  try {
    // During build time, skip database queries and return empty array
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                        (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI);
    if (isBuildTime) {
      return { success: true, templates: [] };
    }

    await connectDB();

    const query = activeOnly ? { isActive: true } : {};

    const templates = await PromptTemplate.find(query)
      .sort({ category: 1, name: 1 })
      .lean();

    return {
      success: true,
      templates: templates.map((template: any) => ({
        id: template._id.toString(),
        _id: template._id.toString(),
        name: template.name,
        slug: template.slug,
        description: template.description,
        category: template.category,
        systemPrompt: template.systemPrompt,
        userPromptTemplate: template.userPromptTemplate,
        suggestedPostTypes: template.suggestedPostTypes || [],
        suggestedTones: template.suggestedTones || [],
        exampleOutput: template.exampleOutput,
        isActive: template.isActive,
        usageCount: template.usageCount,
        createdAt: template.createdAt instanceof Date 
          ? template.createdAt.toISOString() 
          : typeof template.createdAt === 'string' 
            ? template.createdAt 
            : new Date(template.createdAt).toISOString(),
        updatedAt: template.updatedAt instanceof Date 
          ? template.updatedAt.toISOString() 
          : typeof template.updatedAt === 'string'
            ? template.updatedAt
            : new Date(template.updatedAt).toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch templates',
      templates: [],
    };
  }
}

export async function getTemplate(id: string) {
  try {
    await connectDB();

    const template = await PromptTemplate.findById(id).lean();

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    const templateDoc = template as any;

    return {
      success: true,
      template: {
        id: templateDoc._id.toString(),
        _id: templateDoc._id.toString(),
        name: templateDoc.name,
        slug: templateDoc.slug,
        description: templateDoc.description,
        category: templateDoc.category,
        systemPrompt: templateDoc.systemPrompt,
        userPromptTemplate: templateDoc.userPromptTemplate,
        suggestedPostTypes: templateDoc.suggestedPostTypes || [],
        suggestedTones: templateDoc.suggestedTones || [],
        exampleOutput: templateDoc.exampleOutput,
        isActive: templateDoc.isActive,
        usageCount: templateDoc.usageCount,
        createdAt: templateDoc.createdAt instanceof Date 
          ? templateDoc.createdAt.toISOString() 
          : typeof templateDoc.createdAt === 'string' 
            ? templateDoc.createdAt 
            : new Date(templateDoc.createdAt).toISOString(),
        updatedAt: templateDoc.updatedAt instanceof Date 
          ? templateDoc.updatedAt.toISOString() 
          : typeof templateDoc.updatedAt === 'string'
            ? templateDoc.updatedAt
            : new Date(templateDoc.updatedAt).toISOString(),
      },
    };
  } catch (error) {
    console.error('Error fetching template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch template',
    };
  }
}

/**
 * Seed default CPTSD prompt templates
 */
export async function deleteTemplate(id: string) {
  try {
    await connectDB();

    const deletedTemplate = await PromptTemplate.findByIdAndDelete(id);

    if (!deletedTemplate) {
      return { success: false, error: 'Template not found or failed to delete' };
    }

    revalidatePath('/templates');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete template',
    };
  }
}

export async function seedDefaultTemplates() {
  try {
    await connectDB();

    const defaultTemplates = [
      {
        name: 'Awareness Carousel',
        description: 'Create educational carousel posts about CPTSD awareness topics',
        category: 'awareness' as const,
        systemPrompt:
          'You are a content creator specializing in CPTSD awareness. Create engaging, educational carousel posts that help people understand CPTSD symptoms, causes, and healing approaches. Use clear, compassionate language.',
        userPromptTemplate:
          'Topic: {topic}\nTone: {tone}\nIntent: {intent}\n\nCreate a carousel-style educational post about {topic}. The content should be {tone} and help people understand this aspect of CPTSD.',
        suggestedPostTypes: ['CAROUSEL'] as const,
        suggestedTones: ['educational', 'validating'] as const,
        exampleOutput: '7-slide carousel explaining CPTSD symptoms...',
      },
      {
        name: 'Somatic Explanation',
        description: 'Explain somatic/body-based CPTSD responses and healing practices',
        category: 'somatic' as const,
        systemPrompt:
          'You are a somatic therapist specializing in CPTSD. Create content that explains how trauma lives in the body and practical somatic healing exercises. Use body-positive, accessible language.',
        userPromptTemplate:
          'Topic: {topic}\nTone: {tone}\nPost Type: {postType}\n\nCreate content explaining somatic aspects of {topic}. Include practical exercises or body-awareness practices that readers can try.',
        suggestedPostTypes: ['CAROUSEL', 'REEL', 'STORY'] as const,
        suggestedTones: ['educational', 'validating'] as const,
      },
      {
        name: 'Validation Text Post',
        description: 'Create validating, supportive text posts for social media',
        category: 'validation' as const,
        systemPrompt:
          'You are a trauma-informed therapist. Create validating, supportive social media posts that normalize CPTSD experiences and offer hope. Use warm, compassionate language.',
        userPromptTemplate:
          'Topic: {topic}\nTone: {tone}\n\nCreate a validating post about {topic}. Normalize the experience, validate emotions, and offer gentle hope. Keep it concise and impactful.',
        suggestedPostTypes: ['CAROUSEL', 'STORY', 'MEME'] as const,
        suggestedTones: ['validating', 'gentle-cta'] as const,
      },
      {
        name: 'Journal Prompt for WhatsApp Community',
        description: 'Generate reflective journal prompts for WhatsApp community sharing',
        category: 'journal' as const,
        systemPrompt:
          'You are a therapeutic writing facilitator. Create thoughtful journal prompts that help people reflect on their CPTSD journey, build self-awareness, and process emotions safely.',
        userPromptTemplate:
          'Topic: {topic}\nTone: {tone}\n\nCreate 3-5 journal prompts related to {topic}. Make them introspective, gentle, and suitable for a supportive community space. Format as a WhatsApp-friendly text.',
        suggestedPostTypes: ['STORY', 'MEME'] as const,
        suggestedTones: ['educational', 'gentle-cta'] as const,
      },
    ];

    const createdTemplates = [];

    for (const templateData of defaultTemplates) {
      const slug = generateSlug(templateData.name);
      const existing = await PromptTemplate.findOne({ slug });

      if (!existing) {
        const template = await PromptTemplate.create({
          ...templateData,
          slug,
          isActive: true,
          usageCount: 0,
        });
        createdTemplates.push(template);
      }
    }

    return {
      success: true,
      message: `Created ${createdTemplates.length} default templates`,
      templates: createdTemplates,
    };
  } catch (error) {
    console.error('Error seeding templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to seed templates',
    };
  }
}

