import connectDB from '@cptsd/db/mongodb';
import {
  Job,
  JobType,
  JobStatus,
  JournalEntry,
  EntryAnalysis,
  WeeklyInsight,
} from '@cptsd/db';
import { createAIAdapter, PROMPT_VERSION } from '@cptsd/ai';
import mongoose from 'mongoose';

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 5000; // 5 seconds
const MAX_RETRIES = 3;

/**
 * Exponential backoff delay calculation
 */
function getBackoffDelay(attempts: number): number {
  return Math.min(1000 * Math.pow(2, attempts), 300000); // Max 5 minutes
}

/**
 * Claim a job atomically
 */
async function claimJob(): Promise<mongoose.Types.ObjectId | null> {
  const now = new Date();
  const lockExpiry = new Date(now.getTime() - LOCK_TIMEOUT_MS);

  // Debug: Check how many pending jobs exist
  const pendingCount = await Job.countDocuments({ status: JobStatus.PENDING });
  if (pendingCount > 0) {
    console.log(`[Worker] Found ${pendingCount} pending jobs`);
  }

  // Find and claim a pending job that's ready to run
  const job = await Job.findOneAndUpdate(
    {
      status: JobStatus.PENDING,
      runAt: { $lte: now },
      $or: [
        { lockedAt: { $exists: false } },
        { lockedAt: { $lt: lockExpiry } }, // Expired locks
      ],
    },
    {
      $set: {
        status: JobStatus.RUNNING,
        lockedAt: now,
      },
    },
    {
      sort: { runAt: 1 }, // Process oldest first
      new: true,
    }
  );

  if (job) {
    console.log(`[Worker] Claimed job ${job._id} (type: ${job.type})`);
  } else if (pendingCount > 0) {
    // Check if jobs exist but aren't ready yet
    const nextJob = await Job.findOne({ status: JobStatus.PENDING }).sort({ runAt: 1 });
    if (nextJob) {
      const waitMs = nextJob.runAt.getTime() - now.getTime();
      console.log(`[Worker] Next job scheduled in ${Math.round(waitMs / 1000)}s`);
    }
  }

  return (job?._id as mongoose.Types.ObjectId) || null;
}

/**
 * Process entry analysis job
 */
async function processEntryAnalysis(job: any, aiAdapter: any): Promise<void> {
  const { entryId } = job.payload;

  const entry = await JournalEntry.findById(entryId);
  if (!entry) {
    throw new Error(`Entry not found: ${entryId}`);
  }

  // Check if analysis already exists
  const existing = await EntryAnalysis.findOne({ entryId });
  if (existing) {
    console.log(`[Worker] Analysis already exists for entry ${entryId}`);
    return;
  }

  console.log(`[Worker] Analyzing entry ${entryId}`);

  const startTime = Date.now();
  const analysis = await aiAdapter.analyzeEntry(entry.rawText);
  const latencyMs = Date.now() - startTime;

  await EntryAnalysis.create({
    entryId: entry._id,
    userId: entry.userId,
    emotions: analysis.emotions,
    themes: analysis.themes,
    stressors: analysis.stressors,
    coping: analysis.coping,
    sentimentScore: analysis.sentimentScore,
    risk: analysis.risk,
    ai: {
      model: 'gpt-4o-mini', // Default model
      promptVersion: PROMPT_VERSION,
      tokens: analysis.tokens,
      latencyMs: analysis.latencyMs,
    },
  });

  console.log(`[Worker] Entry analysis complete for ${entryId}`);
}

/**
 * Process weekly insight job
 */
