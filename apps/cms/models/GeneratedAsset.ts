import mongoose, { Schema, Document, Model } from 'mongoose';

export enum AssetKind {
  IMAGE_FEED = 'IMAGE_FEED',
  IMAGE_STORY = 'IMAGE_STORY',
  VIDEO_REEL_DRAFT = 'VIDEO_REEL_DRAFT',
  IMAGE_CAROUSEL_SLIDE = 'IMAGE_CAROUSEL_SLIDE', // Individual carousel slide image
}

export type CompositionType =
  | 'BACKGROUND_ONLY'
  | 'BIRD_ONLY'
  | 'BIRD_WITH_SPEECH_BUBBLE'
  | 'BIRD_ACTION_SCENE'
  | 'TEXT_FOCUSED';

export interface IGeneratedAsset extends Document {
  postId?: mongoose.Types.ObjectId; // Optional - for post assets
  blogId?: mongoose.Types.ObjectId; // Optional - for blog assets
  kind: AssetKind;
  size: string; // e.g., "1080x1080", "1080x1920"
  url: string; // URL where the asset is stored (S3, local, or OpenAI URL)
  thumbnailUrl?: string; // Optional thumbnail URL
  slideNumber?: number; // For carousel slides, indicates the slide number
  compositionType?: CompositionType; // Composition type for controlled variations
  metadata?: {
    prompt?: string; // The prompt used to generate this asset
    promptUsed?: string; // Alias for prompt (for consistency with requirements)
    model?: string; // Model used (e.g., "dall-e-3")
    revised_prompt?: string; // OpenAI's revised prompt
    importance?: 'test' | 'normal' | 'hero'; // Importance level used for model selection
    slideDescription?: string; // For carousel slides, the slide description used
    actionDescription?: string; // For BIRD_ACTION_SCENE, the action description used
    extraStyleFlags?: string[]; // Array of style flags like ["playful","warmer"]
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
    blogId: { type: Schema.Types.ObjectId, ref: 'Blog', required: false, index: true },
    kind: {
      type: String,
      enum: Object.values(AssetKind),
      required: true,
    },
    size: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    slideNumber: { type: Number }, // For carousel slides
    compositionType: {
      type: String,
      enum: ['BACKGROUND_ONLY', 'BIRD_ONLY', 'BIRD_WITH_SPEECH_BUBBLE', 'BIRD_ACTION_SCENE', 'TEXT_FOCUSED'],
    },
    metadata: {
      prompt: String,
      promptUsed: String, // Alias for prompt
      model: String,
      revised_prompt: String,
      importance: String, // 'test' | 'normal' | 'hero'
      slideDescription: String, // For carousel slides
      actionDescription: String, // For BIRD_ACTION_SCENE
      extraStyleFlags: [String], // Array of style flags
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
GeneratedAssetSchema.index({ postId: 1, slideNumber: 1 }); // For sorting carousel slides
GeneratedAssetSchema.index({ blogId: 1, slideNumber: 1 }); // For sorting carousel slides
GeneratedAssetSchema.index({ postId: 1, compositionType: 1 }); // For filtering by composition type
GeneratedAssetSchema.index({ blogId: 1, compositionType: 1 }); // For filtering by composition type
GeneratedAssetSchema.index({ createdAt: -1 });

const GeneratedAsset: Model<IGeneratedAsset> =
  (mongoose.models && mongoose.models.GeneratedAsset) || mongoose.model<IGeneratedAsset>('GeneratedAsset', GeneratedAssetSchema);

export default GeneratedAsset;

