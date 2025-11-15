'use server';

import connectDB from '@/lib/mongodb';
import Topic from '@/models/Topic';
import Post from '@/models/Post';
import { generateSlug } from '@/lib/utils/slug';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const topicSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export async function createTopic(formData: FormData) {
  try {
    await connectDB();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    
    const validated = topicSchema.parse({ name, description: description || undefined });
    const slug = generateSlug(validated.name);
    
    // Check if slug already exists
    const existing = await Topic.findOne({ slug });
    
    if (existing) {
      throw new Error('Topic with this name already exists');
    }
    
    const topic = await Topic.create({
      name: validated.name,
      slug,
      description: validated.description,
    });
    
    const topicDoc = topic as any;
    
    revalidatePath('/topics');
    revalidatePath('/');
    
    return {
      success: true,
      topic: {
        id: topicDoc._id.toString(),
        _id: topicDoc._id.toString(),
        name: topicDoc.name,
        slug: topicDoc.slug,
        description: topicDoc.description,
        createdAt: topicDoc.createdAt instanceof Date 
          ? topicDoc.createdAt.toISOString() 
          : new Date(topicDoc.createdAt).toISOString(),
        updatedAt: topicDoc.updatedAt instanceof Date 
          ? topicDoc.updatedAt.toISOString() 
          : new Date(topicDoc.updatedAt).toISOString(),
      },
    };
  } catch (error) {
    console.error('Error creating topic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create topic',
    };
  }
}

export async function updateTopic(id: string, formData: FormData) {
  try {
    await connectDB();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    
    const validated = topicSchema.parse({ name, description: description || undefined });
    const slug = generateSlug(validated.name);
    
    // Check if slug already exists for a different topic
    const existing = await Topic.findOne({ slug, _id: { $ne: id } });
    
    if (existing) {
      throw new Error('Topic with this name already exists');
    }
    
    const topic = await Topic.findByIdAndUpdate(
      id,
      {
        name: validated.name,
        slug,
        description: validated.description,
      },
      { new: true, runValidators: true }
    ).lean();
    
    if (!topic) {
      return { success: false, error: 'Topic not found' };
    }
    
    const topicDoc = topic as any;
    
    revalidatePath('/topics');
    revalidatePath(`/topics/${id}`);
    revalidatePath('/');
    
    return {
      success: true,
      topic: {
        id: topicDoc._id.toString(),
        _id: topicDoc._id.toString(),
        name: topicDoc.name,
        slug: topicDoc.slug,
        description: topicDoc.description,
        createdAt: topicDoc.createdAt instanceof Date 
          ? topicDoc.createdAt.toISOString() 
          : new Date(topicDoc.createdAt).toISOString(),
        updatedAt: topicDoc.updatedAt instanceof Date 
          ? topicDoc.updatedAt.toISOString() 
          : new Date(topicDoc.updatedAt).toISOString(),
      },
    };
  } catch (error) {
    console.error('Error updating topic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update topic',
    };
  }
}

export async function deleteTopic(id: string) {
  try {
    await connectDB();
    
    // Check if topic has posts
    const postCount = await Post.countDocuments({ topicId: id });
    
    if (postCount > 0) {
      throw new Error(`Cannot delete topic with ${postCount} post(s). Please delete or move posts first.`);
    }
    
    await Topic.findByIdAndDelete(id);
    
    revalidatePath('/topics');
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting topic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete topic',
    };
  }
}

export async function getTopics() {
  try {
    await connectDB();
    
    const topics = await Topic.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    // Get post counts for each topic
    const topicsWithCount = await Promise.all(
      topics.map(async (topic: any) => {
        const postCount = await Post.countDocuments({ topicId: topic._id });
        return {
          id: topic._id.toString(),
          _id: topic._id.toString(),
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
          createdAt: topic.createdAt instanceof Date 
            ? topic.createdAt.toISOString() 
            : typeof topic.createdAt === 'string' 
              ? topic.createdAt 
              : new Date(topic.createdAt).toISOString(),
          updatedAt: topic.updatedAt instanceof Date 
            ? topic.updatedAt.toISOString() 
            : typeof topic.updatedAt === 'string'
              ? topic.updatedAt
              : new Date(topic.updatedAt).toISOString(),
          _count: { posts: postCount },
        };
      })
    );
    
    return { success: true, topics: topicsWithCount };
  } catch (error) {
    console.error('Error fetching topics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch topics',
      topics: [],
    };
  }
}

export async function getTopic(id: string) {
  try {
    await connectDB();
    
    const topic = await Topic.findById(id).lean();
    
    if (!topic) {
      return { success: false, error: 'Topic not found' };
    }
    
    const postCount = await Post.countDocuments({ topicId: id });
    
    const topicDoc = topic as any;
    
    return {
      success: true,
      topic: {
        id: topicDoc._id.toString(),
        _id: topicDoc._id.toString(),
        name: topicDoc.name,
        slug: topicDoc.slug,
        description: topicDoc.description,
        createdAt: topicDoc.createdAt instanceof Date 
          ? topicDoc.createdAt.toISOString() 
          : typeof topicDoc.createdAt === 'string' 
            ? topicDoc.createdAt 
            : new Date(topicDoc.createdAt).toISOString(),
        updatedAt: topicDoc.updatedAt instanceof Date 
          ? topicDoc.updatedAt.toISOString() 
          : typeof topicDoc.updatedAt === 'string'
            ? topicDoc.updatedAt
            : new Date(topicDoc.updatedAt).toISOString(),
        _count: { posts: postCount },
      },
    };
  } catch (error) {
    console.error('Error fetching topic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch topic',
    };
  }
}