async function processWeeklyInsight(job: any, aiAdapter: any): Promise<void> {
  const { weekStart } = job.payload;
  const userId = job.userId;

  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);

  // Check if insight already exists
  const existing = await WeeklyInsight.findOne({
    userId,
    weekStart: weekStartDate,
  });
  if (existing) {
    console.log(`[Worker] Weekly insight already exists for week ${weekStart}`);
    return;
  }

  console.log(`[Worker] Generating weekly insight for week ${weekStart}`);

  // Get all entries for the week
  const entries = await JournalEntry.find({
    userId: userId as any,
    createdAt: {
      $gte: weekStartDate,
      $lt: weekEndDate,
    },
  })
    .sort({ createdAt: 1 })
    .lean();

  if (entries.length === 0) {
    throw new Error('No entries found for the week');
  }

  const entriesData = entries.map((entry: any) => ({
    text: entry.rawText,
    date: entry.createdAt.toISOString().split('T')[0],
  }));

  const startTime = Date.now();
  const insight = await aiAdapter.generateWeeklyInsight(entriesData);
  const latencyMs = Date.now() - startTime;

  await WeeklyInsight.create({
    userId,
    weekStart: weekStartDate,
    summaryText: insight.summaryText,
    trends: insight.trends,
    topThemes: insight.topThemes,
    topStressors: insight.topStressors,
    positives: insight.positives,
    ai: {
      model: 'gpt-4o-mini', // Default model
      promptVersion: PROMPT_VERSION,
      tokens: insight.tokens,
      latencyMs: insight.latencyMs,
    },
  });

  console.log(`[Worker] Weekly insight complete for week ${weekStart}`);
}

/**
 * Process a single job
 */
async function processJob(jobId: mongoose.Types.ObjectId): Promise<void> {
  const job = await Job.findById(jobId);
  if (!job) {
    console.error(`[Worker] Job not found: ${jobId}`);
    return;
  }

  console.log(`[Worker] Processing job ${jobId} (type: ${job.type})`);

  let aiAdapter: any;
  try {
    aiAdapter = createAIAdapter();
  } catch (error: any) {
    throw new Error(`Failed to create AI adapter: ${error.message}`);
  }

  try {
    if (job.type === JobType.ENTRY_ANALYSIS) {
      await processEntryAnalysis(job, aiAdapter);
    } else if (job.type === JobType.WEEKLY_INSIGHT) {
      await processWeeklyInsight(job, aiAdapter);
    } else {
      throw new Error(`Unknown job type: ${job.type}`);
    }

    // Mark job as done
    await Job.findByIdAndUpdate(jobId, {
      status: JobStatus.DONE,
      lockedAt: undefined,
    });

    console.log(`[Worker] Job ${jobId} completed successfully`);
  } catch (error: any) {
    console.error(`[Worker] Job ${jobId} failed:`, error.message);

    const newAttempts = job.attempts + 1;

    if (newAttempts >= job.maxAttempts) {
      // Mark as failed
      await Job.findByIdAndUpdate(jobId, {
        status: JobStatus.FAILED,
        attempts: newAttempts,
        lastError: error.message,
        lockedAt: undefined,
      });
      console.error(`[Worker] Job ${jobId} failed after ${newAttempts} attempts`);
    } else {
      // Retry with exponential backoff
      const backoffDelay = getBackoffDelay(newAttempts);
      const runAt = new Date(Date.now() + backoffDelay);

      await Job.findByIdAndUpdate(jobId, {
        status: JobStatus.PENDING,
        attempts: newAttempts,
        lastError: error.message,
        runAt,
        lockedAt: undefined,
      });

      console.log(
        `[Worker] Job ${jobId} will retry in ${backoffDelay}ms (attempt ${newAttempts}/${job.maxAttempts})`
      );
    }
  }
}

/**
 * Main worker loop
 */
async function workerLoop() {
  console.log('[Worker] Starting worker loop...');
  let pollCount = 0;

  while (true) {
    try {
      pollCount++;
      if (pollCount % 12 === 0) {
        // Log every minute (12 * 5s = 60s)
        console.log(`[Worker] Still polling... (${pollCount} polls)`);
      }
      
      const jobId = await claimJob();

      if (jobId) {
        await processJob(jobId);
      } else {
        // No jobs available, wait before polling again
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    } catch (error: any) {
      console.error('[Worker] Error in worker loop:', error);
      console.error('[Worker] Stack:', error.stack);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

/**
 * Initialize and start worker
 */
async function start() {
  try {
    console.log('[Worker] Connecting to database...');
    await connectDB();
    console.log('[Worker] Connected to database');

    console.log('[Worker] Starting worker...');
    await workerLoop();
  } catch (error: any) {
    console.error('[Worker] Fatal error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Worker] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Worker] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

start();

