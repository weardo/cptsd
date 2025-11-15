'use server';

import connectDB from '@/lib/mongodb';
import Blog, { BlogStatus } from '@/models/Blog';
import Topic from '@/models/Topic';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { transcribeYouTubeVideo, getYouTubeVideoMetadata } from '@/lib/youtube';
import { generateBlogFromTranscription } from '@/lib/blogGeneration';
import { generateBlogImages, insertBlogImagesIntoContent } from '@/lib/blogImageGeneration';
import { ensureUniqueSlug } from '@/lib/utils/slug';
import { searchStockImages, downloadStockImage, getSuggestedImageQueries } from '@/lib/stockImages';
import { generateBlogTopics, generateTopicsFromContent } from '@/lib/blogTopics';
import mongoose from 'mongoose';

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  youtubeVideoId: z.string().optional(),
  transcription: z.string().optional(),
  summary: z.string().optional(),
  status: z.enum(['DRAFT', 'GENERATING', 'PUBLISHED', 'ARCHIVED']).optional(),
  featuredImage: z.string().optional(),
  topicId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customContent: z.string().optional(),
});

export async function createBlog(formData: FormData) {
  try {
    await connectDB();

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const youtubeUrl = formData.get('youtubeUrl') as string | null;
    const topicId = formData.get('topicId') as string | null;
    const customContent = formData.get('customContent') as string | null;

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure unique slug
    const slug = await ensureUniqueSlug(
      baseSlug,
      async (s) => {
        const existing = await Blog.findOne({ slug: s }).lean();
        return !!existing;
      }
    );

    const blog = await Blog.create({
      title,
      slug,
      content,
      youtubeUrl: youtubeUrl || undefined,
      topicId: topicId || undefined,
      customContent: customContent || undefined,
      status: BlogStatus.DRAFT,
    });

    revalidatePath('/blogs');
    revalidatePath('/');

    return {
      success: true,
      blog: await transformBlog(String(blog._id)),
    };
  } catch (error) {
    console.error('Error creating blog:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create blog',
    };
  }
}

export async function updateBlog(id: string, formData: FormData) {
  try {
    await connectDB();

    const title = formData.get('title') as string | null;
    const slug = formData.get('slug') as string | null;
    const excerpt = formData.get('excerpt') as string | null;
    const content = formData.get('content') as string | null;
    const status = formData.get('status') as string | null;
    const featuredImage = formData.get('featuredImage') as string | null;
    const topicId = formData.get('topicId') as string | null;
    const tagsJson = formData.get('tags') as string | null;
    const customContent = formData.get('customContent') as string | null;
    const seoTitle = formData.get('seoTitle') as string | null;
    const seoDescription = formData.get('seoDescription') as string | null;

    const updateData: any = {};

    if (title !== null) updateData.title = title;
    if (slug !== null) {
      // Ensure unique slug
      const uniqueSlug = await ensureUniqueSlug(
        slug,
        async (s) => {
          const existing = await Blog.findOne({ slug: s, _id: { $ne: id } }).lean();
          return !!existing;
        },
        id
      );
      updateData.slug = uniqueSlug;
    }
    if (excerpt !== null) updateData.excerpt = excerpt;
    if (content !== null) updateData.content = content;
    if (status !== null) updateData.status = status;
    if (featuredImage !== null) updateData.featuredImage = featuredImage || undefined;
    if (topicId !== null) updateData.topicId = topicId || undefined;
    if (customContent !== null) updateData.customContent = customContent || undefined;
    if (seoTitle !== null) updateData.seoTitle = seoTitle || undefined;
    if (seoDescription !== null) updateData.seoDescription = seoDescription || undefined;

    if (tagsJson !== null) {
      try {
        const tags = JSON.parse(tagsJson);
        if (Array.isArray(tags)) {
          updateData.tags = tags;
        }
      } catch (e) {
        console.error('Error parsing tags:', e);
      }
    }

    // Set publishedAt if status is PUBLISHED
    if (status === 'PUBLISHED' && !updateData.publishedAt) {
      const existingBlog = await Blog.findById(id).lean();
      if (!existingBlog?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const blog = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('topicId')
      .lean();

    if (!blog) {
      return { success: false, error: 'Blog not found' };
    }

    revalidatePath('/blogs');
    revalidatePath(`/blogs/${id}`);
    revalidatePath('/');

    return {
      success: true,
      blog: await transformBlogFromDoc(blog),
    };
  } catch (error) {
    console.error('Error updating blog:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update blog',
    };
  }
}

export async function deleteBlog(id: string) {
  try {
    await connectDB();
    await Blog.findByIdAndDelete(id);

    revalidatePath('/blogs');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting blog:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete blog',
    };
  }
}

export async function getBlogs(filters?: {
  status?: string;
  topicId?: string;
  search?: string;
  published?: boolean;
}) {
  try {
    await connectDB();

    if (!mongoose.models.Topic) {
      await import('@/models/Topic');
    }

    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.topicId) {
      query.topicId = filters.topicId;
    }

    if (filters?.published) {
      query.status = BlogStatus.PUBLISHED;
      query.publishedAt = { $lte: new Date() };
    }

    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { content: { $regex: filters.search, $options: 'i' } },
        { excerpt: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const blogs = await Blog.find(query)
      .populate('topicId')
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      blogs: blogs.map((blog) => transformBlogFromDoc(blog)),
    };
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch blogs',
      blogs: [],
    };
  }
}

