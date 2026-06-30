import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type LearnItemType = 'ARTICLE' | 'EXTERNAL_LINK' | 'RESOURCE';

export interface ILearnItem {
  type: LearnItemType;
  title?: string; // Optional - can be auto-filled from resource/article
  description?: string; // Optional - can be auto-filled from resource/article
  articleId?: Types.ObjectId; // Reference to Article if type is ARTICLE
  articleSlug?: string; // Slug of article for linking
  resourceId?: Types.ObjectId; // Reference to Resource if type is RESOURCE
  externalUrl?: string; // URL if type is EXTERNAL_LINK
  order: number; // Order within the section
}

export interface ILearnSection extends Document {
  title: string;
  description?: string;
  order: number; // Order of sections on the page
  items: ILearnItem[];
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: Date;
  updatedAt: Date;
}

const LearnItemSchema = new Schema<ILearnItem>(
  {
    type: {
      type: String,
      enum: ['ARTICLE', 'EXTERNAL_LINK', 'RESOURCE'],
      required: true,
    },
    title: { type: String }, // Optional - can be auto-filled
    description: { type: String }, // Optional - can be auto-filled
    articleId: { type: Schema.Types.ObjectId, ref: 'Article' },
    articleSlug: { type: String },
    resourceId: { type: Schema.Types.ObjectId, ref: 'Resource' },
    externalUrl: { type: String },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const LearnSectionSchema = new Schema<ILearnSection>(
  {
    title: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true, default: 0 },
    items: [LearnItemSchema],
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED'],
      required: true,
      default: 'DRAFT',
    },
  },
  { timestamps: true }
);

LearnSectionSchema.index({ status: 1, order: 1 });
LearnSectionSchema.index({ createdAt: -1 });

const LearnSection: Model<ILearnSection> =
  (mongoose.models && (mongoose.models.LearnSection as Model<ILearnSection>)) ||
  mongoose.model<ILearnSection>('LearnSection', LearnSectionSchema);

export default LearnSection;


