import mongoose, { Schema, Document, Model } from 'mongoose';

export enum EntrySource {
  CHECKIN = 'checkin',
  FREEWRITE = 'freewrite',
}

export interface IJournalEntry extends Document {
  userId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  source: EntrySource;
  rawText: string;
  derivedFromMessageIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalConversation',
      required: true,
    },
    source: {
      type: String,
      enum: Object.values(EntrySource),
      required: true,
    },
    rawText: { type: String, required: true },
    derivedFromMessageIds: [{ type: Schema.Types.ObjectId, ref: 'JournalMessage' }],
  },
  {
    timestamps: true,
  }
);

// Indexes
JournalEntrySchema.index({ userId: 1, createdAt: -1 });
JournalEntrySchema.index({ conversationId: 1 });

const JournalEntry: Model<IJournalEntry> =
  (mongoose.models && mongoose.models.JournalEntry) ||
  mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);

export default JournalEntry;



