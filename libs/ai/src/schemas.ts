import { z } from 'zod';

/**
 * Zod schemas for structured AI output validation
 */

export const EmotionSchema = z.object({
  label: z.string(),
  score: z.number().min(0).max(1),
});

export const ThemeSchema = z.object({
  label: z.string(),
  score: z.number().min(0).max(1),
});

export const StressorSchema = z.object({
  label: z.string(),
  score: z.number().min(0).max(1),
});

export const CopingSchema = z.object({
  label: z.string(),
  score: z.number().min(0).max(1),
});

export const RiskSchema = z.object({
  level: z.enum(['none', 'low', 'medium', 'high']),
  reasons: z.array(z.string()),
});

export const EntryAnalysisSchema = z.object({
  emotions: z.array(EmotionSchema),
  themes: z.array(ThemeSchema),
  stressors: z.array(StressorSchema),
  coping: z.array(CopingSchema).optional(),
  sentimentScore: z.number().min(-1).max(1),
  risk: RiskSchema,
});

export const TrendItemSchema = z.object({
  date: z.string(),
  value: z.number(),
});

export const TrendsSchema = z.object({
  mood: z.array(TrendItemSchema).optional(),
  sleep: z.array(TrendItemSchema).optional(),
  stress: z.array(TrendItemSchema).optional(),
});

export const TopItemSchema = z.object({
  label: z.string(),
  count: z.number(),
});

export const WeeklyInsightSchema = z.object({
  summaryText: z.string(),
  trends: TrendsSchema,
  topThemes: z.array(TopItemSchema),
  topStressors: z.array(TopItemSchema),
  positives: z.array(TopItemSchema),
});



