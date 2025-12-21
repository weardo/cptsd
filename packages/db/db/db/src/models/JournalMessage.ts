import mongoose, { Schema, Document, Model } from 'mongoose';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface IJournalMessageMetadata {
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
  latencyMs?: number;
  safetyFlag?: 'none' | 'low' | 'medium' | 'high';
}

export interface IJournalMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: MessageRole;
  content: string;
  contentType?: string; // Future: 'text' | 'image' | etc.
  metadata?: IJournalMessageMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const JournalMessageSchema = new Schema<IJournalMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalConversation',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: Object.values(MessageRole),
      required: true,
    },
    content: { type: String, required: true },
    contentType: { type: String, default: 'text' },
    metadata: {
      tokensIn: { type: Number },
      tokensOut: { type: Number },
      model: { type: String },
      latencyMs: { type: Number },
      safetyFlag: {
        type: String,
        enum: ['none', 'low', 'medium', 'high'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
JournalMessageSchema.index({ conversationId: 1, createdAt: 1 });
JournalMessageSchema.index({ userId: 1, createdAt: -1 });

const JournalMessage: Model<IJournalMessage> =
  (mongoose.models && mongoose.models.JournalMessage) ||
  mongoose.model<IJournalMessage>('JournalMessage', JournalMessageSchema);

export default JournalMessage;

