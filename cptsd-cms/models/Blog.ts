import mongoose, { Schema, Document, Model } from 'mongoose';

export enum BlogStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface IBlogImage {
  url: string;
  alt: string;
  position: number; // Position in the content (character index or paragraph number)
  prompt?: string; // The prompt used to generate this image
  generatedAt?: Date;
}

export enum ArticleCategory {
  BASICS = 'BASICS',
  INDIA_CONTEXT = 'INDIA_CONTEXT',
  DAILY_LIFE = 'DAILY_LIFE',
  HEALING = 'HEALING',
  RELATIONSHIPS = 'RELATIONSHIPS',
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  content: string; // Full blog content in markdown or HTML
  youtubeUrl?: string; // Original YouTube video URL
  youtubeVideoId?: string; // Extracted video ID
  transcription?: string; // Full transcription from YouTube
  transcriptionRaw?: string; // Raw transcription before processing
  summary?: string; // AI-generated summary (short abstract for Article)
  status: BlogStatus;
  featuredImage?: string; // URL to featured/hero image (coverImageUrl for Article)
  coverImageUrl?: string; // Alias for featuredImage
  images: IBlogImage[]; // Array of images embedded in the content
  topicId?: mongoose.Types.ObjectId; // Optional link to topic
  authorId?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  readingTime?: number; // Estimated reading time in minutes
  estimatedReadTime?: number; // Alias for readingTime
  seoTitle?: string;
  seoDescription?: string;
  metaDescription?: string; // Alias for seoDescription
  purpose?: string; // Purpose of the article
  targetReader?: string; // Target audience/reader
  tags?: string[];
  category?: ArticleCategory; // Article category: BASICS, INDIA_CONTEXT, DAILY_LIFE, HEALING, RELATIONSHIPS
  relatedArticles?: mongoose.Types.ObjectId[]; // Manually added related articles
  linkedPostId?: mongoose.Types.ObjectId; // Optional link to AI-generated "post" entity
  customContent?: string; // User-added custom content
  regenerationHistory?: Array<{
    timestamp: Date;
    content: string;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const BlogImageSchema = new Schema<IBlogImage>(
  {
    url: { type: String, required: true },
    alt: { type: String, required: true },
    position: { type: Number, required: true },
    prompt: { type: String },
    generatedAt: { type: Date },
  },
  { _id: false }
);

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String },
    content: { type: String, required: true },
    youtubeUrl: { type: String },
    youtubeVideoId: { type: String },
    transcription: { type: String },
    transcriptionRaw: { type: String },
    summary: { type: String },
    status: {
      type: String,
      enum: Object.values(BlogStatus),
      default: BlogStatus.DRAFT,
    },
    featuredImage: { type: String },
    coverImageUrl: { type: String },
    images: [BlogImageSchema],
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
    readingTime: { type: Number },
    estimatedReadTime: { type: Number },
    seoTitle: { type: String },
    seoDescription: { type: String },
    metaDescription: { type: String },
    purpose: { type: String },
    targetReader: { type: String },
    tags: [{ type: String }],
    category: {
      type: String,
      // Allow any string to support custom categories
    },
    relatedArticles: [{ type: Schema.Types.ObjectId, ref: 'Blog' }],
    linkedPostId: { type: Schema.Types.ObjectId, ref: 'Post' },
    customContent: { type: String },
    regenerationHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        content: { type: String, required: true },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1 });
BlogSchema.index({ publishedAt: -1 });
BlogSchema.index({ createdAt: -1 });
BlogSchema.index({ topicId: 1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ linkedPostId: 1 });
BlogSchema.index({ youtubeVideoId: 1 });

// Ensure coverImageUrl defaults to featuredImage if not explicitly set
BlogSchema.pre('save', function(next) {
  if (!this.coverImageUrl && this.featuredImage) {
    this.coverImageUrl = this.featuredImage;
  }
  next();
});

const Blog: Model<IBlog> = (mongoose.models && mongoose.models.Blog) || mongoose.model<IBlog>('Blog', BlogSchema);

export default Blog;

