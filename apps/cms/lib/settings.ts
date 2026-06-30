import connectDB from './mongodb';
import { Settings } from '@cptsd/db';

/**
 * Get a setting value by key
 */
export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
  try {
    await connectDB();
    const setting = await Settings.findOne({ key }).lean();
    return setting?.value || defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Set a setting value by key
 */
export async function setSetting(key: string, value: string, description?: string): Promise<void> {
  try {
    await connectDB();
    await Settings.findOneAndUpdate(
      { key },
      { key, value, description },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
}

/**
 * Get default OpenAI model
 */
export async function getDefaultModel(): Promise<string> {
  return getSetting('defaultModel', 'gpt-4o');
}

/**
 * Get system prompt
 */
export async function getSystemPrompt(): Promise<string> {
  return getSetting(
    'systemPrompt',
    'You are a content creator specializing in CPTSD awareness. Create engaging, educational, and validating content for social media posts. Focus on providing helpful, compassionate, and informative content that helps people understand and heal from CPTSD.'
  );
}

/**
 * Get all available OpenAI models
 * Updated with latest models as of 2024-2025
 * Note: Some newer models may require API access approval
 */
export function getAvailableModels(): Array<{ value: string; label: string; cost: 'low' | 'medium' | 'high' }> {
  return [
    // Latest GPT-5 models (2025) - May require API access approval
    { value: 'gpt-5.1', label: 'GPT-5.1 (Nov 2025) - Latest', cost: 'high' },
    { value: 'gpt-5.1-instant', label: 'GPT-5.1 Instant - Quick replies', cost: 'high' },
    { value: 'gpt-5.1-thinking', label: 'GPT-5.1 Thinking - Complex reasoning', cost: 'high' },
    { value: 'gpt-5', label: 'GPT-5 (Aug 2025) - Advanced', cost: 'high' },
    { value: 'gpt-5-turbo', label: 'GPT-5 Turbo - Fast variant', cost: 'high' },
    
    // Latest GPT-4o models (2024-2025)
    { value: 'gpt-4o-2024-11-20', label: 'GPT-4o (Nov 2024)', cost: 'high' },
    { value: 'gpt-4o-2024-08-06', label: 'GPT-4o (Aug 2024)', cost: 'high' },
    { value: 'gpt-4o-2024-05-13', label: 'GPT-4o (May 2024)', cost: 'high' },
    { value: 'gpt-4o', label: 'GPT-4o - Most capable (4 series)', cost: 'high' },
    
    // GPT-4o Mini models
    { value: 'gpt-4o-mini-2024-07-18', label: 'GPT-4o Mini (Jul 2024)', cost: 'low' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini - Fast, cost-effective', cost: 'low' },
    
    // Reasoning models (o1 series)
    { value: 'o1-preview', label: 'O1 Preview - Advanced reasoning', cost: 'high' },
    { value: 'o1-mini', label: 'O1 Mini - Fast reasoning', cost: 'medium' },
    
    // GPT-4 Turbo series
    { value: 'gpt-4-turbo-2024-04-09', label: 'GPT-4 Turbo (Apr 2024)', cost: 'high' },
    { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo Preview', cost: 'high' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo - Balanced', cost: 'high' },
    
    // GPT-4 legacy models
    { value: 'gpt-4-0125-preview', label: 'GPT-4 (Jan 2024 Preview)', cost: 'high' },
    { value: 'gpt-4-1106-preview', label: 'GPT-4 (Nov 2023 Preview)', cost: 'high' },
    { value: 'gpt-4-0613', label: 'GPT-4 (Jun 2023)', cost: 'high' },
    { value: 'gpt-4-32k-0613', label: 'GPT-4 32k (Jun 2023)', cost: 'high' },
    { value: 'gpt-4-32k', label: 'GPT-4 32k (Legacy)', cost: 'high' },
    { value: 'gpt-4', label: 'GPT-4 (Legacy)', cost: 'high' },
    
    // GPT-3.5 Turbo series
    { value: 'gpt-3.5-turbo-0125', label: 'GPT-3.5 Turbo (Jan 2024)', cost: 'low' },
    { value: 'gpt-3.5-turbo-1106', label: 'GPT-3.5 Turbo (Nov 2023)', cost: 'low' },
    { value: 'gpt-3.5-turbo-16k-0613', label: 'GPT-3.5 Turbo 16k (Jun 2023)', cost: 'low' },
    { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16k', cost: 'low' },
    { value: 'gpt-3.5-turbo-0613', label: 'GPT-3.5 Turbo (Jun 2023)', cost: 'low' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo - Cheapest', cost: 'low' },
  ];
}

