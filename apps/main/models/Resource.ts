import mongoose, { Schema, Document, Model } from 'mongoose';

// Extended ResourceType to support both existing and new types
export enum ResourceType {
  // Existing types
  BOOK = 'BOOK',
  VIDEO = 'VIDEO',
  COMMUNITY = 'COMMUNITY',
  EMERGENCY = 'EMERGENCY',
  WEBSITE = 'WEBSITE',
  PODCAST = 'PODCAST',
  ARTICLE = 'ARTICLE',
  TOOL = 'TOOL',
  OTHER = 'OTHER',
  // New types for support page
  HELPLINE = 'HELPLINE',
  THERAPY_DIRECTORY = 'THERAPY_DIRECTORY',
  NGO = 'NGO',
  EDUCATIONAL_SITE = 'EDUCATIONAL_SITE',
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
  phone?: string; // For helplines
  region?: string; // For region-specific resources
  languages?: string[]; // Supported languages
  author?: string;
  publisher?: string;
  isbn?: string;
  duration?: number;
  thumbnail?: string;
  tags: string[];
  featured: boolean;
  isFeatured?: boolean; // Alias for featured
  rating?: number;
  notes?: string;
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
    phone: { type: String },
    region: { type: String },
    languages: [{ type: String }],
    author: { type: String },
    publisher: { type: String },
    isbn: { type: String },
    duration: { type: Number },
    thumbnail: { type: String },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
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

