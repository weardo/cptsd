'use server';

import connectDB from '@/lib/mongodb';
import Post, { PostType, PostStatus } from '@cptsd/db/models/Post';
import Topic from '@cptsd/db/models/Topic';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateContentForPost } from '@/lib/openai-direct';
import mongoose from 'mongoose';

const postSchema = z.object({
  topicId: z.string().min(1, 'Topic ID is required'), // MongoDB ObjectId as string
  postType: z.enum(['CAROUSEL', 'REEL', 'STORY', 'MEME']),
  status: z.enum(['DRAFT', 'GENERATED', 'APPROVED', 'POSTED']).optional(),
  rawIdea: z.string().min(1, 'Raw idea is required'),
  script: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.string().optional(),
  finchScreenshotUrl: z.string().url().optional().or(z.literal('')),
  platforms: z.array(z.string()).optional(),
});

export async function createPost(formData: FormData) {
  try {
    await connectDB();
    
    const topicId = formData.get('topicId') as string;
    const postType = formData.get('postType') as string;
    const rawIdea = formData.get('rawIdea') as string;
    const finchScreenshotUrl = formData.get('finchScreenshotUrl') as string | null;
    
    const validated = postSchema.parse({
      topicId,
      postType,
      rawIdea,
      finchScreenshotUrl: finchScreenshotUrl || undefined,
    });
    
    const post = await Post.create({
      topicId: validated.topicId,
      postType: validated.postType as PostType,
      status: PostStatus.DRAFT,
      rawIdea: validated.rawIdea,
      finchScreenshotUrl: validated.finchScreenshotUrl || undefined,
    });
    
    // Populate topic and transform to expected format
    const populatedPost = await Post.findById(post._id).populate('topicId').lean();
    
    if (!populatedPost) {
      throw new Error('Failed to create post');
    }
    
    const topic = (populatedPost as any).topicId;
    
    revalidatePath('/posts');
    revalidatePath('/');
    
    return {
      success: true,
      post: {
        id: populatedPost._id.toString(),
        _id: populatedPost._id.toString(),
        topicId: typeof topic === 'object' ? topic._id.toString() : topic.toString(),
        topic: typeof topic === 'object' ? {
          id: topic._id.toString(),
          _id: topic._id.toString(),
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
        } : null,
        postType: populatedPost.postType,
        status: populatedPost.status,
        rawIdea: populatedPost.rawIdea,
        script: populatedPost.script,
        caption: populatedPost.caption,
        hashtags: populatedPost.hashtags,
        finchScreenshotUrl: populatedPost.finchScreenshotUrl,
        aiBackgroundUrls: populatedPost.aiBackgroundUrls,
        zipUrl: populatedPost.zipUrl,
        platforms: populatedPost.platforms,
        createdAt: populatedPost.createdAt,
        updatedAt: populatedPost.updatedAt,
        authorId: populatedPost.authorId?.toString(),
      },
    };
  } catch (error) {
    console.error('Error creating post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create post',
    };
  }
}

export async function updatePost(id: string, formData: FormData) {
  try {
    await connectDB();
    
    const script = formData.get('script') as string | null;
    const caption = formData.get('caption') as string | null;
    const hashtags = formData.get('hashtags') as string | null;
    const status = formData.get('status') as string | null;
    const finchScreenshotUrl = formData.get('finchScreenshotUrl') as string | null;
    const manualSlidePromptsJson = formData.get('manualSlidePrompts') as string | null;
    
    const updateData: any = {};
    
    if (script !== null) updateData.script = script;
    if (caption !== null) updateData.caption = caption;
    if (hashtags !== null) updateData.hashtags = hashtags;
    if (status !== null) updateData.status = status;
    if (finchScreenshotUrl !== null) updateData.finchScreenshotUrl = finchScreenshotUrl || null;
    
    // Handle manual slide prompts for carousel posts
    if (manualSlidePromptsJson !== null) {
      try {
        const prompts = JSON.parse(manualSlidePromptsJson);
        if (Array.isArray(prompts)) {
          updateData.manualSlidePrompts = prompts;
        }
      } catch (e) {
        console.error('Error parsing manualSlidePrompts:', e);
      }
    }
    
    const post = await Post.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('topicId')
      .lean();
    
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    
    const topic = (post as any).topicId;
    
    revalidatePath('/posts');
    revalidatePath(`/posts/${id}`);
    revalidatePath('/');
    
    return {
      success: true,
      post: {
        id: post._id.toString(),
        _id: post._id.toString(),
        topicId: typeof topic === 'object' ? topic._id.toString() : topic.toString(),
        topic: typeof topic === 'object' ? {
          id: topic._id.toString(),
          _id: topic._id.toString(),
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
        } : null,
        postType: post.postType,
        status: post.status,
        rawIdea: post.rawIdea,
        script: post.script || null,
        caption: post.caption || null,
        hashtags: post.hashtags || null,
        finchScreenshotUrl: post.finchScreenshotUrl || null,
        aiBackgroundUrls: post.aiBackgroundUrls || null,
        zipUrl: post.zipUrl || null,
        platforms: post.platforms || null,
        manualSlidePrompts: post.manualSlidePrompts || null,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        authorId: post.authorId?.toString() || null,
      },
    };
  } catch (error) {
    console.error('Error updating post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update post',
    };
  }
}

export async function deletePost(id: string) {
  try {
    await connectDB();
    await Post.findByIdAndDelete(id);
    
    revalidatePath('/posts');
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete post',
    };
  }
}

