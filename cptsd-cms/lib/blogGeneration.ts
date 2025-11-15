import OpenAI from 'openai';
import { generateSlug } from './utils/slug';
import { extractYouTubeVideoId } from './youtube';

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

export interface BlogGenerationOptions {
  transcription: string;
  title?: string;
  customContent?: string;
  tone?: 'educational' | 'validating' | 'gentle' | 'hopeful' | 'grounding';
  includeImages?: boolean;
  rephrase?: boolean;
  summarize?: boolean;
}

export interface BlogGenerationResult {
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Markdown format with image placeholders
  summary: string;
  imagePositions: Array<{
    position: number; // Character index in content
    description: string; // Description for image generation
    alt: string; // Alt text for the image
  }>;
  readingTime: number;
  seoTitle: string;
  seoDescription: string;
  suggestedTags: string[];
}

/**
 * Calculate reading time in minutes
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Generate blog post from YouTube transcription
 */
export async function generateBlogFromTranscription(
  options: BlogGenerationOptions
): Promise<BlogGenerationResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const {
    transcription,
    title,
    customContent,
    tone = 'gentle',
    includeImages = true,
    rephrase = false,
    summarize = false,
  } = options;

  // Step 1: Summarize if requested
  let processedTranscription = transcription;
  if (summarize) {
    processedTranscription = await summarizeTranscription(transcription, tone);
  }

  // Step 2: Generate or rephrase content
  let blogContent: string;
  if (rephrase) {
    blogContent = await rephraseContent(processedTranscription, tone, customContent);
  } else {
    blogContent = await convertTranscriptionToBlog(processedTranscription, tone, customContent);
  }

  // Step 3: Generate title if not provided
  const generatedTitle = title || (await generateTitle(blogContent, tone));

  // Step 4: Generate excerpt
  const excerpt = await generateExcerpt(blogContent, tone);

  // Step 5: Generate summary
  const summary = await generateSummary(blogContent, tone);

  // Step 6: Identify image positions if images are enabled
  const imagePositions = includeImages
    ? await identifyImagePositions(blogContent, tone)
    : [];

  // Step 7: Generate SEO metadata
  const seoTitle = await generateSEOTitle(generatedTitle, blogContent);
  const seoDescription = await generateSEODescription(excerpt, blogContent);

  // Step 8: Generate suggested tags
  const suggestedTags = await generateTags(blogContent, tone);

  // Step 9: Calculate reading time
  const readingTime = calculateReadingTime(blogContent);

  // Step 10: Insert image placeholders into content
  let finalContent = blogContent;
  if (includeImages && imagePositions.length > 0) {
    // Sort by position (descending) to insert from end to start
    const sortedPositions = [...imagePositions].sort((a, b) => b.position - a.position);
    
    for (const imgPos of sortedPositions) {
      const imageMarkdown = `\n\n![${imgPos.alt}](${imgPos.description})\n\n`;
      finalContent =
        finalContent.slice(0, imgPos.position) +
        imageMarkdown +
        finalContent.slice(imgPos.position);
    }
  }

  return {
    title: generatedTitle,
    slug: generateSlug(generatedTitle),
    excerpt,
    content: finalContent,
    summary,
    imagePositions,
    readingTime,
    seoTitle,
    seoDescription,
    suggestedTags,
  };
}

/**
 * Summarize transcription
 */
async function summarizeTranscription(transcription: string, tone: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a compassionate content creator specializing in CPTSD awareness and healing. Your tone is ${tone} and supportive.`,
      },
      {
        role: 'user',
        content: `Summarize the following YouTube video transcription into a concise version that captures the main points and key insights. Keep the essential information but make it more focused:\n\n${transcription}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || transcription;
}

/**
 * Rephrase content
 */
async function rephraseContent(
  transcription: string,
  tone: string,
  customContent?: string
): Promise<string> {
  const contentToRephrase = customContent
    ? `${transcription}\n\nAdditional content to incorporate:\n${customContent}`
    : transcription;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a compassionate content creator specializing in CPTSD awareness and healing. Your tone is ${tone} and supportive. Rephrase the content to make it more engaging, clear, and accessible while maintaining all key information.`,
      },
      {
        role: 'user',
        content: `Rephrase the following content into a well-structured blog post. Make it engaging, clear, and accessible for people dealing with CPTSD:\n\n${contentToRephrase}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return response.choices[0]?.message?.content || contentToRephrase;
}

