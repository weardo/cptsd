import OpenAI from 'openai';
import {
  EntryAnalysisSchema,
  WeeklyInsightSchema,
} from './schemas';
import { PROMPT_VERSION, CHAT_SYSTEM_PROMPT, ANALYSIS_SYSTEM_PROMPT, WEEKLY_INSIGHT_SYSTEM_PROMPT } from './prompts';

/**
 * AI Model Adapter Interface
 * Abstracts OpenAI calls so we can swap providers later
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  content: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  latencyMs: number;
}

export interface AnalysisResult {
  emotions: Array<{ label: string; score: number }>;
  themes: Array<{ label: string; score: number }>;
  stressors: Array<{ label: string; score: number }>;
  coping?: Array<{ label: string; score: number }>;
  sentimentScore: number;
  risk: {
    level: 'none' | 'low' | 'medium' | 'high';
    reasons: string[];
  };
  tokens: number;
  latencyMs: number;
}

export interface WeeklyInsightResult {
  summaryText: string;
  trends: {
    mood?: Array<{ date: string; value: number }>;
    sleep?: Array<{ date: string; value: number }>;
    stress?: Array<{ date: string; value: number }>;
  };
  topThemes: Array<{ label: string; count: number }>;
  topStressors: Array<{ label: string; count: number }>;
  positives: Array<{ label: string; count: number }>;
  tokens: number;
  latencyMs: number;
}

export class AIAdapter {
  private openai: OpenAI;
  private defaultModel: string;

  constructor(apiKey: string, baseURL?: string, defaultModel: string = 'gpt-4o-mini') {
    this.openai = new OpenAI({
      apiKey,
      baseURL,
    });
    this.defaultModel = defaultModel;
  }

  /**
   * Generate chat reply
   */
  async generateChatReply(
    messages: ChatMessage[],
    model?: string
  ): Promise<ChatResponse> {
    const startTime = Date.now();
    const selectedModel = model || this.defaultModel;

    const systemMessage: ChatMessage = {
      role: 'system',
      content: CHAT_SYSTEM_PROMPT,
    };

    const response = await this.openai.chat.completions.create({
      model: selectedModel,
      messages: [systemMessage, ...messages],
      temperature: 0.7,
    });

    const latencyMs = Date.now() - startTime;
    const choice = response.choices[0];
    const usage = response.usage;

    return {
      content: choice?.message?.content || '',
      tokensIn: usage?.prompt_tokens || 0,
      tokensOut: usage?.completion_tokens || 0,
      model: selectedModel,
      latencyMs,
    };
  }

  /**
   * Analyze journal entry
   * Returns structured analysis with validation
   */
  async analyzeEntry(
    entryText: string,
    model?: string
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const selectedModel = model || this.defaultModel;

    const response = await this.openai.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: ANALYSIS_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Analyze this journal entry and return ONLY valid JSON matching the schema:\n\n${entryText}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '{}';
    const usage = response.usage;

    // Parse and validate JSON
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      // Retry once with "fix JSON" prompt
      return this.analyzeEntryWithRetry(entryText, selectedModel, content);
    }

    // Try to fix common issues before validation
    if (parsed.emotions && !Array.isArray(parsed.emotions)) {
      parsed.emotions = Object.values(parsed.emotions);
    }
    if (parsed.themes && !Array.isArray(parsed.themes)) {
      parsed.themes = Object.values(parsed.themes);
    }
    if (parsed.stressors && !Array.isArray(parsed.stressors)) {
      parsed.stressors = Object.values(parsed.stressors);
    }
    if (parsed.coping && !Array.isArray(parsed.coping)) {
      parsed.coping = Object.values(parsed.coping);
    }
    if (typeof parsed.sentimentScore !== 'number') {
      parsed.sentimentScore = parsed.sentimentScore ? parseFloat(parsed.sentimentScore) : 0;
    }
    if (!parsed.risk || typeof parsed.risk !== 'object') {
      parsed.risk = { level: 'none', reasons: [] };
    }

    // Validate with Zod
    const validationResult = EntryAnalysisSchema.safeParse(parsed);
    if (!validationResult.success) {
      // Retry once with "fix JSON" prompt
      return this.analyzeEntryWithRetry(entryText, selectedModel, content);
    }

    return {
      ...validationResult.data,
      tokens: (usage?.total_tokens || 0),
      latencyMs,
    };
  }

  /**
   * Retry analysis with "fix JSON" prompt
   */
  private async analyzeEntryWithRetry(
    entryText: string,
    model: string,
    invalidJson: string
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    const schemaDescription = `{
  "emotions": [{"label": "string", "score": 0-1}],
  "themes": [{"label": "string", "score": 0-1}],
  "stressors": [{"label": "string", "score": 0-1}],
  "coping": [{"label": "string", "score": 0-1}],
  "sentimentScore": -1 to 1,
  "risk": {"level": "none|low|medium|high", "reasons": ["string"]}
}`;

    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: ANALYSIS_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `The previous JSON was invalid. Please return valid JSON matching this exact schema:\n${schemaDescription}\n\nThe invalid JSON was: ${invalidJson}\n\nNow analyze this entry and return ONLY valid JSON:\n\n${entryText}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '{}';
    const usage = response.usage;

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error('[AI] Failed to parse JSON after retry:', error);
      return {
        emotions: [],
        themes: [],
        stressors: [],
        sentimentScore: 0,
        risk: { level: 'none', reasons: ['JSON parsing failed'] },
        tokens: usage?.total_tokens || 0,
        latencyMs,
      };
    }

    // Try to fix common issues before validation
    if (parsed.emotions && !Array.isArray(parsed.emotions)) {
      parsed.emotions = Object.values(parsed.emotions);
    }
    if (parsed.themes && !Array.isArray(parsed.themes)) {
      parsed.themes = Object.values(parsed.themes);
    }
    if (parsed.stressors && !Array.isArray(parsed.stressors)) {
      parsed.stressors = Object.values(parsed.stressors);
    }
    if (parsed.coping && !Array.isArray(parsed.coping)) {
      parsed.coping = Object.values(parsed.coping);
    }
    if (typeof parsed.sentimentScore !== 'number') {
      parsed.sentimentScore = parsed.sentimentScore ? parseFloat(parsed.sentimentScore) : 0;
    }
    if (!parsed.risk || typeof parsed.risk !== 'object') {
      parsed.risk = { level: 'none', reasons: [] };
    }

    const validationResult = EntryAnalysisSchema.safeParse(parsed);

    if (!validationResult.success) {
      // If still invalid, return a safe default
      console.error('[AI] Failed to parse analysis after retry:', validationResult.error);
      return {
        emotions: [],
        themes: [],
        stressors: [],
        sentimentScore: 0,
        risk: { level: 'none', reasons: ['Analysis parsing failed'] },
        tokens: usage?.total_tokens || 0,
        latencyMs,
      };
    }

    return {
      ...validationResult.data,
      tokens: usage?.total_tokens || 0,
      latencyMs,
    };
  }

  /**
   * Generate weekly insight
   */
  async generateWeeklyInsight(
    entries: Array<{ text: string; date: string }>,
    model?: string
  ): Promise<WeeklyInsightResult> {
    const startTime = Date.now();
    const selectedModel = model || this.defaultModel;

    const entriesText = entries
      .map((e, i) => `Entry ${i + 1} (${e.date}):\n${e.text}`)
      .join('\n\n---\n\n');

    const schemaDescription = `{
  "summaryText": "string",
  "trends": {
    "mood": [{"date": "YYYY-MM-DD", "value": number}],
    "sleep": [{"date": "YYYY-MM-DD", "value": number}],
    "stress": [{"date": "YYYY-MM-DD", "value": number}]
  },
  "topThemes": [{"label": "string", "count": number}],
  "topStressors": [{"label": "string", "count": number}],
  "positives": [{"label": "string", "count": number}]
}`;

    const response = await this.openai.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: WEEKLY_INSIGHT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Generate weekly insights from these journal entries. Return ONLY valid JSON matching this exact schema:\n${schemaDescription}\n\nJournal entries:\n${entriesText}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '{}';
    const usage = response.usage;

    // Parse and validate
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      return this.generateWeeklyInsightWithRetry(entries, selectedModel, content);
    }

    // Normalize data before validation
    if (!parsed.summaryText || typeof parsed.summaryText !== 'string') {
      parsed.summaryText = parsed.summary || parsed.text || 'No summary available.';
    }
    if (!parsed.trends || typeof parsed.trends !== 'object') {
      parsed.trends = {};
    }
    if (!Array.isArray(parsed.topThemes)) {
      parsed.topThemes = parsed.topThemes ? Object.values(parsed.topThemes) : [];
    }
    if (!Array.isArray(parsed.topStressors)) {
      parsed.topStressors = parsed.topStressors ? Object.values(parsed.topStressors) : [];
    }
    if (!Array.isArray(parsed.positives)) {
      parsed.positives = parsed.positives ? Object.values(parsed.positives) : [];
    }

    const validationResult = WeeklyInsightSchema.safeParse(parsed);
    if (!validationResult.success) {
      return this.generateWeeklyInsightWithRetry(entries, selectedModel, content);
    }

    return {
      ...validationResult.data,
      tokens: usage?.total_tokens || 0,
      latencyMs,
    };
  }

  /**
   * Retry weekly insight with "fix JSON" prompt
   */
  private async generateWeeklyInsightWithRetry(
    entries: Array<{ text: string; date: string }>,
    model: string,
    invalidJson: string
  ): Promise<WeeklyInsightResult> {
    const startTime = Date.now();

    const entriesText = entries
      .map((e, i) => `Entry ${i + 1} (${e.date}):\n${e.text}`)
      .join('\n\n---\n\n');

    const schemaDescription = `{
  "summaryText": "string",
  "trends": {
    "mood": [{"date": "YYYY-MM-DD", "value": number}],
    "sleep": [{"date": "YYYY-MM-DD", "value": number}],
    "stress": [{"date": "YYYY-MM-DD", "value": number}]
  },
  "topThemes": [{"label": "string", "count": number}],
  "topStressors": [{"label": "string", "count": number}],
  "positives": [{"label": "string", "count": number}]
}`;

    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: WEEKLY_INSIGHT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `The previous JSON was invalid. Please return valid JSON matching this exact schema:\n${schemaDescription}\n\nThe invalid JSON was: ${invalidJson}\n\nNow generate insights from these entries:\n${entriesText}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '{}';
    const usage = response.usage;

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error('[AI] Failed to parse JSON after retry:', error);
      return {
        summaryText: 'Unable to generate insights at this time.',
        trends: {},
        topThemes: [],
        topStressors: [],
        positives: [],
        tokens: usage?.total_tokens || 0,
        latencyMs,
      };
    }

    // Normalize data before validation
    if (!parsed.summaryText || typeof parsed.summaryText !== 'string') {
      parsed.summaryText = parsed.summary || parsed.text || 'No summary available.';
    }
    if (!parsed.trends || typeof parsed.trends !== 'object') {
      parsed.trends = {};
    }
    if (!Array.isArray(parsed.topThemes)) {
      parsed.topThemes = parsed.topThemes ? Object.values(parsed.topThemes) : [];
    }
    if (!Array.isArray(parsed.topStressors)) {
      parsed.topStressors = parsed.topStressors ? Object.values(parsed.topStressors) : [];
    }
    if (!Array.isArray(parsed.positives)) {
      parsed.positives = parsed.positives ? Object.values(parsed.positives) : [];
    }

    const validationResult = WeeklyInsightSchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error('[AI] Failed to parse weekly insight after retry:', validationResult.error);
      return {
        summaryText: 'Unable to generate insights at this time.',
        trends: {},
        topThemes: [],
        topStressors: [],
        positives: [],
        tokens: usage?.total_tokens || 0,
        latencyMs,
      };
    }

    return {
      ...validationResult.data,
      tokens: usage?.total_tokens || 0,
      latencyMs,
    };
  }
}

/**
 * Factory function to create AI adapter
 */
export function createAIAdapter(
  apiKey?: string,
  baseURL?: string,
  model?: string
): AIAdapter {
  const key = apiKey || process.env.OPENAI_API_KEY || '';
  if (!key) {
    throw new Error('OPENAI_API_KEY is required');
  }
  return new AIAdapter(key, baseURL, model || process.env.OPENAI_MODEL || 'gpt-4o-mini');
}

