import connectDB from './mongodb';
import Blog, { BlogStatus } from '../models/Blog';
import Topic from '../models/Topic';
import mongoose from 'mongoose';

export async function getPublishedBlogs(filters?: {
  topicId?: string;
  search?: string;
  limit?: number;
  skip?: number;
}) {
  try {
    await connectDB();

    if (!mongoose.models.Topic) {
      await import('../models/Topic');
    }

    const query: any = {
      status: BlogStatus.PUBLISHED,
      publishedAt: { $lte: new Date() },
    };

    if (filters?.topicId) {
      query.topicId = filters.topicId;
    }

    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { content: { $regex: filters.search, $options: 'i' } },
        { excerpt: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } },
      ];
    }

    const blogs = await Blog.find(query)
      .populate('topicId')
      .sort({ publishedAt: -1 })
      .limit(filters?.limit || 10)
      .skip(filters?.skip || 0)
      .lean();

    const total = await Blog.countDocuments(query);

    return {
      blogs: blogs.map(transformBlog),
      total,
    };
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return {
      blogs: [],
      total: 0,
    };
  }
}

export async function getBlogBySlug(slug: string) {
  try {
    await connectDB();

    const blog = await Blog.findOne({
      slug,
      status: BlogStatus.PUBLISHED,
      publishedAt: { $lte: new Date() },
    })
      .populate('topicId')
      .lean();

    if (!blog) {
      return null;
    }

    return transformBlog(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    return null;
  }
}

export async function getRelatedBlogs(blogId: string, topicId?: string, tags?: string[], limit = 3) {
  try {
    await connectDB();

    const query: any = {
      _id: { $ne: blogId },
      status: BlogStatus.PUBLISHED,
      publishedAt: { $lte: new Date() },
    };

    // Find related by topic or tags
    if (topicId) {
      query.topicId = topicId;
    } else if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    const blogs = await Blog.find(query)
      .populate('topicId')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    return blogs.map(transformBlog);
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    return [];
  }
}

export async function getAllTopics() {
  try {
    await connectDB();

    const topics = await Topic.find().sort({ name: 1 }).lean();

    return topics.map((topic) => ({
      id: topic._id.toString(),
      name: topic.name,
      slug: topic.slug,
      description: topic.description,
    }));
  } catch (error) {
    console.error('Error fetching topics:', error);
    return [];
  }
}

function transformBlog(blog: any) {
  const topic = blog.topicId;
  return {
    id: blog._id.toString(),
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt || null,
    content: blog.content,
    featuredImage: blog.featuredImage || null,
    images: blog.images || [],
    topic: typeof topic === 'object' && topic
      ? {
          id: topic._id.toString(),
          name: topic.name,
          slug: topic.slug,
        }
      : null,
    publishedAt: blog.publishedAt,
    readingTime: blog.readingTime || null,
    seoTitle: blog.seoTitle || blog.title,
    seoDescription: blog.seoDescription || blog.excerpt || null,
    tags: blog.tags || [],
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
  };
}