export async function getPosts(filters?: {
  topicId?: string;
  postType?: string;
  status?: string;
  search?: string;
}) {
  try {
    await connectDB();
    
    // Ensure Topic model is registered before populate
    if (!mongoose.models.Topic) {
      // Force import and registration of Topic model
      await import('@/models/Topic');
    }
    
    const query: any = {};
    
    if (filters?.topicId) {
      query.topicId = filters.topicId;
    }
    
    if (filters?.postType) {
      query.postType = filters.postType;
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    if (filters?.search) {
      query.$or = [
        { rawIdea: { $regex: filters.search, $options: 'i' } },
        { script: { $regex: filters.search, $options: 'i' } },
        { caption: { $regex: filters.search, $options: 'i' } },
      ];
    }
    
    const posts = await Post.find(query)
      .populate('topicId')
      .sort({ createdAt: -1 })
      .lean();
    
    // Transform MongoDB documents to match expected format
    const transformedPosts = posts.map((post: any) => ({
      id: post._id.toString(),
      _id: post._id.toString(),
      topicId: typeof post.topicId === 'object' ? post.topicId._id.toString() : post.topicId.toString(),
      topic: typeof post.topicId === 'object' ? {
        id: post.topicId._id.toString(),
        _id: post.topicId._id.toString(),
        name: post.topicId.name,
        slug: post.topicId.slug,
        description: post.topicId.description,
      } : null,
      postType: post.postType,
      status: post.status,
      rawIdea: post.rawIdea,
      script: post.script,
      caption: post.caption,
      hashtags: post.hashtags,
      finchScreenshotUrl: post.finchScreenshotUrl,
      aiBackgroundUrls: post.aiBackgroundUrls,
      zipUrl: post.zipUrl,
      platforms: post.platforms,
      manualSlidePrompts: post.manualSlidePrompts || null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      authorId: post.authorId?.toString(),
    }));
    
    return {
      success: true,
      posts: transformedPosts,
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch posts',
      posts: [],
    };
  }
}

export async function getPost(id: string) {
  try {
    await connectDB();
    
    const post = await Post.findById(id).populate('topicId').lean();
    
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    
    const topic = (post as any).topicId;
    
    return {
      success: true,
      post: {
        id: post._id.toString(),
        _id: post._id.toString(),
        topicId: typeof topic === 'object' ? topic._id.toString() : topic.toString(),
        topic: typeof topic === 'object' ? {
          id: topic._id.toString(),
          _id: topic._id.toString(),
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
        } : null,
        postType: post.postType,
        status: post.status,
        rawIdea: post.rawIdea,
        script: post.script || null,
        caption: post.caption || null,
        hashtags: post.hashtags || null,
        finchScreenshotUrl: post.finchScreenshotUrl || null,
        aiBackgroundUrls: post.aiBackgroundUrls || null,
        zipUrl: post.zipUrl || null,
        platforms: post.platforms || null,
        manualSlidePrompts: post.manualSlidePrompts || null,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        authorId: post.authorId?.toString() || null,
      },
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch post',
    };
  }
}

export async function generateContentWithAI(
  postId: string,
  tone: 'educational' | 'validating' | 'gentle-cta' = 'educational',
  model?: string,
  systemPrompt?: string
) {
  try {
    const post = await generateContentForPost(postId, tone, model, systemPrompt);
    
    // Ensure all optional fields are null instead of undefined
    const normalizedPost = {
      ...post,
      script: post.script || null,
      caption: post.caption || null,
      hashtags: post.hashtags || null,
      finchScreenshotUrl: post.finchScreenshotUrl || null,
      aiBackgroundUrls: post.aiBackgroundUrls || null,
      zipUrl: post.zipUrl || null,
      platforms: post.platforms || null,
      authorId: post.authorId || null,
    };
    
    revalidatePath('/posts');
    revalidatePath(`/posts/${postId}`);
    revalidatePath('/');
    
    return { success: true, post: normalizedPost };
  } catch (error) {
    console.error('Error generating content with AI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate content',
    };
  }
}

// Keep old function name for backwards compatibility
export const generateContentWithN8n = generateContentWithAI;

export async function updatePostStatus(id: string, status: 'DRAFT' | 'GENERATED' | 'APPROVED' | 'POSTED') {
  try {
    await connectDB();
    
    const post = await Post.findByIdAndUpdate(
      id,
      { status: status as PostStatus },
      { new: true, runValidators: true }
    )
      .populate('topicId')
      .lean();
    
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    
    revalidatePath('/posts');
    revalidatePath(`/posts/${id}`);
    revalidatePath('/');
    
    const topic = (post as any).topicId;
    
    return {
      success: true,
      post: {
        id: post._id.toString(),
        _id: post._id.toString(),
        topicId: typeof topic === 'object' ? topic._id.toString() : topic.toString(),
        topic: typeof topic === 'object' ? {
          id: topic._id.toString(),
          _id: topic._id.toString(),
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
        } : null,
        postType: post.postType,
        status: post.status,
        rawIdea: post.rawIdea,
        script: post.script || null,
        caption: post.caption || null,
        hashtags: post.hashtags || null,
        finchScreenshotUrl: post.finchScreenshotUrl || null,
        aiBackgroundUrls: post.aiBackgroundUrls || null,
        zipUrl: post.zipUrl || null,
        platforms: post.platforms || null,
        manualSlidePrompts: post.manualSlidePrompts || null,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        authorId: post.authorId?.toString() || null,
      },
    };
  } catch (error) {
    console.error('Error updating post status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update post status',
    };
  }
}
