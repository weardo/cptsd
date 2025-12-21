import mongoose, { Schema, Document, Model } from 'mongoose';

export enum AssetKind {
  IMAGE_FEED = 'IMAGE_FEED',
  IMAGE_STORY = 'IMAGE_STORY',
  VIDEO_REEL_DRAFT = 'VIDEO_REEL_DRAFT',
  IMAGE_CAROUSEL_SLIDE = 'IMAGE_CAROUSEL_SLIDE',
}

export type CompositionType =
  | 'BACKGROUND_ONLY'
  | 'BIRD_ONLY'
  | 'BIRD_WITH_SPEECH_BUBBLE'
  | 'BIRD_ACTION_SCENE'
  | 'TEXT_FOCUSED';

export interface IGeneratedAsset extends Document {
  postId?: mongoose.Types.ObjectId;
  blogId?: mongoose.Types.ObjectId; // References Article/Blog
  kind: AssetKind;
  size: string;
  url: string;
  thumbnailUrl?: string;
  slideNumber?: number;
  compositionType?: CompositionType;
  metadata?: {
    prompt?: string;
    promptUsed?: string;
    model?: string;
    revised_prompt?: string;
    importance?: 'test' | 'normal' | 'hero';
    slideDescription?: string;
    actionDescription?: string;
    extraStyleFlags?: string[];
    generationParams?: {
      size?: string;
      quality?: string;
      style?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedAssetSchema = new Schema<IGeneratedAsset>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: false, index: true },
    blogId: { type: Schema.Types.ObjectId, ref: 'Article', required: false, index: true },
    kind: {
      type: String,
      enum: Object.values(AssetKind),
      required: true,
    },
    size: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    slideNumber: { type: Number },
    compositionType: {
      type: String,
      enum: ['BACKGROUND_ONLY', 'BIRD_ONLY', 'BIRD_WITH_SPEECH_BUBBLE', 'BIRD_ACTION_SCENE', 'TEXT_FOCUSED'],
    },
    metadata: {
      prompt: String,
      promptUsed: String,
      model: String,
      revised_prompt: String,
      importance: String,
      slideDescription: String,
      actionDescription: String,
      extraStyleFlags: [String],
      generationParams: {
        size: String,
        quality: String,
        style: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
GeneratedAssetSchema.index({ postId: 1, kind: 1 });
GeneratedAssetSchema.index({ blogId: 1, kind: 1 });
GeneratedAssetSchema.index({ postId: 1, slideNumber: 1 });
GeneratedAssetSchema.index({ blogId: 1, slideNumber: 1 });
GeneratedAssetSchema.index({ postId: 1, compositionType: 1 });
GeneratedAssetSchema.index({ blogId: 1, compositionType: 1 });
GeneratedAssetSchema.index({ createdAt: -1 });

// Safely get or create the model
const GeneratedAsset: Model<IGeneratedAsset> =
  (mongoose.models && mongoose.models.GeneratedAsset) || mongoose.model<IGeneratedAsset>('GeneratedAsset', GeneratedAssetSchema);

export default GeneratedAsset;

