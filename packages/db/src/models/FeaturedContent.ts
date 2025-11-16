import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type FeaturedKind =
  | 'EXTERNAL_LINK'
  | 'INTERNAL_ARTICLE'
  | 'INTERNAL_RESOURCE'
  | 'ARTWORK'
  | 'BOOK'
  | 'COPING_TOOL'
  | 'RESEARCH'
  | 'OTHER';

export type FeaturedStatus = 'DRAFT' | 'PUBLISHED';

export interface IFeaturedContent extends Document {
  kind: FeaturedKind;
  title: string;
  slug?: string;
  description: string;
  externalUrl?: string;
  internalArticleSlug?: string;
  internalResourceId?: Types.ObjectId;
  thumbnailUrl?: string;
  creatorName?: string;
  creatorUrl?: string;
  tags?: string[];
  status: FeaturedStatus;
  isFeatured?: boolean;
  clickCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const FeaturedContentSchema = new Schema<IFeaturedContent>(
  {
    kind: {
      type: String,
      enum: ['EXTERNAL_LINK','INTERNAL_ARTICLE','INTERNAL_RESOURCE','ARTWORK','BOOK','COPING_TOOL','RESEARCH','OTHER'],
      required: true,
    },
    title: { type: String, required: true },
    slug: { type: String },
    description: { type: String, required: true },
    externalUrl: { type: String },
    internalArticleSlug: { type: String },
    internalResourceId: { type: Schema.Types.ObjectId, ref: 'Resource' },
    thumbnailUrl: { type: String },
    creatorName: { type: String },
    creatorUrl: { type: String },
    tags: [{ type: String }],
    status: { type: String, enum: ['DRAFT', 'PUBLISHED'], required: true, default: 'DRAFT' },
    isFeatured: { type: Boolean, default: false },
    clickCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FeaturedContentSchema.index({ kind: 1, status: 1 });
FeaturedContentSchema.index({ isFeatured: 1, status: 1, createdAt: -1 });
FeaturedContentSchema.index({ tags: 1, status: 1 });
FeaturedContentSchema.index({ createdAt: -1 });

const FeaturedContent: Model<IFeaturedContent> =
  (mongoose.models && (mongoose.models.FeaturedContent as Model<IFeaturedContent>)) ||
  mongoose.model<IFeaturedContent>('FeaturedContent', FeaturedContentSchema);

// Backward compatibility: also register as SharedContent for migration
if (!mongoose.models.SharedContent) {
  mongoose.model<IFeaturedContent>('SharedContent', FeaturedContentSchema);
}

export default FeaturedContent;


