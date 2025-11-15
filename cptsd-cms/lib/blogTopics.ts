/**
 * AI-powered blog topic generation
 */

import OpenAI from 'openai';

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

export interface BlogTopic {
  title: string;
  description: string;
  suggestedTags: string[];
  estimatedReadingTime: number;
  keyPoints: string[];
}

/**
 * Generate blog topics based on a theme or keyword
 */
export async function generateBlogTopics(
  theme: string,
  count: number = 5
): Promise<BlogTopic[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a content creator specializing in CPTSD awareness and healing. Generate engaging, helpful blog topic ideas that are:
- Compassionate and validating
- Educational and informative
- Non-triggering and safe
- Practical and actionable
- Relevant to CPTSD recovery and healing`,
        },
        {
          role: 'user',
          content: `Generate ${count} blog topic ideas related to: "${theme}"

For each topic, provide:
1. A compelling title (max 60 characters)
2. A brief description (2-3 sentences)
3. 5-8 suggested tags
4. Estimated reading time in minutes
5. 3-5 key points that would be covered

Return as JSON object with this structure:
{
  "topics": [
    {
      "title": "...",
      "description": "...",
      "suggestedTags": ["tag1", "tag2", ...],
      "estimatedReadingTime": 5,
      "keyPoints": ["point1", "point2", ...]
    }
  ]
}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return result.topics || [];
  } catch (error) {
    console.error('Error generating blog topics:', error);
    throw error;
  }
}

/**
 * Generate blog topics from existing content or transcription
 */
export async function generateTopicsFromContent(
  content: string,
  count: number = 5
): Promise<BlogTopic[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a content creator specializing in CPTSD awareness. Analyze content and suggest related blog topics that would complement or expand on the themes.`,
        },
        {
          role: 'user',
          content: `Based on this content, suggest ${count} related blog topics that would be valuable for CPTSD awareness:\n\n${content.substring(0, 2000)}

Return as JSON object with topics array, each with: title, description, suggestedTags, estimatedReadingTime, and keyPoints.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return result.topics || [];
  } catch (error) {
    console.error('Error generating topics from content:', error);
    throw error;
  }
}

