import mongoose, { Schema, Document, Model } from 'mongoose';

export enum SafetyLevel {
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum SafetyAction {
  WARNED = 'warned',
  RESOURCES_SHOWN = 'resources_shown',
  BLOCKED_RESPONSE = 'blocked_response',
}

export interface ISafetyEvent extends Document {
  userId: mongoose.Types.ObjectId;
  entryId?: mongoose.Types.ObjectId;
  messageId?: mongoose.Types.ObjectId;
  level: SafetyLevel;
  signals: string[];
  actionTaken: SafetyAction;
  createdAt: Date;
  updatedAt: Date;
}

const SafetyEventSchema = new Schema<ISafetyEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
    messageId: { type: Schema.Types.ObjectId, ref: 'JournalMessage' },
    level: {
      type: String,
      enum: Object.values(SafetyLevel),
      required: true,
    },
    signals: [{ type: String }],
    actionTaken: {
      type: String,
      enum: Object.values(SafetyAction),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SafetyEventSchema.index({ userId: 1, createdAt: -1 });
SafetyEventSchema.index({ level: 1 });

const SafetyEvent: Model<ISafetyEvent> =
  (mongoose.models && mongoose.models.SafetyEvent) ||
  mongoose.model<ISafetyEvent>('SafetyEvent', SafetyEventSchema);

export default SafetyEvent;



