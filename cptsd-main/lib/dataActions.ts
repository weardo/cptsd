import connectDB from './mongodb';
import { Article, ArticleStatus as BlogStatus } from '@cptsd/db';
import Story, { StoryStatus } from '@cptsd/db/models/Story';
import Resource, { ResourceType } from '@cptsd/db/models/Resource';
import mongoose from 'mongoose';

// Blog/Article helpers
export async function getPublishedBlogs(filters?: {
  limit?: number;
  skip?: number;
  category?: string;
  tags?: string[];
}) {
  try {
    await connectDB();

    const query: any = {
      status: BlogStatus.PUBLISHED,
      publishedAt: { $lte: new Date() },
    };

    if (filters?.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    const blogs = await Article.find(query)
      .sort({ publishedAt: -1 })
      .limit(filters?.limit || 10)
      .skip(filters?.skip || 0)
      .lean();

    return blogs.map((blog) => ({
      id: blog._id.toString(),
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || blog.summary || null,
      featuredImage: blog.featuredImage || null,
      publishedAt: blog.publishedAt,
      tags: blog.tags || [],
    }));
  } catch (error) {
    // Handle missing MONGODB_URI gracefully
    if (error instanceof Error && error.message.includes('MONGODB_URI is not set')) {
      console.warn('⚠️  MongoDB not configured. Returning empty blogs list.');
      return [];
    }
    console.error('Error fetching blogs:', error);
    return [];
  }
}

export async function getBlogsByCategory() {
  try {
    await connectDB();

    const categories = {
      BASICS: ['basics', 'introduction', 'what-is-cptsd'],
      INDIA_CONTEXT: ['india', 'indian-context', 'cultural'],
      DAILY_LIFE: ['daily-life', 'living-with', 'coping'],
      HEALING: ['healing', 'recovery', 'therapy', 'treatment'],
      RELATIONSHIPS: ['relationships', 'family', 'friends', 'boundaries'],
    };

    const result: Record<string, any[]> = {};

    for (const [category, tagPatterns] of Object.entries(categories)) {
      const query: any = {
        status: BlogStatus.PUBLISHED,
        publishedAt: { $lte: new Date() },
        $or: tagPatterns.map((pattern) => ({
          tags: { $regex: pattern, $options: 'i' },
        })),
      };

      const blogs = await Article.find(query)
        .sort({ publishedAt: -1 })
        .limit(5)
        .lean();

      result[category] = blogs.map((blog) => ({
        id: blog._id.toString(),
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt || blog.summary || null,
      }));
    }

    return result;
  } catch (error) {
    // Handle missing MONGODB_URI gracefully during build
    if (error instanceof Error && (error.message.includes('MONGODB_URI is not set') || error.message.includes('buffering timed out'))) {
      console.warn('⚠️  MongoDB not configured or connection timeout. Returning empty category blogs.');
      return {};
    }
    console.error('Error fetching blogs by category:', error);
    return {};
  }
}

// Story helpers
export async function getApprovedStories(limit?: number) {
  try {
    await connectDB();

    const stories = await Story.find({ status: StoryStatus.APPROVED })
      .sort({ approvedAt: -1, createdAt: -1 })
      .limit(limit || 10)
      .lean();

    return stories.map((story) => ({
      id: story._id.toString(),
      pseudonym: story.pseudonym,
      title: story.title || story.body.substring(0, 50) + '...',
      excerpt: story.body.substring(0, 200),
      createdAt: story.createdAt,
    }));
  } catch (error) {
    // Handle missing MONGODB_URI gracefully
    if (error instanceof Error && error.message.includes('MONGODB_URI is not set')) {
      console.warn('⚠️  MongoDB not configured. Returning empty stories list.');
      return [];
    }
    console.error('Error fetching stories:', error);
    return [];
  }
}

export async function getStoryById(id: string) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const story = await Story.findOne({
      _id: id,
      status: StoryStatus.APPROVED,
    }).lean();

    if (!story) {
      return null;
    }

    return {
      id: story._id.toString(),
      pseudonym: story.pseudonym,
      title: story.title || null,
      body: story.body,
      createdAt: story.createdAt,
    };
  } catch (error) {
    // Handle missing MONGODB_URI gracefully
    if (error instanceof Error && error.message.includes('MONGODB_URI is not set')) {
      console.warn('⚠️  MongoDB not configured. Story not found.');
      return null;
    }
    console.error('Error fetching story:', error);
    return null;
  }
}

// Resource helpers
export async function getResourcesByType(type: ResourceType) {
  try {
    await connectDB();

    const resources = await Resource.find({
      type,
      status: 'ACTIVE',
    })
      .sort({ featured: -1, createdAt: -1 })
      .lean();

    return resources.map((resource) => ({
      id: resource._id.toString(),
      title: resource.title,
      description: resource.description,
      url: resource.url || null,
      phone: resource.phone || null,
      region: resource.region || null,
      languages: resource.languages || [],
      tags: resource.tags || [],
      isFeatured: resource.isFeatured || resource.featured || false,
      featured: resource.featured || resource.isFeatured || false,
    }));
  } catch (error) {
    // Handle missing MONGODB_URI gracefully
    if (error instanceof Error && error.message.includes('MONGODB_URI is not set')) {
      console.warn('⚠️  MongoDB not configured. Returning empty resources list.');
      return [];
    }
    console.error('Error fetching resources:', error);
    return [];
  }
}

export async function getAllResources() {
  try {
    await connectDB();

    const resources = await Resource.find({
      status: 'ACTIVE',
    })
      .sort({ type: 1, featured: -1, createdAt: -1 })
      .lean();

    const grouped: Record<string, any[]> = {};

    resources.forEach((resource) => {
      const type = resource.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push({
        id: resource._id.toString(),
        title: resource.title,
        description: resource.description,
        url: resource.url || null,
        phone: resource.phone || null,
        region: resource.region || null,
        languages: resource.languages || [],
        tags: resource.tags || [],
        isFeatured: resource.isFeatured || resource.featured || false,
        featured: resource.featured || resource.isFeatured || false,
      });
    });

    return grouped;
  } catch (error) {
    // Handle missing MONGODB_URI gracefully during build
    if (error instanceof Error && (error.message.includes('MONGODB_URI is not set') || error.message.includes('buffering timed out'))) {
      console.warn('⚠️  MongoDB not configured or connection timeout. Returning empty resources.');
      return {};
    }
    console.error('Error fetching all resources:', error);
    return {};
  }
}

