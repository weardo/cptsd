import OpenAI from 'openai';
import connectDB from './mongodb';
import { PromptTemplate } from '@cptsd/db';
import { getTokenLimitParams } from './openaiHelpers';

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY is not set. OpenAI features will not work.');
}

// Initialize OpenAI client lazily to avoid build-time errors
let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY || 'build-placeholder-key';
    openaiInstance = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openaiInstance;
}

export type GenerateIdeasRequest = {
  topicName: string;
  topicSlug: string;
  topicId?: string; // MongoDB ObjectId as string
  postType: 'CAROUSEL' | 'REEL' | 'STORY' | 'MEME';
  tone: 'educational' | 'validating' | 'gentle-cta';
  count: number; // Number of ideas to generate (1-10)
  intent?: string; // Optional intent/goal
  templateId?: string; // Optional prompt template ID
  model?: string; // Optional model override
};

export type IdeaResult = {
  intent: string;
  notes: string;
  variations: string[]; // AI-generated storylines/variations
  suggestedScript?: string;
};

export type GenerateIdeasResponse = {
  ideas: IdeaResult[];
};

/**
 * Generate content ideas using OpenAI
 */
export async function generateIdeas(request: GenerateIdeasRequest): Promise<GenerateIdeasResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Please configure OpenAI API key in .env.local');
  }

  // Get default model and system prompt from settings
  const { getDefaultModel, getSystemPrompt } = await import('./settings');
  const defaultModel = await getDefaultModel();
  const defaultSystemPrompt = await getSystemPrompt();

  const model = request.model || defaultModel;

  let systemPrompt =
    'You are a content creator specializing in CPTSD awareness. Generate creative, engaging, and helpful content ideas for social media posts.';
  let userPrompt = `Topic: ${request.topicName}\nPost Type: ${request.postType}\nTone: ${request.tone}\nGenerate ${request.count} distinct content ideas.\n${request.intent ? `Intent: ${request.intent}` : ''}\n\nFor each idea, provide:\n1. Intent (what's the goal/purpose)\n2. Rough notes (key points to cover)\n3. 2-3 variations/storylines (different angles to approach the topic)\n\nReturn as JSON array with structure: [{"intent": "...", "notes": "...", "variations": ["...", "..."]}]`;

  // If template is provided, use it
  if (request.templateId) {
    await connectDB();
    const template = await PromptTemplate.findById(request.templateId).lean();
    if (template && template.isActive) {
      systemPrompt = template.systemPrompt;
      userPrompt = template.userPromptTemplate
        .replace(/{topic}/g, request.topicName)
        .replace(/{topicSlug}/g, request.topicSlug)
        .replace(/{postType}/g, request.postType)
        .replace(/{tone}/g, request.tone)
        .replace(/{intent}/g, request.intent || '')
        .replace(/{count}/g, request.count.toString());
      
      // Increment usage count
      await PromptTemplate.findByIdAndUpdate(request.templateId, {
        $inc: { usageCount: 1 },
      });
    }
  }

  const response = await getOpenAI().chat.completions.create({
    model: model, // Use selected model or default
    messages: [
      {
        role: 'system',
        content: systemPrompt + '\n\nIMPORTANT: You must respond with valid JSON only. Return a JSON object with an "ideas" array containing the generated ideas.',
      },
      {
        role: 'user',
        content: userPrompt + '\n\nRespond with a JSON object in this format: {"ideas": [{"intent": "...", "notes": "...", "variations": ["...", "..."]}]}',
      },
    ],
    temperature: 0.8, // Higher temperature for more creative ideas
    ...getTokenLimitParams(model, 3000),
    // Note: gpt-4o supports response_format, but we'll use prompt-based JSON for better compatibility
    // response_format: { type: 'json_object' }, // Only works with certain models
  });

  let content = response.choices[0]?.message?.content || '{}';
  
  // Strip markdown code blocks if present (```json ... ``` or ``` ... ```)
  content = content.trim();
  if (content.startsWith('```')) {
    // Remove opening ```json or ```
    content = content.replace(/^```(?:json)?\s*\n?/i, '');
    // Remove closing ```
    content = content.replace(/\n?```\s*$/i, '');
    content = content.trim();
  }
  
  try {
    const parsed = JSON.parse(content);
    
    // Handle different response formats
    let ideas: IdeaResult[] = [];
    
    if (Array.isArray(parsed)) {
      ideas = parsed;
    } else if (parsed.ideas && Array.isArray(parsed.ideas)) {
      ideas = parsed.ideas;
    } else if (parsed.content && Array.isArray(parsed.content)) {
      ideas = parsed.content;
    } else {
      // Try to extract from any array in the response
      const keys = Object.keys(parsed);
      for (const key of keys) {
        if (Array.isArray(parsed[key])) {
          ideas = parsed[key];
          break;
        }
      }
    }

    // Validate and format ideas
    const formattedIdeas: IdeaResult[] = ideas.slice(0, request.count).map((idea: any) => ({
      intent: idea.intent || 'Create awareness content',
      notes: idea.notes || idea.roughNotes || idea.description || '',
      variations: Array.isArray(idea.variations)
        ? idea.variations
        : idea.variations
        ? [idea.variations]
        : [],
      suggestedScript: idea.suggestedScript || idea.script,
    }));

    return { ideas: formattedIdeas };
  } catch (e) {
    // Fallback: parse as text and extract ideas manually
    console.error('Failed to parse JSON response, trying text parsing:', e);
    
    // Try to extract ideas from text
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    const ideas: IdeaResult[] = [];
    
    let currentIdea: Partial<IdeaResult> | null = null;
    for (const line of lines) {
      if (line.match(/^(\d+)[\.\)]\s*(.+)/i)) {
        // New idea
        if (currentIdea) {
          ideas.push({
            intent: currentIdea.intent || 'Create awareness content',
            notes: currentIdea.notes || '',
            variations: currentIdea.variations || [],
          });
        }
        currentIdea = {
          intent: line.replace(/^\d+[\.\)]\s*/i, ''),
          notes: '',
          variations: [],
        };
      } else if (line.toLowerCase().includes('intent') && currentIdea) {
        currentIdea.intent = line.replace(/intent[:]?\s*/i, '').trim();
      } else if (line.toLowerCase().includes('notes') && currentIdea) {
        currentIdea.notes = line.replace(/notes[:]?\s*/i, '').trim();
      } else if (line.toLowerCase().includes('variation') && currentIdea) {
        const variation = line.replace(/variation[s]?[:]?\s*/i, '').trim();
        if (variation) {
          currentIdea.variations = currentIdea.variations || [];
          currentIdea.variations.push(variation);
        }
      } else if (currentIdea) {
        // Accumulate notes
        currentIdea.notes += (currentIdea.notes ? '\n' : '') + line.trim();
      }
    }
    
    if (currentIdea) {
      ideas.push({
        intent: currentIdea.intent || 'Create awareness content',
        notes: currentIdea.notes || '',
        variations: currentIdea.variations || [],
      });
    }

    return { ideas: ideas.slice(0, request.count) };
  }
}

/**
 * Generate content from an idea using OpenAI (script, caption, hashtags)
 */
export async function generateContentFromIdea(ideaId: string, model?: string): Promise<{
  script: string;
  caption: string;
  hashtags: string[];
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  await connectDB();
  const ContentIdea = (await import('@/models/ContentIdea')).default;
  const Topic = (await import('@/models/Topic')).default;
  
  // Get default model and system prompt from settings
  const { getDefaultModel, getSystemPrompt } = await import('./settings');
  const defaultModel = await getDefaultModel();
  const defaultSystemPrompt = await getSystemPrompt();
  
  const idea = await ContentIdea.findById(ideaId).populate('topicId').lean();
  
  if (!idea) {
    throw new Error('Idea not found');
  }

  const topic = (idea as any).topicId;
  if (!topic || typeof topic !== 'object') {
    throw new Error('Topic not found');
  }

  // Build context from idea items
  const ideaText = idea.items
    ?.filter((item) => item.type === 'text')
    .map((item) => item.content)
    .join('\n\n') || idea.notes || '';

  const selectedModel = model || defaultModel;
  const systemPrompt = defaultSystemPrompt;

  // Generate script
  const scriptResponse = await getOpenAI().chat.completions.create({
    model: selectedModel,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Topic: ${topic.name}\nPost Type: ${idea.postType || 'CAROUSEL'}\nTone: ${idea.tone || 'educational'}\nIntent: ${idea.intent || 'Create awareness'}\nIdea Notes:\n${ideaText}\n${idea.aiVariations?.length ? `Variations:\n${idea.aiVariations.join('\n')}` : ''}\n\nCreate a detailed script for this content.`,
      },
    ],
    temperature: 0.7,
    ...getTokenLimitParams(selectedModel, 2000),
  });

  const script = scriptResponse.choices[0]?.message?.content || '';

  // Generate caption
  const captionResponse = await getOpenAI().chat.completions.create({
    model: selectedModel,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Topic: ${topic.name}\nPost Type: ${idea.postType || 'CAROUSEL'}\nTone: ${idea.tone || 'educational'}\nScript: ${script}\n\nCreate a compelling social media caption.`,
      },
    ],
    temperature: 0.7,
    ...getTokenLimitParams(selectedModel, 1000),
  });

  const caption = captionResponse.choices[0]?.message?.content || '';

  // Generate hashtags
  const hashtagsResponse = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini', // Use gpt-4o-mini for hashtags (faster, cheaper, supports JSON)
    messages: [
      {
        role: 'system',
        content: 'Generate relevant hashtags for CPTSD awareness content. You must respond with valid JSON only. Return a JSON object with a "hashtags" array of hashtag strings.',
      },
      {
        role: 'user',
        content: `Topic: ${topic.name}\nCaption: ${caption}\n\nGenerate 10-15 relevant hashtags as a JSON array. Respond in this format: {"hashtags": ["#hashtag1", "#hashtag2", ...]}`,
      },
    ],
    temperature: 0.5,
    ...getTokenLimitParams('gpt-4o-mini', 200),
    // Note: Removed response_format for better compatibility - using prompt-based JSON instead
  });

  let hashtags: string[] = [];
  let hashtagsText = hashtagsResponse.choices[0]?.message?.content?.trim() || '';
  
  // Strip markdown code blocks if present
  if (hashtagsText.startsWith('```')) {
    hashtagsText = hashtagsText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  }
  
  try {
    const parsed = JSON.parse(hashtagsText);
    if (Array.isArray(parsed)) {
      hashtags = parsed;
    } else if (Array.isArray(parsed.hashtags)) {
      hashtags = parsed.hashtags;
    } else {
      const hashtagRegex = /#\w+/g;
      hashtags = hashtagsText.match(hashtagRegex) || [];
    }
  } catch (e) {
    const hashtagRegex = /#\w+/g;
    hashtags = hashtagsText.match(hashtagRegex) || [];
  }

  return { script, caption, hashtags };
}

