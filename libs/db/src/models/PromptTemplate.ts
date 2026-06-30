import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromptTemplate extends Document {
  name: string;
  slug: string;
  description: string;
  category: 'awareness' | 'somatic' | 'validation' | 'journal' | 'other';
  systemPrompt: string;
  userPromptTemplate: string;
  suggestedPostTypes: ('CAROUSEL' | 'REEL' | 'STORY' | 'MEME')[];
  suggestedTones: ('educational' | 'validating' | 'gentle-cta')[];
  exampleOutput?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PromptTemplateSchema = new Schema<IPromptTemplate>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['awareness', 'somatic', 'validation', 'journal', 'other'],
      required: true,
    },
    systemPrompt: { type: String, required: true },
    userPromptTemplate: { type: String, required: true },
    suggestedPostTypes: [
      {
        type: String,
        enum: ['CAROUSEL', 'REEL', 'STORY', 'MEME'],
      },
    ],
    suggestedTones: [
      {
        type: String,
        enum: ['educational', 'validating', 'gentle-cta'],
      },
    ],
    exampleOutput: { type: String },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes
PromptTemplateSchema.index({ category: 1 });
PromptTemplateSchema.index({ isActive: 1 });

// Safely get or create the model
const PromptTemplate: Model<IPromptTemplate> =
  (mongoose.models && mongoose.models.PromptTemplate) ||
  mongoose.model<IPromptTemplate>('PromptTemplate', PromptTemplateSchema);

export default PromptTemplate;

