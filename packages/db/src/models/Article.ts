import mongoose, { Schema, Document, Model } from 'mongoose';

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum ArticleCategory {
  BASICS = 'BASICS',
  INDIA_CONTEXT = 'INDIA_CONTEXT',
  DAILY_LIFE = 'DAILY_LIFE',
  HEALING = 'HEALING',
  RELATIONSHIPS = 'RELATIONSHIPS',
}

// Helper function to check if a category exists
export function isValidCategory(category: string): category is ArticleCategory {
  return Object.values(ArticleCategory).includes(category as ArticleCategory);
}

export interface IArticleImage {
  url: string;
  alt: string;
  position: number;
  prompt?: string;
  generatedAt?: Date;
}

export interface IArticle extends Document {
  title: string;
  slug: string; // unique, URL-safe; used by blog + main for linking
  excerpt?: string;
  summary?: string; // short abstract / excerpt
  body: string; // markdown or rich-text serialized (alias for content)
  content: string; // markdown or rich-text serialized (backward compatibility)
  coverImageUrl?: string;
  featuredImage?: string; // alias for coverImageUrl (backward compatibility)
  images: IArticleImage[];
  category?: ArticleCategory;
  tags: string[];
  status: ArticleStatus;
  linkedPostId?: mongoose.Types.ObjectId; // optional link to AI social "post"
  topicId?: mongoose.Types.ObjectId; // Optional link to topic (for CMS organization)
  authorId?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  readingTime?: number;
  estimatedReadTime?: number; // Alias for readingTime
  seoTitle?: string;
  seoDescription?: string;
  metaDescription?: string; // Alias for seoDescription
  purpose?: string; // Purpose of the article
  targetReader?: string; // Target audience/reader
  relatedArticles?: mongoose.Types.ObjectId[]; // Manually added related articles
  youtubeUrl?: string; // For CMS: original YouTube video URL
  youtubeVideoId?: string;
  transcription?: string;
  customContent?: string; // User-added custom content
  isLearnResource?: boolean; // If true, article should be displayed under /learn route in cptsd-main
  featured?: boolean; // If true, article should be displayed in featured reading section
  regenerationHistory?: Array<{
    timestamp: Date;
    content: string;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleImageSchema = new Schema<IArticleImage>(
  {
    url: { type: String, required: true },
    alt: { type: String, required: true },
    position: { type: Number, required: true },
    prompt: { type: String },
    generatedAt: { type: Date },
  },
  { _id: false }
);

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String },
    summary: { type: String },
    body: { type: String },
    content: { type: String, required: true }, // Primary field name in database
    coverImageUrl: { type: String },
    featuredImage: { type: String }, // Keep for backward compatibility
    images: [ArticleImageSchema],
    category: {
      type: String,
      // Allow any string, but prefer enum values for consistency
      // enum: Object.values(ArticleCategory), // Commented out to allow custom categories
    },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: Object.values(ArticleStatus),
      default: ArticleStatus.DRAFT,
    },
    linkedPostId: { type: Schema.Types.ObjectId, ref: 'Post' },
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
    relatedArticles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
    youtubeUrl: { type: String },
    youtubeVideoId: { type: String },
    transcription: { type: String },
    customContent: { type: String },
    isLearnResource: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
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
ArticleSchema.index({ slug: 1 });
ArticleSchema.index({ status: 1 });
ArticleSchema.index({ publishedAt: -1 });
ArticleSchema.index({ createdAt: -1 });
ArticleSchema.index({ topicId: 1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ category: 1 });
ArticleSchema.index({ linkedPostId: 1 });
ArticleSchema.index({ youtubeVideoId: 1 });
ArticleSchema.index({ relatedArticles: 1 });

// Ensure coverImageUrl defaults to featuredImage if not explicitly set
// Sync content and body fields
// Sync aliases for SEO and reading time
ArticleSchema.pre('save', function(next) {
  if (!this.coverImageUrl && this.featuredImage) {
    this.coverImageUrl = this.featuredImage;
  }
  if (!this.featuredImage && this.coverImageUrl) {
    this.featuredImage = this.coverImageUrl;
  }
  // Sync content and body for backward compatibility
  if (this.content && !this.body) {
    this.body = this.content;
  }
  if (this.body && !this.content) {
    this.content = this.body;
  }
  // Sync SEO fields
  if (this.seoDescription && !this.metaDescription) {
    this.metaDescription = this.seoDescription;
  }
  if (this.metaDescription && !this.seoDescription) {
    this.seoDescription = this.metaDescription;
  }
  // Sync reading time fields
  if (this.readingTime && !this.estimatedReadTime) {
    this.estimatedReadTime = this.readingTime;
  }
  if (this.estimatedReadTime && !this.readingTime) {
    this.readingTime = this.estimatedReadTime;
  }
  next();
});

// Safely get or create the model
const Article: Model<IArticle> =
  (mongoose.models && mongoose.models.Article) || mongoose.model<IArticle>('Article', ArticleSchema);

// Also register as 'Blog' for backward compatibility during migration
if (!(mongoose.models && mongoose.models.Blog)) {
  mongoose.model<IArticle>('Blog', ArticleSchema);
}

export default Article;

