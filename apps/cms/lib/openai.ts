import OpenAI from 'openai';
import { getTokenLimitParams } from './openaiHelpers';

// Initialize OpenAI client lazily to avoid build-time errors
let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY || 'build-placeholder-key';
    openaiInstance = new OpenAI({
      apiKey: apiKey,
    });
    
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY is not set. OpenAI features will not work.');
      console.warn('   Please set OPENAI_API_KEY in .env.local');
    }
  }
  return openaiInstance;
}

export type GenerateContentRequest = {
  topicName: string;
  topicSlug: string;
  postType: 'CAROUSEL' | 'REEL' | 'STORY' | 'MEME';
  rawIdea: string;
  tone: 'educational' | 'validating' | 'gentle-cta';
  finchScreenshotUrl?: string | null;
  model?: string; // Optional model override
  systemPrompt?: string; // Optional system prompt override
};

export type GenerateContentResponse = {
  script: string;
  caption: string;
  hashtags: string[] | string;
  ai_background_urls?: string[];
  zip_url?: string;
};

/**
 * Generate content using OpenAI directly
 * Replaces n8n webhook call
 */
export async function generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Please configure OpenAI API key in .env.local');
  }

  // Get default model and system prompt from settings
  const { getDefaultModel, getSystemPrompt } = await import('./settings');
  const defaultModel = await getDefaultModel();
  const defaultSystemPrompt = await getSystemPrompt();

  const model = request.model || defaultModel;
  const systemPrompt = request.systemPrompt || defaultSystemPrompt;

  // Generate script
  const scriptResponse = await getOpenAI().chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Topic: ${request.topicName}\nPost Type: ${request.postType}\nTone: ${request.tone}\nRaw Idea: ${request.rawIdea}\n${request.finchScreenshotUrl ? `Finch Screenshot: ${request.finchScreenshotUrl}` : ''}\n\nCreate a detailed script for this content following the tone: ${request.tone}. The script should be engaging, informative, and appropriate for the post type (${request.postType}).`,
      },
    ],
    temperature: 0.7,
    ...getTokenLimitParams(model, 2000),
  });

  const script = scriptResponse.choices[0]?.message?.content || '';

  // Generate caption
  const captionResponse = await getOpenAI().chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Topic: ${request.topicName}\nPost Type: ${request.postType}\nTone: ${request.tone}\nRaw Idea: ${request.rawIdea}\nScript: ${script}\n\nCreate a compelling social media caption for this post with tone: ${request.tone}. The caption should be engaging and appropriate for ${request.postType} format.`,
      },
    ],
    temperature: 0.7,
    ...getTokenLimitParams(model, 1000),
  });

  const caption = captionResponse.choices[0]?.message?.content || '';

  // Generate hashtags
  const hashtagsResponse = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini', // Use gpt-4o-mini for hashtags (faster, cheaper)
    messages: [
      {
        role: 'system',
        content: 'You are a social media expert. Generate relevant hashtags for CPTSD awareness content. You must respond with valid JSON only. Return a JSON object with a "hashtags" array of hashtag strings.',
      },
      {
        role: 'user',
        content: `Topic: ${request.topicName}\nPost Type: ${request.postType}\nCaption: ${caption}\n\nGenerate 10-15 relevant hashtags. Respond in this format: {"hashtags": ["#hashtag1", "#hashtag2", ...]}`,
      },
    ],
    temperature: 0.5,
    ...getTokenLimitParams('gpt-4o-mini', 200),
  });

  let hashtags: string[] | string = [];
  let hashtagsText = hashtagsResponse.choices[0]?.message?.content?.trim() || '';

  // Strip markdown code blocks if present
  if (hashtagsText.startsWith('```')) {
    hashtagsText = hashtagsText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  }

  try {
    // Try to parse as JSON
    const parsed = JSON.parse(hashtagsText);
    if (Array.isArray(parsed)) {
      hashtags = parsed;
    } else if (Array.isArray(parsed.hashtags)) {
      hashtags = parsed.hashtags;
    } else {
      throw new Error('Not an array');
    }
  } catch (e) {
    // If not JSON, try to extract hashtags from text
    const hashtagRegex = /#\w+/g;
    const matches = hashtagsText.match(hashtagRegex);
    if (matches) {
      hashtags = matches;
    } else {
      // Fallback: split by lines or commas
      hashtags = hashtagsText
        .split(/[\n,]/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0 && tag.startsWith('#'));
    }
  }

  return {
    script,
    caption,
    hashtags,
    ai_background_urls: [],
    zip_url: '',
  };
}

