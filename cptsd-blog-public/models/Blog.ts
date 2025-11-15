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
  position: number;
  prompt?: string;
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
  content: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  transcription?: string;
  summary?: string;
  status: BlogStatus;
  featuredImage?: string;
  coverImageUrl?: string;
  images: IBlogImage[];
  topicId?: mongoose.Types.ObjectId;
  authorId?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  readingTime?: number;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  category?: ArticleCategory;
  linkedPostId?: mongoose.Types.ObjectId;
  customContent?: string;
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
    seoTitle: { type: String },
    seoDescription: { type: String },
    tags: [{ type: String }],
    category: {
      type: String,
      enum: Object.values(ArticleCategory),
    },
    linkedPostId: { type: Schema.Types.ObjectId, ref: 'Post' },
    customContent: { type: String },
  },
  {
    timestamps: true,
  }
);

BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1 });
BlogSchema.index({ publishedAt: -1 });
BlogSchema.index({ createdAt: -1 });
BlogSchema.index({ topicId: 1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ linkedPostId: 1 });

const Blog: Model<IBlog> = mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);

export default Blog;

