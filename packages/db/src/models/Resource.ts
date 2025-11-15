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
  // Support page types
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
  type: ResourceType;
  title: string;
  description: string;
  url?: string;
  phone?: string; // For helplines
  region?: string; // e.g. "All India", "Karnataka", "Mumbai"
  languages?: string[]; // e.g. ["English","Hindi"]
  tags?: string[];
  isFeatured?: boolean;
  featured?: boolean; // Alias for isFeatured (backward compatibility)
  category: ResourceCategory;
  author?: string;
  publisher?: string;
  isbn?: string; // For books
  duration?: number; // For videos/podcasts in minutes
  thumbnail?: string;
  rating?: number; // 1-5 stars
  notes?: string; // Admin notes
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    type: {
      type: String,
      enum: Object.values(ResourceType),
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    url: { type: String },
    phone: { type: String },
    region: { type: String },
    languages: [{ type: String }],
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    category: {
      type: String,
      enum: Object.values(ResourceCategory),
      required: true,
    },
    author: { type: String },
    publisher: { type: String },
    isbn: { type: String },
    duration: { type: Number },
    thumbnail: { type: String },
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
ResourceSchema.index({ isFeatured: 1 });
ResourceSchema.index({ tags: 1 });
ResourceSchema.index({ region: 1 });
ResourceSchema.index({ createdAt: -1 });

// Sync featured and isFeatured
ResourceSchema.pre('save', function(next) {
  if (this.isFeatured !== undefined && this.featured !== this.isFeatured) {
    this.featured = this.isFeatured;
  }
  if (this.featured !== undefined && this.isFeatured !== this.featured) {
    this.isFeatured = this.featured;
  }
  next();
});

// Safely get or create the model
const Resource: Model<IResource> =
  (mongoose.models && mongoose.models.Resource) || mongoose.model<IResource>('Resource', ResourceSchema);

export default Resource;

