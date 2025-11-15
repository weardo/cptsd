import mongoose, { Schema, Document, Model } from 'mongoose';

export enum IdeaStatus {
  DRAFT = 'DRAFT',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  CONVERTED = 'CONVERTED', // Converted to a Post
  ARCHIVED = 'ARCHIVED',
}

export interface IContentIdeaItem {
  type: 'text' | 'image' | 'file' | 'link';
  content: string; // Text content, image URL, file URL, or link URL
  metadata?: {
    filename?: string;
    fileSize?: number;
    mimeType?: string;
    thumbnailUrl?: string;
    description?: string;
  };
  order: number; // For drag & drop ordering
}

export interface IContentIdea extends Document {
  topicId: mongoose.Types.ObjectId;
  intent?: string; // What's the goal of this idea?
  status: IdeaStatus;
  items: IContentIdeaItem[]; // Rich media items (text, images, files, links)
  notes?: string; // Rough notes
  aiVariations?: string[]; // AI-generated variations/storylines
  postType?: 'CAROUSEL' | 'REEL' | 'STORY' | 'MEME';
  tone?: 'educational' | 'validating' | 'gentle-cta';
  templateId?: mongoose.Types.ObjectId; // Reference to PromptTemplate if used
  generatedScript?: string; // AI-generated script if created
  generatedCaption?: string; // AI-generated caption if created
  generatedHashtags?: string; // AI-generated hashtags if created
  linkedPostId?: mongoose.Types.ObjectId; // If converted to post
  position?: { x: number; y: number }; // For drag & drop board positioning
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
    _id: false, // Disable _id for subdocuments to avoid serialization issues
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

// Indexes for faster queries
ContentIdeaSchema.index({ topicId: 1 });
ContentIdeaSchema.index({ status: 1 });
ContentIdeaSchema.index({ postType: 1 });
ContentIdeaSchema.index({ createdAt: -1 });
ContentIdeaSchema.index({ position: 1 });

const ContentIdea: Model<IContentIdea> =
  mongoose.models.ContentIdea || mongoose.model<IContentIdea>('ContentIdea', ContentIdeaSchema);

export default ContentIdea;

