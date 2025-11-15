import mongoose, { Schema, Document, Model } from 'mongoose';

export enum IdeaStatus {
  DRAFT = 'DRAFT',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  CONVERTED = 'CONVERTED',
  ARCHIVED = 'ARCHIVED',
}

export interface IContentIdeaItem {
  type: 'text' | 'image' | 'file' | 'link';
  content: string;
  metadata?: {
    filename?: string;
    fileSize?: number;
    mimeType?: string;
    thumbnailUrl?: string;
    description?: string;
  };
  order: number;
}

export interface IContentIdea extends Document {
  topicId: mongoose.Types.ObjectId;
  intent?: string;
  status: IdeaStatus;
  items: IContentIdeaItem[];
  notes?: string;
  aiVariations?: string[];
  postType?: 'CAROUSEL' | 'REEL' | 'STORY' | 'MEME';
  tone?: 'educational' | 'validating' | 'gentle-cta';
  templateId?: mongoose.Types.ObjectId;
  generatedScript?: string;
  generatedCaption?: string;
  generatedHashtags?: string;
  linkedPostId?: mongoose.Types.ObjectId;
  position?: { x: number; y: number };
  authorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContentIdeaItemSchema = new Schema<IContentIdeaItem>(
  {
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'link'],
      required: true,
    },
    content: { type: String, required: true },
    metadata: {
      filename: String,
      fileSize: Number,
      mimeType: String,
      thumbnailUrl: String,
      description: String,
    },
    order: { type: Number, default: 0 },
  },
  {
    _id: false,
  }
);

const ContentIdeaSchema = new Schema<IContentIdea>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    intent: { type: String },
    status: {
      type: String,
      enum: Object.values(IdeaStatus),
      default: IdeaStatus.DRAFT,
    },
    items: [ContentIdeaItemSchema],
    notes: { type: String },
    aiVariations: [{ type: String }],
    postType: {
      type: String,
      enum: ['CAROUSEL', 'REEL', 'STORY', 'MEME'],
    },
    tone: {
      type: String,
      enum: ['educational', 'validating', 'gentle-cta'],
    },
    templateId: { type: Schema.Types.ObjectId, ref: 'PromptTemplate' },
    generatedScript: { type: String },
    generatedCaption: { type: String },
    generatedHashtags: { type: String },
    linkedPostId: { type: Schema.Types.ObjectId, ref: 'Post' },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Indexes
ContentIdeaSchema.index({ topicId: 1 });
ContentIdeaSchema.index({ status: 1 });
ContentIdeaSchema.index({ postType: 1 });
ContentIdeaSchema.index({ createdAt: -1 });
ContentIdeaSchema.index({ position: 1 });

// Safely get or create the model
const ContentIdea: Model<IContentIdea> =
  (mongoose.models && mongoose.models.ContentIdea) || mongoose.model<IContentIdea>('ContentIdea', ContentIdeaSchema);

export default ContentIdea;

