'use server';

import connectDB from '@/lib/mongodb';
import { Settings } from '@cptsd/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const settingsSchema = z.object({
  defaultModel: z.string().min(1, 'Default model is required'),
  systemPrompt: z.string().min(1, 'System prompt is required'),
});

/**
 * Get all settings
 */
export async function getSettings() {
  try {
    // During build time, skip database queries and return defaults
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                        (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI);
    if (isBuildTime) {
      return {
        success: true,
        settings: {
          defaultModel: 'gpt-4o',
          systemPrompt:
            'You are a content creator specializing in CPTSD awareness. Create engaging, educational, and validating content for social media posts. Focus on providing helpful, compassionate, and informative content that helps people understand and heal from CPTSD.',
        },
      };
    }

    await connectDB();

    const settings = await Settings.find({}).lean();

    const settingsMap: Record<string, string> = {};
    settings.forEach((setting: any) => {
      settingsMap[setting.key] = setting.value;
    });

    return {
      success: true,
      settings: {
        defaultModel: settingsMap.defaultModel || 'gpt-4o',
        systemPrompt:
          settingsMap.systemPrompt ||
          'You are a content creator specializing in CPTSD awareness. Create engaging, educational, and validating content for social media posts. Focus on providing helpful, compassionate, and informative content that helps people understand and heal from CPTSD.',
      },
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch settings',
      settings: {
        defaultModel: 'gpt-4o',
        systemPrompt:
          'You are a content creator specializing in CPTSD awareness. Create engaging, educational, and validating content for social media posts. Focus on providing helpful, compassionate, and informative content that helps people understand and heal from CPTSD.',
      },
    };
  }
}

/**
 * Update settings
 */
export async function updateSettings(formData: FormData) {
  try {
    await connectDB();

    const defaultModel = formData.get('defaultModel') as string;
    const systemPrompt = formData.get('systemPrompt') as string;

    const validated = settingsSchema.parse({
      defaultModel,
      systemPrompt,
    });

    // Update or create settings
    await Settings.findOneAndUpdate(
      { key: 'defaultModel' },
      { key: 'defaultModel', value: validated.defaultModel, description: 'Default OpenAI model for content generation' },
      { upsert: true, new: true, runValidators: true }
    );

    await Settings.findOneAndUpdate(
      { key: 'systemPrompt' },
      { key: 'systemPrompt', value: validated.systemPrompt, description: 'Default system prompt for content generation' },
      { upsert: true, new: true, runValidators: true }
    );

    revalidatePath('/settings');

    return {
      success: true,
      message: 'Settings updated successfully',
    };
  } catch (error) {
    console.error('Error updating settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    };
  }
}

