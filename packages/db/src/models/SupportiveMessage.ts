import mongoose, { Schema, Document, Model } from 'mongoose';

export enum PetType {
  CAT = 'cat',
  DOG = 'dog',
  BIRD = 'bird',
  RABBIT = 'rabbit',
  BUTTERFLY = 'butterfly',
  LEAF = 'leaf',
  ALL = 'all', // For messages that can appear with any pet
}

export interface ISupportiveMessage extends Document {
  message: string;
  petType: PetType;
  priority: number; // Higher priority messages shown more often (1-10)
  isActive: boolean;
  tags?: string[]; // e.g., ['seasonal', 'winter', 'holiday', 'trending', 'crisis']
  startDate?: Date; // Optional: when to start showing this message
  endDate?: Date; // Optional: when to stop showing this message
  usageCount: number; // Track how many times this message has been shown
  lastShownAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupportiveMessageSchema = new Schema<ISupportiveMessage>(
  {
    message: { type: String, required: true, maxlength: 200 },
    petType: {
      type: String,
      enum: Object.values(PetType),
      required: true,
      default: PetType.ALL,
    },
    priority: { type: Number, default: 5, min: 1, max: 10 },
    isActive: { type: Boolean, default: true },
    tags: [{ type: String }],
    startDate: { type: Date },
    endDate: { type: Date },
    usageCount: { type: Number, default: 0 },
    lastShownAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
SupportiveMessageSchema.index({ petType: 1, isActive: 1, priority: -1 });
SupportiveMessageSchema.index({ tags: 1 });
SupportiveMessageSchema.index({ startDate: 1, endDate: 1 });

// Safely get or create the model
const SupportiveMessage: Model<ISupportiveMessage> =
  (mongoose.models && mongoose.models.SupportiveMessage) ||
  mongoose.model<ISupportiveMessage>('SupportiveMessage', SupportiveMessageSchema);

export default SupportiveMessage;