export async function getBlog(id: string) {
  try {
    await connectDB();

    const blog = await Blog.findById(id).populate('topicId').lean();

    if (!blog) {
      return { success: false, error: 'Blog not found' };
    }

    return {
      success: true,
      blog: transformBlogFromDoc(blog),
    };
  } catch (error) {
    console.error('Error fetching blog:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch blog',
    };
  }
}

export async function getBlogBySlug(slug: string) {
  try {
    await connectDB();

    const blog = await Blog.findOne({ slug, status: BlogStatus.PUBLISHED })
      .populate('topicId')
      .lean();

    if (!blog) {
      return { success: false, error: 'Blog not found' };
    }

    return {
      success: true,
      blog: transformBlogFromDoc(blog),
    };
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch blog',
    };
  }
}

export async function transcribeAndGenerateBlog(
  youtubeUrl: string,
  options?: {
    title?: string;
    customContent?: string;
    tone?: 'educational' | 'validating' | 'gentle' | 'hopeful' | 'grounding';
    includeImages?: boolean;
    rephrase?: boolean;
    summarize?: boolean;
  }
) {
  try {
    await connectDB();

    // Step 1: Transcribe YouTube video
    const { transcription, rawTranscription, videoId } = await transcribeYouTubeVideo(youtubeUrl);

    // Step 2: Get video metadata
    let videoMetadata;
    try {
      videoMetadata = await getYouTubeVideoMetadata(youtubeUrl);
    } catch (error) {
      console.warn('Failed to fetch video metadata:', error);
      videoMetadata = { title: '', description: '', duration: 0, thumbnail: '' };
    }

    // Step 3: Generate blog content
    const blogResult = await generateBlogFromTranscription({
      transcription,
      title: options?.title || videoMetadata.title,
      customContent: options?.customContent,
      tone: options?.tone || 'gentle',
      includeImages: options?.includeImages !== false,
      rephrase: options?.rephrase || false,
      summarize: options?.summarize || false,
    });

    // Step 4: Generate images if requested
    let finalContent = blogResult.content;
    let images: any[] = [];

    if (options?.includeImages !== false && blogResult.imagePositions.length > 0) {
      const generatedImages = await generateBlogImages(
        blogResult.imagePositions,
        blogResult.content,
        options?.tone || 'gentle'
      );

      // Insert images into content
      finalContent = insertBlogImagesIntoContent(blogResult.content, generatedImages);

      // Transform to blog image format
      images = generatedImages.map((img) => ({
        url: img.url,
        alt: img.alt,
        position: img.position,
        prompt: img.prompt,
        generatedAt: new Date(),
      }));
    }

    // Step 5: Create blog post
    const blog = await Blog.create({
      title: blogResult.title,
      slug: blogResult.slug,
      excerpt: blogResult.excerpt,
      content: finalContent,
      youtubeUrl,
      youtubeVideoId: videoId,
      transcription,
      transcriptionRaw: rawTranscription,
      summary: blogResult.summary,
      status: BlogStatus.DRAFT,
      featuredImage: images.length > 0 ? images[0].url : videoMetadata.thumbnail,
      images,
      readingTime: blogResult.readingTime,
      seoTitle: blogResult.seoTitle,
      seoDescription: blogResult.seoDescription,
      tags: blogResult.suggestedTags,
      customContent: options?.customContent,
    });

    revalidatePath('/blogs');
    revalidatePath('/');

    return {
      success: true,
      blog: await transformBlog(String(blog._id)),
    };
  } catch (error) {
    console.error('Error transcribing and generating blog:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to transcribe and generate blog',
    };
  }
}

