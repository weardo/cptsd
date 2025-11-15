import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStandaloneGeneration extends Document {
  prompt: string;
  systemPrompt?: string;
  openaiModel: string; // OpenAI model used (renamed from 'model' to avoid conflict with Mongoose Document.model)
  contentType: 'text' | 'image' | 'both';
  generatedText?: string;
  generatedImages: string[]; // Array of S3 URLs for stored images
  attachments?: Array<{
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
  }>;
  metadata?: {
    originalImageUrls?: string[]; // Store original OpenAI URLs in metadata
    generationParams?: Record<string, any>;
  };
  authorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StandaloneGenerationSchema = new Schema<IStandaloneGeneration>(
  {
    prompt: { type: String, required: true },
    systemPrompt: { type: String },
    openaiModel: { type: String, required: true },
    contentType: {
      type: String,
      enum: ['text', 'image', 'both'],
      required: true,
    },
    generatedText: { type: String },
    generatedImages: [{ type: String }], // Array of image URLs
    attachments: [
      {
        type: { type: String, enum: ['image', 'video', 'audio', 'file'] },
        url: String,
      },
    ],
    metadata: {
      originalImageUrls: [{ type: String }],
      generationParams: Schema.Types.Mixed,
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
StandaloneGenerationSchema.index({ authorId: 1, createdAt: -1 });
StandaloneGenerationSchema.index({ contentType: 1 });
StandaloneGenerationSchema.index({ createdAt: -1 });

const StandaloneGeneration: Model<IStandaloneGeneration> =
  (mongoose.models && mongoose.models.StandaloneGeneration) ||
  mongoose.model<IStandaloneGeneration>('StandaloneGeneration', StandaloneGenerationSchema);

export default StandaloneGeneration;

