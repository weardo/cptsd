import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITopic extends Document {
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

// Note: No need for explicit index on slug since unique: true already creates one

const Topic: Model<ITopic> = (mongoose.models && mongoose.models.Topic) || mongoose.model<ITopic>('Topic', TopicSchema);

export default Topic;