export async function regenerateBlog(
  id: string,
  options?: {
    rephrase?: boolean;
    summarize?: boolean;
    regenerateImages?: boolean;
    customContent?: string;
    tone?: 'educational' | 'validating' | 'gentle' | 'hopeful' | 'grounding';
  }
) {
  try {
    await connectDB();

    const blog = await Blog.findById(id).lean();
    if (!blog) {
      return { success: false, error: 'Blog not found' };
    }

    if (!blog.transcription) {
      return { success: false, error: 'Blog does not have transcription to regenerate from' };
    }

    // Save current content to history
    const historyEntry = {
      timestamp: new Date(),
      content: blog.content,
      note: 'Before regeneration',
    };

    // Generate new content
    const blogResult = await generateBlogFromTranscription({
      transcription: blog.transcription,
      title: blog.title,
      customContent: options?.customContent || blog.customContent,
      tone: options?.tone || 'gentle',
      includeImages: options?.regenerateImages !== false,
      rephrase: options?.rephrase || false,
      summarize: options?.summarize || false,
    });

    // Generate images if requested
    let finalContent = blogResult.content;
    let images = blog.images || [];

    if (options?.regenerateImages !== false && blogResult.imagePositions.length > 0) {
      const generatedImages = await generateBlogImages(
        blogResult.imagePositions,
        blogResult.content,
        options?.tone || 'gentle'
      );

      finalContent = insertBlogImagesIntoContent(blogResult.content, generatedImages);

      images = generatedImages.map((img) => ({
        url: img.url,
        alt: img.alt,
        position: img.position,
        prompt: img.prompt,
        generatedAt: new Date(),
      }));
    }

    // Update blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        content: finalContent,
        excerpt: blogResult.excerpt,
        summary: blogResult.summary,
        images,
        readingTime: blogResult.readingTime,
        seoTitle: blogResult.seoTitle,
        seoDescription: blogResult.seoDescription,
        tags: blogResult.suggestedTags,
        $push: { regenerationHistory: historyEntry },
      },
      { new: true, runValidators: true }
    )
      .populate('topicId')
      .lean();

    if (!updatedBlog) {
      return { success: false, error: 'Failed to update blog' };
    }

    revalidatePath('/blogs');
    revalidatePath(`/blogs/${id}`);
    revalidatePath('/');

    return {
      success: true,
      blog: transformBlogFromDoc(updatedBlog),
    };
  } catch (error) {
    console.error('Error regenerating blog:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate blog',
    };
  }
}

// Helper functions
async function transformBlog(id: string) {
  const blog = await Blog.findById(id).populate('topicId').lean();
  if (!blog) throw new Error('Blog not found');
  return transformBlogFromDoc(blog);
}

function transformBlogFromDoc(blog: any) {
  const topic = blog.topicId;
  return {
    id: String(blog._id),
    _id: String(blog._id),
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt || null,
    content: blog.content,
    youtubeUrl: blog.youtubeUrl || null,
    youtubeVideoId: blog.youtubeVideoId || null,
    transcription: blog.transcription || null,
    transcriptionRaw: blog.transcriptionRaw || null,
    summary: blog.summary || null,
    status: blog.status,
    featuredImage: blog.featuredImage || null,
    images: blog.images || [],
    topicId: typeof topic === 'object' && topic?._id ? String(topic._id) : topic ? String(topic) : null,
    topic: typeof topic === 'object' && topic
      ? {
          id: String(topic._id),
          _id: String(topic._id),
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
        }
      : null,
    authorId: blog.authorId ? String(blog.authorId) : null,
    publishedAt: blog.publishedAt || null,
    readingTime: blog.readingTime || null,
    seoTitle: blog.seoTitle || null,
    seoDescription: blog.seoDescription || null,
    tags: blog.tags || [],
    customContent: blog.customContent || null,
    regenerationHistory: blog.regenerationHistory || [],
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
  };
}

/**
 * Search for stock images
 */
export async function searchBlogStockImages(query: string, page: number = 1) {
  try {
    const images = await searchStockImages(query, page, 20);
    return {
      success: true,
      images,
    };
  } catch (error) {
    console.error('Error searching stock images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search stock images',
      images: [],
    };
  }
}

/**
 * Get suggested image queries based on content
 */
export async function getBlogImageQueries(content: string) {
  try {
    const queries = await getSuggestedImageQueries(content);
    return {
      success: true,
      queries,
    };
  } catch (error) {
    console.error('Error getting image queries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get image queries',
      queries: [],
    };
  }
}

/**
 * Generate blog topics using AI
 */
export async function generateBlogTopicsAI(theme: string, count: number = 5) {
  try {
    const topics = await generateBlogTopics(theme, count);
    return {
      success: true,
      topics,
    };
  } catch (error) {
    console.error('Error generating blog topics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate topics',
      topics: [],
    };
  }
}

/**
 * Generate blog topics from content
 */
export async function generateBlogTopicsFromContent(content: string, count: number = 5) {
  try {
    const topics = await generateTopicsFromContent(content, count);
    return {
      success: true,
      topics,
    };
  } catch (error) {
    console.error('Error generating topics from content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate topics',
      topics: [],
    };
  }
}

