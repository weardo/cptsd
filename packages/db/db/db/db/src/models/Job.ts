import mongoose, { Schema, Document, Model } from 'mongoose';

export enum JobType {
  ENTRY_ANALYSIS = 'ENTRY_ANALYSIS',
  WEEKLY_INSIGHT = 'WEEKLY_INSIGHT',
}

export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export interface IJob extends Document {
  type: JobType;
  status: JobStatus;
  userId: mongoose.Types.ObjectId;
  payload: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  lockedAt?: Date;
  runAt: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    type: {
      type: String,
      enum: Object.values(JobType),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.PENDING,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lockedAt: { type: Date },
    runAt: { type: Date, default: Date.now, index: true },
    lastError: { type: String },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient job polling
JobSchema.index({ status: 1, runAt: 1 });
JobSchema.index({ userId: 1, type: 1, status: 1 });

const Job: Model<IJob> =
  (mongoose.models && mongoose.models.Job) || mongoose.model<IJob>('Job', JobSchema);

export default Job;

