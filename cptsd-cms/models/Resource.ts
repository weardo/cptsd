import mongoose, { Schema, Document, Model } from 'mongoose';

export enum ResourceType {
  BOOK = 'BOOK',
  VIDEO = 'VIDEO',
  COMMUNITY = 'COMMUNITY',
  EMERGENCY = 'EMERGENCY',
  WEBSITE = 'WEBSITE',
  PODCAST = 'PODCAST',
  ARTICLE = 'ARTICLE',
  TOOL = 'TOOL',
  OTHER = 'OTHER',
}

export enum ResourceCategory {
  EDUCATION = 'EDUCATION',
  SUPPORT = 'SUPPORT',
  THERAPY = 'THERAPY',
  SELF_CARE = 'SELF_CARE',
  EMERGENCY = 'EMERGENCY',
  COMMUNITY = 'COMMUNITY',
  RESEARCH = 'RESEARCH',
  OTHER = 'OTHER',
}

export interface IResource extends Document {
  title: string;
  description: string;
  type: ResourceType;
  category: ResourceCategory;
  url?: string;
  author?: string;
  publisher?: string;
  isbn?: string; // For books
  duration?: number; // For videos/podcasts in minutes
  thumbnail?: string;
  tags: string[];
  featured: boolean;
  rating?: number; // 1-5 stars
  notes?: string; // Admin notes
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(ResourceType),
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(ResourceCategory),
      required: true,
    },
    url: { type: String },
    author: { type: String },
    publisher: { type: String },
    isbn: { type: String },
    duration: { type: Number },
    thumbnail: { type: String },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5 },
    notes: { type: String },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'DRAFT'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
ResourceSchema.index({ type: 1 });
ResourceSchema.index({ category: 1 });
ResourceSchema.index({ status: 1 });
ResourceSchema.index({ featured: 1 });
ResourceSchema.index({ tags: 1 });
ResourceSchema.index({ createdAt: -1 });

const Resource: Model<IResource> =
  mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);

export default Resource;

