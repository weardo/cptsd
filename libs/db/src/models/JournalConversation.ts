import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJournalConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}

const JournalConversationSchema = new Schema<IJournalConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String },
    lastMessageAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes
JournalConversationSchema.index({ userId: 1, createdAt: -1 });
JournalConversationSchema.index({ lastMessageAt: -1 });

const JournalConversation: Model<IJournalConversation> =
  (mongoose.models && mongoose.models.JournalConversation) ||
  mongoose.model<IJournalConversation>('JournalConversation', JournalConversationSchema);

export default JournalConversation;



