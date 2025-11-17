'use server';

import connectDB from '@/lib/mongodb';
import { Article, ArticleStatus as BlogStatus, Topic, GeneratedAsset, AssetKind } from '@cptsd/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { transcribeYouTubeVideo, getYouTubeVideoMetadata } from '@/lib/youtube';
import { generateBlogFromTranscription } from '@/lib/blogGeneration';
import { generateBlogImages, insertBlogImagesIntoContent } from '@/lib/blogImageGeneration';
import { ensureUniqueSlug } from '@/lib/utils/slug';
import { searchStockImages, downloadStockImage, getSuggestedImageQueries } from '@/lib/stockImages';
import { generateBlogTopics, generateTopicsFromContent } from '@/lib/blogTopics';
import { uploadToS3 } from '@/lib/s3';
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
    const slug = formData.get('slug') as string | null;
    const youtubeUrl = formData.get('youtubeUrl') as string | null;
    const topicId = formData.get('topicId') as string | null;
    const category = formData.get('category') as string | null;
    const customContentRaw = formData.get('customContent') as string | null;
    const seoTitle = formData.get('seoTitle') as string | null;
    const metaDescription = formData.get('metaDescription') as string | null;
    const purpose = formData.get('purpose') as string | null;
    const targetReader = formData.get('targetReader') as string | null;
    const estimatedReadTime = formData.get('estimatedReadTime') as string | null;
    const tagsJson = formData.get('tags') as string | null;
    const relatedArticlesJson = formData.get('relatedArticles') as string | null;
    const isLearnResource = formData.get('isLearnResource') === 'true';
    const featured = formData.get('featured') === 'true';
    
    // Handle "$undefined" string from Next.js serialization
    const customContent = customContentRaw && customContentRaw !== '$undefined' ? customContentRaw : null;

    // Generate slug from title if not provided
    let finalSlug = slug;
    if (!finalSlug || finalSlug.trim() === '') {
      finalSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Ensure unique slug
    const uniqueSlug = await ensureUniqueSlug(
      finalSlug,
      async (s) => {
        const existing = await Article.findOne({ slug: s }).lean();
        return !!existing;
      }
    );

    // Parse tags
    let tags: string[] = [];
    if (tagsJson && tagsJson !== '' && tagsJson !== '$undefined') {
      try {
        tags = JSON.parse(tagsJson);
      } catch (e) {
        // If not JSON, treat as comma-separated string
        tags = tagsJson.split(',').map(t => t.trim()).filter(t => t.length > 0);
      }
    }

    // Parse related articles
    let relatedArticles: mongoose.Types.ObjectId[] = [];
    if (relatedArticlesJson && relatedArticlesJson !== '' && relatedArticlesJson !== '$undefined') {
      try {
        const articleIds = JSON.parse(relatedArticlesJson);
        if (Array.isArray(articleIds)) {
          relatedArticles = articleIds.map(id => new mongoose.Types.ObjectId(id));
        }
      } catch (e) {
        console.error('Error parsing related articles:', e);
      }
    }

    const blog = await Article.create({
      title,
      slug: uniqueSlug,
      content,
      youtubeUrl: youtubeUrl || undefined,
      topicId: topicId || undefined,
      category: category || undefined,
      customContent: customContent || undefined,
      seoTitle: seoTitle || undefined,
      seoDescription: metaDescription || undefined,
      metaDescription: metaDescription || undefined,
      purpose: purpose || undefined,
      targetReader: targetReader || undefined,
      estimatedReadTime: estimatedReadTime ? parseInt(estimatedReadTime, 10) : undefined,
      readingTime: estimatedReadTime ? parseInt(estimatedReadTime, 10) : undefined,
      tags: tags.length > 0 ? tags : undefined,
      relatedArticles: relatedArticles.length > 0 ? relatedArticles : undefined,
      isLearnResource: isLearnResource || undefined,
      featured: featured || undefined,
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
    const category = formData.get('category') as string | null;
    const tagsJson = formData.get('tags') as string | null;
    const customContent = formData.get('customContent') as string | null;
    const seoTitle = formData.get('seoTitle') as string | null;
    const seoDescription = formData.get('seoDescription') as string | null;
    const metaDescription = formData.get('metaDescription') as string | null;
    const purpose = formData.get('purpose') as string | null;
    const targetReader = formData.get('targetReader') as string | null;
    const estimatedReadTime = formData.get('estimatedReadTime') as string | null;
    const relatedArticlesJson = formData.get('relatedArticles') as string | null;
    const isLearnResource = formData.get('isLearnResource') as string | null;
    const featured = formData.get('featured') as string | null;

    const updateData: any = {};

    if (title !== null) updateData.title = title;
    if (slug !== null) {
      // Ensure unique slug
      const uniqueSlug = await ensureUniqueSlug(
        slug,
        async (s) => {
          const existing = await Article.findOne({ slug: s, _id: { $ne: id } }).lean();
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
    if (category !== null) updateData.category = category || undefined;
    // Handle customContent - check for "$undefined" string (Next.js serialization issue)
    if (customContent !== null && customContent !== '' && customContent !== '$undefined') {
      updateData.customContent = customContent;
    } else if (customContent === '' || customContent === '$undefined') {
      updateData.customContent = undefined;
    }
    
    if (seoTitle !== null) updateData.seoTitle = seoTitle || undefined;
    if (seoDescription !== null) updateData.seoDescription = seoDescription || undefined;
    if (metaDescription !== null) {
      updateData.metaDescription = metaDescription || undefined;
      // Sync with seoDescription if seoDescription is not set
      if (!updateData.seoDescription && metaDescription) {
        updateData.seoDescription = metaDescription;
      }
    }
    if (purpose !== null) updateData.purpose = purpose || undefined;
    if (targetReader !== null) updateData.targetReader = targetReader || undefined;
    if (estimatedReadTime !== null) {
      const readTime = estimatedReadTime ? parseInt(estimatedReadTime, 10) : undefined;
      updateData.estimatedReadTime = readTime;
      updateData.readingTime = readTime; // Sync with readingTime
    }

    // Handle tags - can be JSON array or comma-separated string
    if (tagsJson !== null && tagsJson !== '' && tagsJson !== '$undefined') {
      try {
        // Try parsing as JSON first
        const tags = JSON.parse(tagsJson);
        if (Array.isArray(tags)) {
          updateData.tags = tags;
        }
      } catch (e) {
        // If not JSON, treat as comma-separated string
        const tags = tagsJson
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
        if (tags.length > 0) {
          updateData.tags = tags;
        }
      }
    } else if (tagsJson === '' || tagsJson === '$undefined') {
      updateData.tags = [];
    }

    // Handle related articles
    if (relatedArticlesJson !== null && relatedArticlesJson !== '' && relatedArticlesJson !== '$undefined') {
      try {
        const articleIds = JSON.parse(relatedArticlesJson);
        if (Array.isArray(articleIds)) {
          updateData.relatedArticles = articleIds.map((aid: string) => new mongoose.Types.ObjectId(aid));
        }
      } catch (e) {
        console.error('Error parsing related articles:', e);
      }
    } else if (relatedArticlesJson === '' || relatedArticlesJson === '$undefined') {
      updateData.relatedArticles = [];
    }

    if (isLearnResource !== null) {
      updateData.isLearnResource = isLearnResource === 'true';
    }

    if (featured !== null) {
      updateData.featured = featured === 'true';
    }

    // Set publishedAt if status is PUBLISHED
    if (status === 'PUBLISHED' && !updateData.publishedAt) {
      const existingBlog = await Article.findById(id).lean();
      if (!existingBlog?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const blog = await Article.findByIdAndUpdate(id, updateData, {
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
    await Article.findByIdAndDelete(id);

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

    const blogs = await Article.find(query)
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

    const blog = await Article.findById(id).populate('topicId').lean();

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

    const blog = await Article.findOne({ slug, status: BlogStatus.PUBLISHED })
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
  // Handle "$undefined" string from Next.js serialization
  const processedOptions = options ? {
    ...options,
    customContent: options.customContent && options.customContent !== '$undefined' ? options.customContent : undefined,
  } : undefined;
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
      title: processedOptions?.title || videoMetadata.title,
      customContent: processedOptions?.customContent,
      tone: processedOptions?.tone || 'gentle',
      includeImages: processedOptions?.includeImages !== false,
      rephrase: processedOptions?.rephrase || false,
      summarize: processedOptions?.summarize || false,
    });

    // Step 4: Generate images if requested
    let finalContent = blogResult.content;
    let images: any[] = [];

    if (processedOptions?.includeImages === true && blogResult.imagePositions.length > 0) {
      const generatedImages = await generateBlogImages(
        blogResult.imagePositions,
        blogResult.content,
        processedOptions?.tone || 'gentle'
      );

      // Download images from OpenAI and upload to S3
      const imagesWithS3Urls = await Promise.all(
        generatedImages.map(async (img) => {
          try {
            // Download image from OpenAI URL (which expires after ~2 hours)
            const imageResponse = await fetch(img.url);
            if (imageResponse.ok) {
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              
              // Generate filename based on blog slug and timestamp
              const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
              
              // Upload to S3
              const s3Url = await uploadToS3(imageBuffer, fileName, 'blog-images');
              
              console.log(`✅ Downloaded and stored blog image: ${s3Url}`);
              
              return {
                ...img,
                url: s3Url, // Replace OpenAI URL with S3 URL
              };
            } else {
              console.warn(`⚠️ Failed to download image from ${img.url}, using OpenAI URL`);
              return img; // Fallback to OpenAI URL
            }
          } catch (error) {
            console.error(`❌ Error downloading/storing blog image:`, error);
            return img; // Fallback to OpenAI URL if download/storage fails
          }
        })
      );

      // Insert images into content with S3 URLs
      finalContent = insertBlogImagesIntoContent(blogResult.content, imagesWithS3Urls);

      // Transform to blog image format
      images = imagesWithS3Urls.map((img) => ({
        url: img.url,
        alt: img.alt,
        position: img.position,
        prompt: img.prompt,
        generatedAt: new Date(),
      }));
    }

    // Step 5: Ensure unique slug
    const uniqueSlug = await ensureUniqueSlug(
      blogResult.slug,
      async (s) => {
        const existing = await Article.findOne({ slug: s }).lean();
        return !!existing;
      }
    );

    // Step 6: Create blog post
    const blog = await Article.create({
      title: blogResult.title,
      slug: uniqueSlug,
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
      customContent: processedOptions?.customContent,
    });

    // Step 7: Save images to GeneratedAsset for gallery
    if (images.length > 0) {
      await Promise.all(
        images.map(async (img, index) => {
          try {
            await GeneratedAsset.create({
              blogId: new mongoose.Types.ObjectId(String(blog._id)),
              kind: AssetKind.IMAGE_FEED,
              size: '1024x1024',
              url: img.url,
              thumbnailUrl: img.url,
              metadata: {
                prompt: img.prompt,
                model: 'dall-e-3',
                revised_prompt: img.prompt,
              },
            });
          } catch (error) {
            console.error(`Error saving blog image to GeneratedAsset:`, error);
            // Don't fail the whole operation if asset saving fails
          }
        })
      );
    }

    revalidatePath('/blogs');
    revalidatePath('/');
    revalidatePath('/gallery');

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

    const blog = await Article.findById(id).lean();
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

    if (options?.regenerateImages === true && blogResult.imagePositions.length > 0) {
      const generatedImages = await generateBlogImages(
        blogResult.imagePositions,
        blogResult.content,
        options?.tone || 'gentle'
      );

      // Download images from OpenAI and upload to S3
      const imagesWithS3Urls = await Promise.all(
        generatedImages.map(async (img) => {
          try {
            // Download image from OpenAI URL (which expires after ~2 hours)
            const imageResponse = await fetch(img.url);
            if (imageResponse.ok) {
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              
              // Generate filename based on blog slug and timestamp
              const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
              
              // Upload to S3
              const s3Url = await uploadToS3(imageBuffer, fileName, 'blog-images');
              
              console.log(`✅ Downloaded and stored blog image: ${s3Url}`);
              
              return {
                ...img,
                url: s3Url, // Replace OpenAI URL with S3 URL
              };
            } else {
              console.warn(`⚠️ Failed to download image from ${img.url}, using OpenAI URL`);
              return img; // Fallback to OpenAI URL
            }
          } catch (error) {
            console.error(`❌ Error downloading/storing blog image:`, error);
            return img; // Fallback to OpenAI URL if download/storage fails
          }
        })
      );

      finalContent = insertBlogImagesIntoContent(blogResult.content, imagesWithS3Urls);

      images = imagesWithS3Urls.map((img) => ({
        url: img.url,
        alt: img.alt,
        position: img.position,
        prompt: img.prompt,
        generatedAt: new Date(),
      }));

      // Delete old GeneratedAsset entries for this blog and save new ones
      await GeneratedAsset.deleteMany({ blogId: new mongoose.Types.ObjectId(id) });
      
      // Save new images to GeneratedAsset for gallery
      await Promise.all(
        images.map(async (img) => {
          try {
            await GeneratedAsset.create({
              blogId: new mongoose.Types.ObjectId(id),
              kind: AssetKind.IMAGE_FEED,
              size: '1024x1024',
              url: img.url,
              thumbnailUrl: img.url,
              metadata: {
                prompt: img.prompt,
                model: 'dall-e-3',
                revised_prompt: img.prompt,
              },
            });
          } catch (error) {
            console.error(`Error saving blog image to GeneratedAsset:`, error);
          }
        })
      );
    }

    // Update blog
    const updatedBlog = await Article.findByIdAndUpdate(
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
    revalidatePath('/gallery');

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
  const blog = await Article.findById(id).populate('topicId').lean();
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
    estimatedReadTime: blog.estimatedReadTime || blog.readingTime || null,
    seoTitle: blog.seoTitle || null,
    seoDescription: blog.seoDescription || null,
    metaDescription: blog.metaDescription || blog.seoDescription || null,
    purpose: blog.purpose || null,
    targetReader: blog.targetReader || null,
    tags: blog.tags || [],
    category: blog.category || null,
    relatedArticles: blog.relatedArticles ? blog.relatedArticles.map((id: any) => String(id)) : [],
    isLearnResource: blog.isLearnResource || false,
    featured: blog.featured || false,
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

/**
 * Generate blog from a topic
 */
export async function generateBlogFromTopic(
  topicTitle: string,
  topicDescription: string,
  options?: {
    keyPoints?: string[];
    customContent?: string;
    tone?: 'educational' | 'validating' | 'gentle' | 'hopeful' | 'grounding';
    includeImages?: boolean;
  }
) {
  try {
    await connectDB();

    // Generate blog content from topic
    const blogResult = await generateBlogFromTranscription({
      topicTitle,
      topicDescription,
      topicKeyPoints: options?.keyPoints || [],
      title: topicTitle,
      customContent: options?.customContent,
      tone: options?.tone || 'gentle',
      includeImages: options?.includeImages !== false,
    });

    // Generate images if requested
    let finalContent = blogResult.content;
    let images: any[] = [];

    if (options?.includeImages === true && blogResult.imagePositions.length > 0) {
      const generatedImages = await generateBlogImages(
        blogResult.imagePositions,
        blogResult.content,
        options?.tone || 'gentle'
      );

      // Download images from OpenAI and upload to S3
      const imagesWithS3Urls = await Promise.all(
        generatedImages.map(async (img) => {
          try {
            const imageResponse = await fetch(img.url);
            if (imageResponse.ok) {
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
              const s3Url = await uploadToS3(imageBuffer, fileName, 'blog-images');
              console.log(`✅ Downloaded and stored blog image: ${s3Url}`);
              return { ...img, url: s3Url };
            } else {
              console.warn(`⚠️ Failed to download image from ${img.url}, using OpenAI URL`);
              return img;
            }
          } catch (error) {
            console.error(`❌ Error downloading/storing blog image:`, error);
            return img;
          }
        })
      );

      finalContent = insertBlogImagesIntoContent(blogResult.content, imagesWithS3Urls);
      images = imagesWithS3Urls.map((img) => ({
        url: img.url,
        alt: img.alt,
        position: img.position,
        prompt: img.prompt,
        generatedAt: new Date(),
      }));
    }

    // Ensure unique slug
    const uniqueSlug = await ensureUniqueSlug(
      blogResult.slug,
      async (s) => {
        const existing = await Article.findOne({ slug: s }).lean();
        return !!existing;
      }
    );

    // Create blog post
    const blog = await Article.create({
      title: blogResult.title,
      slug: uniqueSlug,
      excerpt: blogResult.excerpt,
      content: finalContent,
      summary: blogResult.summary,
      status: BlogStatus.DRAFT,
      featuredImage: images.length > 0 ? images[0].url : undefined,
      images,
      readingTime: blogResult.readingTime,
      seoTitle: blogResult.seoTitle,
      seoDescription: blogResult.seoDescription,
      tags: blogResult.suggestedTags,
      customContent: options?.customContent,
    });

    // Save images to GeneratedAsset for gallery
    if (images.length > 0) {
      await Promise.all(
        images.map(async (img) => {
          try {
            await GeneratedAsset.create({
              blogId: new mongoose.Types.ObjectId(String(blog._id)),
              kind: AssetKind.IMAGE_FEED,
              size: '1024x1024',
              url: img.url,
              thumbnailUrl: img.url,
              metadata: {
                prompt: img.prompt,
                model: 'dall-e-3',
                revised_prompt: img.prompt,
              },
            });
          } catch (error) {
            console.error(`Error saving blog image to GeneratedAsset:`, error);
          }
        })
      );
    }

    revalidatePath('/blogs');
    revalidatePath('/');
    revalidatePath('/gallery');

    return {
      success: true,
      blog: await transformBlog(String(blog._id)),
    };
  } catch (error) {
    console.error('Error generating blog from topic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate blog from topic',
    };
  }
}

