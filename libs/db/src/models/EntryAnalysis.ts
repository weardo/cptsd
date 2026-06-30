import mongoose, { Schema, Document, Model } from 'mongoose';

export enum RiskLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface IEmotion {
  label: string;
  score: number;
}

export interface ITheme {
  label: string;
  score: number;
}

export interface IStressor {
  label: string;
  score: number;
}

export interface ICoping {
  label: string;
  score: number;
}

export interface IRisk {
  level: RiskLevel;
  reasons: string[];
}

export interface IAnalysisAI {
  model: string;
  promptVersion: string;
  tokens: number;
  latencyMs: number;
}

export interface IEntryAnalysis extends Document {
  entryId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  emotions: IEmotion[];
  themes: ITheme[];
  stressors: IStressor[];
  coping?: ICoping[];
  sentimentScore: number; // -1 to 1
  risk: IRisk;
  ai: IAnalysisAI;
  createdAt: Date;
  updatedAt: Date;
}

const EmotionSchema = new Schema<IEmotion>(
  {
    label: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const ThemeSchema = new Schema<ITheme>(
  {
    label: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const StressorSchema = new Schema<IStressor>(
  {
    label: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const CopingSchema = new Schema<ICoping>(
  {
    label: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const RiskSchema = new Schema<IRisk>(
  {
    level: {
      type: String,
      enum: Object.values(RiskLevel),
      required: true,
    },
    reasons: [{ type: String }],
  },
  { _id: false }
);

const AnalysisAISchema = new Schema<IAnalysisAI>(
  {
    model: { type: String, required: true },
    promptVersion: { type: String, required: true },
    tokens: { type: Number, required: true },
    latencyMs: { type: Number, required: true },
  },
  { _id: false }
);

const EntryAnalysisSchema = new Schema<IEntryAnalysis>(
  {
    entryId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
      required: true,
      unique: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    emotions: [EmotionSchema],
    themes: [ThemeSchema],
    stressors: [StressorSchema],
    coping: [CopingSchema],
    sentimentScore: { type: Number, required: true, min: -1, max: 1 },
    risk: { type: RiskSchema, required: true },
    ai: { type: AnalysisAISchema, required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes (entryId already has unique index, so don't duplicate)
EntryAnalysisSchema.index({ userId: 1, createdAt: -1 });

const EntryAnalysis: Model<IEntryAnalysis> =
  (mongoose.models && mongoose.models.EntryAnalysis) ||
  mongoose.model<IEntryAnalysis>('EntryAnalysis', EntryAnalysisSchema);

export default EntryAnalysis;

