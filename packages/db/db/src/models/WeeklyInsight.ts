import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrend {
  mood?: Array<{ date: string; value: number }>;
  sleep?: Array<{ date: string; value: number }>;
  stress?: Array<{ date: string; value: number }>;
}

export interface ITopItem {
  label: string;
  count: number;
}

export interface IWeeklyInsightAI {
  model: string;
  promptVersion: string;
  tokens: number;
  latencyMs: number;
}

export interface IWeeklyInsight extends Document {
  userId: mongoose.Types.ObjectId;
  weekStart: Date;
  summaryText: string;
  trends: ITrend;
  topThemes: ITopItem[];
  topStressors: ITopItem[];
  positives: ITopItem[];
  ai: IWeeklyInsightAI;
  createdAt: Date;
  updatedAt: Date;
}

const TrendItemSchema = new Schema(
  {
    date: { type: String, required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const TrendsSchema = new Schema<ITrend>(
  {
    mood: [TrendItemSchema],
    sleep: [TrendItemSchema],
    stress: [TrendItemSchema],
  },
  { _id: false }
);

const TopItemSchema = new Schema<ITopItem>(
  {
    label: { type: String, required: true },
    count: { type: Number, required: true },
  },
  { _id: false }
);

const WeeklyInsightAISchema = new Schema<IWeeklyInsightAI>(
  {
    model: { type: String, required: true },
    promptVersion: { type: String, required: true },
    tokens: { type: Number, required: true },
    latencyMs: { type: Number, required: true },
  },
  { _id: false }
);

const WeeklyInsightSchema = new Schema<IWeeklyInsight>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekStart: { type: Date, required: true, index: true },
    summaryText: { type: String, required: true },
    trends: { type: TrendsSchema, required: true },
    topThemes: [TopItemSchema],
    topStressors: [TopItemSchema],
    positives: [TopItemSchema],
    ai: { type: WeeklyInsightAISchema, required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
WeeklyInsightSchema.index({ userId: 1, weekStart: -1 });
WeeklyInsightSchema.index({ userId: 1, createdAt: -1 });

const WeeklyInsight: Model<IWeeklyInsight> =
  (mongoose.models && mongoose.models.WeeklyInsight) ||
  mongoose.model<IWeeklyInsight>('WeeklyInsight', WeeklyInsightSchema);

export default WeeklyInsight;