/**
 * Convert transcription to blog post
 */
async function convertTranscriptionToBlog(
  transcription: string,
  tone: string,
  customContent?: string
): Promise<string> {
  const baseContent = customContent
    ? `${transcription}\n\nAdditional content to incorporate:\n${customContent}`
    : transcription;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a compassionate content creator specializing in CPTSD awareness and healing. Your tone is ${tone} and supportive. Convert the transcription into a well-structured, engaging blog post with proper headings, paragraphs, and formatting. Use markdown format.`,
      },
      {
        role: 'user',
        content: `Convert the following YouTube video transcription into a well-structured blog post. Use markdown formatting with headings, paragraphs, and lists where appropriate. Make it engaging and accessible for people dealing with CPTSD:\n\n${baseContent}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return response.choices[0]?.message?.content || baseContent;
}

/**
 * Generate title
 */
async function generateTitle(content: string, tone: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a content creator specializing in CPTSD awareness. Generate engaging, SEO-friendly blog titles.`,
      },
      {
        role: 'user',
        content: `Generate a compelling blog title (max 60 characters) for this content:\n\n${content.substring(0, 1000)}`,
      },
    ],
    temperature: 0.8,
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content?.trim() || 'Untitled Blog Post';
}

/**
 * Generate excerpt
 */
async function generateExcerpt(content: string, tone: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a content creator specializing in CPTSD awareness. Generate compelling excerpts for blog posts.`,
      },
      {
        role: 'user',
        content: `Generate a brief excerpt (2-3 sentences, max 160 characters) for this blog post:\n\n${content.substring(0, 1000)}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 150,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

/**
 * Generate summary
 */
async function generateSummary(content: string, tone: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a content creator specializing in CPTSD awareness. Generate concise summaries.`,
      },
      {
        role: 'user',
        content: `Generate a concise summary (3-5 sentences) of this blog post:\n\n${content.substring(0, 2000)}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

/**
 * Identify positions in content where images would be appropriate
 */
async function identifyImagePositions(
  content: string,
  tone: string
): Promise<Array<{ position: number; description: string; alt: string }>> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a content creator specializing in CPTSD awareness. Identify 3-5 strategic positions in blog content where images would enhance understanding and engagement. Consider: section breaks, key concepts, emotional moments, and visual metaphors.`,
      },
      {
        role: 'user',
        content: `Analyze this blog content and identify positions where images would be appropriate. For each position, provide:
1. The character index (position in the content string)
2. A detailed description for image generation (CPTSD-aware, gentle, non-triggering)
3. Alt text for accessibility

Content:\n\n${content}

Respond in JSON format:
{
  "images": [
    {
      "position": 1234,
      "description": "A gentle illustration showing...",
      "alt": "Description of image for screen readers"
    }
  ]
}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  try {
    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return result.images || [];
  } catch (error) {
    console.error('Error parsing image positions:', error);
    return [];
  }
}

/**
 * Generate SEO title
 */
async function generateSEOTitle(title: string, content: string): Promise<string> {
  // Use the title, but ensure it's SEO-friendly (max 60 chars)
  return title.length > 60 ? title.substring(0, 57) + '...' : title;
}

/**
 * Generate SEO description
 */
async function generateSEODescription(excerpt: string, content: string): Promise<string> {
  // Use excerpt if available, otherwise generate one
  if (excerpt && excerpt.length <= 160) {
    return excerpt;
  }

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Generate SEO meta descriptions (max 160 characters).`,
      },
      {
        role: 'user',
        content: `Generate an SEO meta description for this blog post:\n\n${content.substring(0, 1000)}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 100,
  });

  const description = response.choices[0]?.message?.content?.trim() || excerpt;
  return description.length > 160 ? description.substring(0, 157) + '...' : description;
}

/**
 * Generate suggested tags
 */
async function generateTags(content: string, tone: string): Promise<string[]> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Generate relevant tags for CPTSD awareness content. Return a JSON array of tag strings.`,
      },
      {
        role: 'user',
        content: `Generate 5-10 relevant tags for this blog post:\n\n${content.substring(0, 1500)}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 200,
    response_format: { type: 'json_object' },
  });

  try {
    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return result.tags || result.tag || [];
  } catch (error) {
    // Fallback: extract keywords
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 10);
    return words;
  }
}

