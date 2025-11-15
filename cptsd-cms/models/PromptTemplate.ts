import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromptTemplate extends Document {
  name: string;
  slug: string;
  description: string;
  category: 'awareness' | 'somatic' | 'validation' | 'journal' | 'other';
  systemPrompt: string; // The underlying OpenAI system prompt
  userPromptTemplate: string; // Template with variables like {topic}, {tone}, {postType}
  suggestedPostTypes: ('CAROUSEL' | 'REEL' | 'STORY' | 'MEME')[];
  suggestedTones: ('educational' | 'validating' | 'gentle-cta')[];
  exampleOutput?: string; // Example of what this template generates
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

// Additional indexes for faster lookups (slug index already created by unique: true above)
PromptTemplateSchema.index({ category: 1 });
PromptTemplateSchema.index({ isActive: 1 });

const PromptTemplate: Model<IPromptTemplate> =
  mongoose.models.PromptTemplate ||
  mongoose.model<IPromptTemplate>('PromptTemplate', PromptTemplateSchema);

export default PromptTemplate;

