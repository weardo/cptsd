import mongoose, { Schema, Document, Model } from 'mongoose';

export enum StoryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IStory extends Document {
  pseudonym: string;
  title?: string;
  body: string;
  status: StoryStatus;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId | string; // id or email of moderator
}

const StorySchema = new Schema<IStory>(
  {
    pseudonym: { type: String, required: true },
    title: { type: String },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(StoryStatus),
      default: StoryStatus.PENDING,
    },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.Mixed }, // Can be ObjectId or string (email)
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
StorySchema.index({ status: 1 });
StorySchema.index({ createdAt: -1 });
StorySchema.index({ approvedAt: -1 });

// Safely get or create the model
const Story: Model<IStory> =
  (mongoose.models && mongoose.models.Story) || mongoose.model<IStory>('Story', StorySchema);

export default Story;

