'use server';

import connectDB from '@/lib/mongodb';
import ContentIdea, { IdeaStatus, IContentIdeaItem } from '@cptsd/db/models/ContentIdea';
import Topic from '@cptsd/db/models/Topic';
import Post from '@cptsd/db/models/Post';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import mongoose from 'mongoose';
import { generateIdeas, GenerateIdeasRequest } from '@/lib/openai-ideas';
import { generateContentFromIdea } from '@/lib/openai-ideas';

const ideaSchema = z.object({
  topicId: z.string().min(1, 'Topic ID is required'),
  intent: z.string().optional(),
  status: z.enum(['DRAFT', 'REVIEWING', 'APPROVED', 'CONVERTED', 'ARCHIVED']).optional(),
  notes: z.string().optional(),
  postType: z.enum(['CAROUSEL', 'REEL', 'STORY', 'MEME']).optional(),
  tone: z.enum(['educational', 'validating', 'gentle-cta']).optional(),
  templateId: z.string().optional(),
  items: z
    .array(
      z.object({
        type: z.enum(['text', 'image', 'file', 'link']),
        content: z.string(),
        metadata: z
          .object({
            filename: z.string().optional(),
            fileSize: z.number().optional(),
            mimeType: z.string().optional(),
            thumbnailUrl: z.string().optional(),
            description: z.string().optional(),
          })
          .optional(),
        order: z.number().optional(),
      })
    )
    .optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

export async function createIdea(formData: FormData) {
  try {
    await connectDB();

    const topicId = formData.get('topicId') as string;
    const intent = formData.get('intent') as string | null;
    const notes = formData.get('notes') as string | null;
    const postType = formData.get('postType') as string | null;
    const tone = formData.get('tone') as string | null;
    const templateId = formData.get('templateId') as string | null;

    const validated = ideaSchema.parse({
      topicId,
      intent: intent || undefined,
      notes: notes || undefined,
      postType: postType || undefined,
      tone: tone || undefined,
      templateId: templateId || undefined,
    });

    const idea = await ContentIdea.create({
      topicId: new mongoose.Types.ObjectId(validated.topicId),
      intent: validated.intent,
      status: IdeaStatus.DRAFT,
      notes: validated.notes,
      postType: validated.postType as any,
      tone: validated.tone as any,
      templateId: validated.templateId ? new mongoose.Types.ObjectId(validated.templateId) : undefined,
      items: [],
    });

    revalidatePath('/ideas');
    revalidatePath('/');

    // Use lean() to get plain object, then transform
    const ideaDoc = await ContentIdea.findById(idea._id)
      .populate('topicId')
      .populate('templateId')
      .lean();

    return {
      success: true,
      idea: transformIdea(ideaDoc),
    };
  } catch (error) {
    console.error('Error creating idea:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create idea',
    };
  }
}

export async function updateIdea(id: string, formData: FormData) {
  try {
    await connectDB();

    const intent = formData.get('intent') as string | null;
    const notes = formData.get('notes') as string | null;
    const status = formData.get('status') as string | null;
    const postType = formData.get('postType') as string | null;
    const tone = formData.get('tone') as string | null;

    const updateData: any = {};
    if (intent !== null) updateData.intent = intent;
    if (notes !== null) updateData.notes = notes;
    if (status !== null) updateData.status = status;
    if (postType !== null) updateData.postType = postType;
    if (tone !== null) updateData.tone = tone;

    const idea = await ContentIdea.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('topicId')
      .populate('templateId')
      .lean();

    if (!idea) {
      return { success: false, error: 'Idea not found' };
    }

    revalidatePath('/ideas');
    revalidatePath(`/ideas/${id}`);
    revalidatePath('/');

    return {
      success: true,
      idea: transformIdea(idea),
    };
  } catch (error) {
    console.error('Error updating idea:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update idea',
    };
  }
}

export async function updateIdeaItems(id: string, items: IContentIdeaItem[]) {
  try {
    await connectDB();

    // Ensure items are plain objects without _id fields
    const plainItems = items.map((item) => {
      const plainItem: any = {
        type: item.type,
        content: item.content,
        order: item.order || 0,
      };
      if (item.metadata) {
        plainItem.metadata = item.metadata;
      }
      return plainItem;
    });

    const idea = await ContentIdea.findByIdAndUpdate(
      id,
      { items: plainItems },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('topicId')
      .populate('templateId')
      .lean();

    if (!idea) {
      return { success: false, error: 'Idea not found' };
    }

    revalidatePath('/ideas');
    revalidatePath(`/ideas/${id}`);
    revalidatePath('/');

    return {
      success: true,
      idea: transformIdea(idea),
    };
  } catch (error) {
    console.error('Error updating idea items:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update idea items',
    };
  }
}

export async function updateIdeaPosition(id: string, x: number, y: number) {
  try {
    await connectDB();

    const idea = await ContentIdea.findByIdAndUpdate(
      id,
      { position: { x, y } },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!idea) {
      return { success: false, error: 'Idea not found' };
    }

    return {
      success: true,
      idea: transformIdea(idea),
    };
  } catch (error) {
    console.error('Error updating idea position:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update idea position',
    };
  }
}

export async function deleteIdea(id: string) {
  try {
    await connectDB();

    const deletedIdea = await ContentIdea.findByIdAndDelete(id);

    if (!deletedIdea) {
      return { success: false, error: 'Idea not found or failed to delete' };
    }

    revalidatePath('/ideas');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting idea:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete idea',
    };
  }
}

export async function getIdeas(filters?: {
  topicId?: string;
  status?: string;
  postType?: string;
  search?: string;
}) {
  try {
    await connectDB();

    const query: any = {};

    if (filters?.topicId) {
      query.topicId = new mongoose.Types.ObjectId(filters.topicId);
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.postType) {
      query.postType = filters.postType;
    }

    if (filters?.search) {
      query.$or = [
        { intent: { $regex: filters.search, $options: 'i' } },
        { notes: { $regex: filters.search, $options: 'i' } },
        { 'items.content': { $regex: filters.search, $options: 'i' } },
      ];
    }

    const ideas = await ContentIdea.find(query)
      .populate('topicId')
      .populate('templateId')
      .sort({ createdAt: -1 })
      .lean();

    // Transform all ideas to plain objects
    const transformedIdeas = ideas.map((idea: any) => transformIdea(idea));
    
    return {
      success: true,
      ideas: transformedIdeas,
    };
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch ideas',
      ideas: [],
    };
  }
}

export async function getIdea(id: string) {
  try {
    await connectDB();

    const idea = await ContentIdea.findById(id).populate('topicId').populate('templateId').lean();

    if (!idea) {
      return { success: false, error: 'Idea not found' };
    }

    return {
      success: true,
      idea: transformIdea(idea),
    };
  } catch (error) {
    console.error('Error fetching idea:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch idea',
    };
  }
}

export async function generateIdeasWithAI(request: GenerateIdeasRequest) {
  try {
    await connectDB();

    const result = await generateIdeas(request);

    // Get topic if topicId not provided
    let topicId = request.topicId;
    if (!topicId) {
      const topic = await Topic.findOne({
        $or: [
          { slug: request.topicSlug },
          { name: request.topicName },
        ],
      }).lean();
      
      if (!topic) {
        throw new Error('Topic not found');
      }
      topicId = topic._id.toString();
    }

    const createdIdeas = await Promise.all(
      result.ideas.map((ideaData, index) =>
        ContentIdea.create({
          topicId: new mongoose.Types.ObjectId(topicId!),
          intent: ideaData.intent,
          notes: ideaData.notes,
          aiVariations: ideaData.variations,
          postType: request.postType,
          tone: request.tone,
          status: IdeaStatus.DRAFT,
          items: ideaData.notes
            ? [
                {
                  type: 'text' as const,
                  content: ideaData.notes,
                  order: 0,
                },
              ]
            : [],
          // Stagger positions on board
          position: {
            x: (index % 3) * 320, // 3 columns
            y: Math.floor(index / 3) * 220, // Rows
          },
        })
      )
    );

    // Fetch created ideas as plain objects using lean()
    const ideaIds = createdIdeas.map((idea) => idea._id);
    const plainIdeas = await ContentIdea.find({ _id: { $in: ideaIds } })
      .populate('topicId')
      .populate('templateId')
      .lean();

    revalidatePath('/ideas');
    revalidatePath('/');

    return {
      success: true,
      ideas: plainIdeas.map((idea: any) => transformIdea(idea)),
    };
  } catch (error) {
    console.error('Error generating ideas with AI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate ideas',
      ideas: [],
    };
  }
}

export async function convertIdeaToPost(ideaId: string) {
  try {
    await connectDB();

    const idea = await ContentIdea.findById(ideaId).populate('topicId').lean();

    if (!idea) {
      return { success: false, error: 'Idea not found' };
    }

    const ideaDoc = idea as any;
    const topic = ideaDoc.topicId;

    if (!topic || typeof topic !== 'object') {
      return { success: false, error: 'Topic not found' };
    }

    // Generate content from idea if not already generated
    let script = ideaDoc.generatedScript;
    let caption = ideaDoc.generatedCaption;
    let hashtags = ideaDoc.generatedHashtags;

    if (!script || !caption) {
      try {
        // Get default model from settings
        const { getDefaultModel } = await import('@/lib/settings');
        const defaultModel = await getDefaultModel();
        const generated = await generateContentFromIdea(ideaId, defaultModel);
        script = generated.script;
        caption = generated.caption;
        hashtags = generated.hashtags.join(' ');

        // Update idea with generated content
        await ContentIdea.findByIdAndUpdate(ideaId, {
          generatedScript: script,
          generatedCaption: caption,
          generatedHashtags: hashtags,
        });
      } catch (genError) {
        console.error('Error generating content from idea:', genError);
        // Continue with empty content
      }
    }

    // Build rawIdea from idea items and notes
    const rawIdea =
      ideaDoc.notes ||
      ideaDoc.items
        ?.filter((item: any) => item.type === 'text')
        .map((item: any) => item.content)
        .join('\n\n') ||
      ideaDoc.intent ||
      'Content idea';

    // Create post
    const post = await Post.create({
      topicId: topic._id,
      postType: (ideaDoc.postType as any) || 'CAROUSEL',
      status: 'DRAFT',
      rawIdea,
      script: script || '',
      caption: caption || '',
      hashtags: hashtags || '',
      // Copy image items as finchScreenshotUrl if any
      finchScreenshotUrl:
        ideaDoc.items?.find((item: any) => item.type === 'image')?.content || undefined,
    });

    // Link idea to post and mark as converted
    await ContentIdea.findByIdAndUpdate(ideaId, {
      linkedPostId: post._id,
      status: IdeaStatus.CONVERTED,
    });

    const postDoc = post as any;

    revalidatePath('/ideas');
    revalidatePath('/posts');
    revalidatePath(`/posts/${postDoc._id}`);

    return {
      success: true,
      post: {
        id: postDoc._id.toString(),
        _id: postDoc._id.toString(),
        topicId: postDoc.topicId.toString(),
        postType: postDoc.postType,
        status: postDoc.status,
        rawIdea: postDoc.rawIdea,
        script: postDoc.script,
        caption: postDoc.caption,
        hashtags: postDoc.hashtags,
        manualSlidePrompts: postDoc.manualSlidePrompts || null,
        createdAt: postDoc.createdAt instanceof Date 
          ? postDoc.createdAt.toISOString() 
          : new Date(postDoc.createdAt).toISOString(),
        updatedAt: postDoc.updatedAt instanceof Date 
          ? postDoc.updatedAt.toISOString() 
          : new Date(postDoc.updatedAt).toISOString(),
      },
    };
  } catch (error) {
    console.error('Error converting idea to post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert idea to post',
    };
  }
}

// Helper to transform MongoDB document to expected format
function transformIdea(idea: any) {
  const topic = idea.topicId && typeof idea.topicId === 'object' ? idea.topicId : null;
  const template = idea.templateId && typeof idea.templateId === 'object' ? idea.templateId : null;

  // Transform items array to plain objects
  // Items are subdocuments, so they might have _id fields that need to be removed
  const items = (idea.items || []).map((item: any, index: number) => {
    // Create a plain object, excluding any MongoDB-specific fields
    const plainItem: any = {
      type: item.type,
      content: String(item.content || ''),
      order: Number(item.order !== undefined ? item.order : index),
    };
    
    // Include metadata if it exists (it should already be a plain object when using lean())
    if (item.metadata && typeof item.metadata === 'object') {
      // Ensure metadata is a plain object
      plainItem.metadata = {
        ...(item.metadata.filename && { filename: String(item.metadata.filename) }),
        ...(item.metadata.fileSize !== undefined && { fileSize: Number(item.metadata.fileSize) }),
        ...(item.metadata.mimeType && { mimeType: String(item.metadata.mimeType) }),
        ...(item.metadata.thumbnailUrl && { thumbnailUrl: String(item.metadata.thumbnailUrl) }),
        ...(item.metadata.description && { description: String(item.metadata.description) }),
      };
    }
    
    return plainItem;
  });

  return {
    id: idea._id.toString(),
    _id: idea._id.toString(),
    topicId: topic ? topic._id.toString() : idea.topicId?.toString(),
    topic: topic
      ? {
          id: topic._id.toString(),
          _id: topic._id.toString(),
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
        }
      : null,
    intent: idea.intent,
    status: idea.status,
    items: items, // Use transformed items
    notes: idea.notes,
    aiVariations: idea.aiVariations || [],
    postType: idea.postType,
    tone: idea.tone,
    templateId: template ? template._id.toString() : idea.templateId?.toString(),
    template: template
      ? {
          id: template._id.toString(),
          _id: template._id.toString(),
          name: template.name,
          slug: template.slug,
          description: template.description,
        }
      : null,
    generatedScript: idea.generatedScript,
    generatedCaption: idea.generatedCaption,
    generatedHashtags: idea.generatedHashtags,
    linkedPostId: idea.linkedPostId?.toString(),
    position: idea.position || { x: 0, y: 0 },
    // Convert Date objects to ISO strings for client components
    createdAt: idea.createdAt instanceof Date 
      ? idea.createdAt.toISOString() 
      : typeof idea.createdAt === 'string' 
        ? idea.createdAt 
        : new Date(idea.createdAt).toISOString(),
    updatedAt: idea.updatedAt instanceof Date 
      ? idea.updatedAt.toISOString() 
      : typeof idea.updatedAt === 'string' 
        ? idea.updatedAt 
        : new Date(idea.updatedAt).toISOString(),
    authorId: idea.authorId?.toString(),
  };
}

