import OpenAI from 'openai';
import { buildImagePrompt, CompositionType, TargetFormat, ImagePromptOptions } from './imagePromptBuilder';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface BlogImagePosition {
  position: number;
  description: string;
  alt: string;
}

export interface GeneratedBlogImage {
  url: string;
  alt: string;
  position: number;
  prompt: string;
  revisedPrompt?: string;
}

/**
 * Generate images for blog post at specified positions
 */
export async function generateBlogImages(
  imagePositions: BlogImagePosition[],
  blogContent: string,
  tone: 'educational' | 'validating' | 'gentle' | 'hopeful' | 'grounding' = 'gentle'
): Promise<GeneratedBlogImage[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  if (imagePositions.length === 0) {
    return [];
  }

  const generatedImages: GeneratedBlogImage[] = [];

  // Generate images one by one to avoid rate limiting
  for (let i = 0; i < imagePositions.length; i++) {
    const imgPos = imagePositions[i];
    
    // Add delay between requests (except for first)
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    try {
      // Build image prompt using the prompt builder
      const promptOptions: ImagePromptOptions = {
        compositionType: 'METAPHOR_SCENE', // Blog images are typically metaphor scenes
        targetFormat: 'FEED_SQUARE', // Blog images are typically square/landscape
        summary: imgPos.description,
        tone: tone as any,
        extraStyleFlags: ['blog-friendly', 'text-space'],
      };

      const prompt = buildImagePrompt(promptOptions);

      // Generate image using DALL-E 3 for better quality (blogs are important content)
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
        n: 1,
      });

      if (response.data && response.data[0]) {
        const image = response.data[0];
        generatedImages.push({
          url: image.url || '',
          alt: imgPos.alt,
          position: imgPos.position,
          prompt: prompt,
          revisedPrompt: image.revised_prompt,
        });
      }
    } catch (error) {
      console.error(`Error generating image at position ${imgPos.position}:`, error);
      // Continue with other images even if one fails
    }
  }

  return generatedImages;
}

/**
 * Replace image placeholders in content with actual image URLs
 */
export function insertBlogImagesIntoContent(
  content: string,
  images: GeneratedBlogImage[]
): string {
  // Sort images by position (descending) to insert from end to start
  const sortedImages = [...images].sort((a, b) => b.position - a.position);

  let finalContent = content;

  for (const image of sortedImages) {
    // Find the placeholder or insert at the position
    const imageMarkdown = `\n\n![${image.alt}](${image.url})\n\n`;
    
    // Try to find placeholder first
    const placeholderPattern = new RegExp(
      `!\\[${image.alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]([^\\n]+)`,
      'g'
    );
    
    if (placeholderPattern.test(finalContent)) {
      finalContent = finalContent.replace(placeholderPattern, `![${image.alt}](${image.url})`);
    } else {
      // Insert at position if no placeholder found
      finalContent =
        finalContent.slice(0, image.position) +
        imageMarkdown +
        finalContent.slice(image.position);
    }
  }

  return finalContent;
}

