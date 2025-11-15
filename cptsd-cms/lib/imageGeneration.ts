import OpenAI from 'openai';
import { analyzeImagesForPrompt, generateImageWithReference } from './imageAnalysis';
import { buildImagePrompt, CompositionType, TargetFormat, ImagePromptOptions } from './imagePromptBuilder';

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY is not set. Image generation will not work.');
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

export type SlidePrompt = {
  slideNumber: number;
  imageDescription: string;
};

export type ImageImportance = 'test' | 'normal' | 'hero';

export type GenerateImageOptions = {
  postId: string;
  script: string;
  caption: string;
  hashtags?: string;
  finchImageUrl?: string;
  tone?: 'educational' | 'validating' | 'gentle-cta';
  postType?: 'CAROUSEL' | 'REEL' | 'STORY' | 'MEME';
  variants?: Array<'FEED' | 'STORY' | 'REEL'>;
  manualSlidePrompts?: SlidePrompt[]; // Manual slide prompts for carousel posts
  model?: string; // Optional model override (for DALL-E: 'dall-e-3' or 'dall-e-2')
  importance?: ImageImportance; // Importance level for model selection
};

export type GeneratedImageAsset = {
  kind: 'IMAGE_FEED' | 'IMAGE_STORY' | 'VIDEO_REEL_DRAFT' | 'IMAGE_CAROUSEL_SLIDE';
  size: string;
  url: string;
  thumbnailUrl?: string;
  slideNumber?: number; // For carousel slides
  compositionType?: CompositionType; // Composition type for controlled variations
  metadata: {
    prompt: string;
    promptUsed?: string; // Alias for prompt
    model: string;
    revised_prompt?: string;
    importance?: ImageImportance; // Store importance level
    actionDescription?: string; // For BIRD_ACTION_SCENE
    extraStyleFlags?: string[]; // Style flags
    generationParams: {
      size: string;
      quality?: string; // Optional - only for DALL-E 3
      style?: string; // Optional - only for DALL-E 3
    };
    slideDescription?: string; // Store the slide description used
  };
};

/**
 * Parse carousel slides from script
 * Extracts individual slide descriptions from carousel post scripts
 */
function parseCarouselSlides(script: string): Array<{ slideNumber: number; imageDescription: string; text: string }> {
  const slides: Array<{ slideNumber: number; imageDescription: string; text: string }> = [];
  
  // Pattern to match slide sections like "Slide 1:", "Slide 2:", etc.
  // Using [\s\S] instead of . with 's' flag for compatibility
  const slidePattern = /(?:^|\n)\s*(?:Slide\s+(\d+)|-?\s*\*\*Slide\s+(\d+)\*\*)[\s:.-]*([\s\S]*?)(?=(?:^|\n)\s*(?:Slide\s+\d+|---|$))/gim;
  
  let match;
  while ((match = slidePattern.exec(script)) !== null) {
    const slideNumber = parseInt(match[1] || match[2] || '0', 10);
    const slideContent = match[3] || '';
    
    // Extract image description (look for "Image:" or "- Image:")
    const imageMatch = slideContent.match(/(?:^|\n)\s*(?:[-*]\s*)?\*\*Image:\*\*\s*(.*?)(?:\n|$)/i);
    const imageDescription = imageMatch ? imageMatch[1].trim() : '';
    
    // Extract text (look for "Text:" or just use the rest)
    const textMatch = slideContent.match(/(?:^|\n)\s*(?:[-*]\s*)?\*\*Text:\*\*\s*(.*?)(?:\n|$)/i);
    const text = textMatch ? textMatch[1].trim() : slideContent.replace(/.*?\*\*Image:\*\*.*?\n/i, '').trim();
    
    if (slideNumber > 0 && (imageDescription || text)) {
      slides.push({
        slideNumber,
        imageDescription: imageDescription || text.substring(0, 150),
        text: text || imageDescription,
      });
    }
  }
  
  // If no slides found with pattern, try alternative pattern (split by ---)
  if (slides.length === 0) {
    const sections = script.split(/---+/);
    sections.forEach((section, index) => {
      if (section.trim()) {
        // Try to find image description in the section
        const imageMatch = section.match(/(?:Image|image)[\s:]*(?:[-*]\s*)?\*\*(.*?)\*\*|[-*]\s*\*\*Image:\*\*\s*(.*?)(?:\n|$)/i);
        const imageDescription = imageMatch ? (imageMatch[1] || imageMatch[2] || '').trim() : section.substring(0, 150).trim();
        const textMatch = section.match(/(?:Text|text)[\s:]*(?:[-*]\s*)?\*\*(.*?)\*\*|[-*]\s*\*\*Text:\*\*\s*(.*?)(?:\n|$)/i);
        const text = textMatch ? (textMatch[1] || textMatch[2] || '').trim() : imageDescription;
        
        if (imageDescription) {
          slides.push({
            slideNumber: index + 1,
            imageDescription: imageDescription.substring(0, 200),
            text: text.substring(0, 200),
          });
        }
      }
    });
  }
  
  // Sort by slide number
  slides.sort((a, b) => a.slideNumber - b.slideNumber);
  
  return slides;
}

/**
 * Base style chunk for all CPTSD images
 * This is prepended to every prompt to ensure consistency
 */
const BASE_STYLE_CHUNK = `Soft, minimal illustration in flat vector style, warm muted colors, gentle and non-triggering, calming and safe atmosphere. 
A cute round bird mascot, similar to a children's book character, acting as a friendly guide. 
No graphic trauma, no violence, no dark themes, no realistic humans, focus on metaphors, emotions and healing.`;

/**
 * Mood-specific prompts for the bird mascot
 */
const moodPrompts: Record<'validating' | 'overwhelmed' | 'hopeful' | 'educational' | 'gentle-cta', string> = {
  validating: 'expression: soft eyes, small smile, body relaxed, posture open and welcoming.',
  overwhelmed: 'expression: slightly tired eyes, gentle slouch, but with a small light or candle nearby symbolizing hope.',
  hopeful: 'expression: bright eyes, wings slightly raised, standing near a small growing plant or sunrise.',
  educational: 'expression: calm, attentive eyes, gentle posture, surrounded by soft visual elements that support learning.',
  'gentle-cta': 'expression: encouraging eyes, slightly forward-leaning posture, with gentle visual cues suggesting forward movement or progress.',
};

/**
 * Choose DALL-E model based on importance level
 */
export function pickImageModel(importance: ImageImportance = 'normal', override?: string): 'dall-e-3' | 'dall-e-2' {
  if (override) {
    return override as 'dall-e-3' | 'dall-e-2';
  }
  
  if (importance === 'hero') return 'dall-e-3';
  if (importance === 'test') return 'dall-e-2';
  return 'dall-e-2'; // Default to cheaper option for normal posts
}

/**
 * Extract summary from post content
 */
function extractPostSummary(script: string, caption: string, slideDescription?: string): string {
  if (slideDescription) {
    return slideDescription.substring(0, 200).trim();
  }
  // Try to extract meaningful summary from caption or script
  const source = caption || script || '';
  return source.substring(0, 200).trim();
}

/**
 * Generate image prompt based on post content
 * Creates a safe, CPTSD-aware, validating prompt using the new template system
 * If finchImageUrl is provided, it will be analyzed using GPT-4o Vision to enhance the prompt
 */
async function createImagePrompt(
  script: string,
  caption: string,
  tone: 'educational' | 'validating' | 'gentle-cta' = 'educational',
  finchImageUrl?: string | null,
  slideDescription?: string,
  imageType: 'FEED' | 'STORY' | 'METAPHOR' = 'FEED'
): Promise<string> {
  const summary = extractPostSummary(script, caption, slideDescription);
  
  // Map tone to mood for bird expression
  const moodKey = tone === 'validating' ? 'validating' : tone === 'gentle-cta' ? 'hopeful' : 'educational';
  const birdMood = moodPrompts[moodKey];
  
  // Determine emotion description based on tone
  let emotion = 'gentle, validating, hopeful';
  if (tone === 'validating') {
    emotion = 'gentle, validating, compassionate';
  } else if (tone === 'gentle-cta') {
    emotion = 'encouraging, hopeful, uplifting';
  } else {
    emotion = 'gentle, educational, supportive';
  }

  // Build prompt based on image type
  let prompt = `${BASE_STYLE_CHUNK}\n\n`;

  if (imageType === 'FEED') {
    // Feed post (1080×1080) template
    prompt += `Create a square illustration for an Instagram feed post about: "${summary}".\n\n`;
    prompt += `The mood should be ${emotion}, for an Indian audience dealing with CPTSD and childhood emotional neglect.\n\n`;
    prompt += `Show the bird mascot ${birdMood}, with simple symbolic elements that represent the key idea. `;
    prompt += `Leave some empty space on one side where text could be placed.\n\n`;
    prompt += `Flat vector, 1080x1080, no text, no logos, no watermarks.`;
  } else if (imageType === 'STORY') {
    // Story / Reel background (1080×1920) template
    prompt += `Create a vertical illustration for an Instagram story / reel background about: "${summary}".\n\n`;
    prompt += `The composition should have:\n`;
    prompt += `- Visual interest at the bottom and middle,\n`;
    prompt += `- But enough clean space at the top and center for overlaying text.\n\n`;
    prompt += `Show the bird mascot ${birdMood}. `;
    prompt += `Use subtle symbolic elements representing the key idea. `;
    prompt += `No text in the image.\n\n`;
    prompt += `Flat vector, 1080x1920, soft gradient background.`;
  } else {
    // Metaphor scene template
    prompt += `Illustration of a metaphor for the concept: "${summary}", for people healing from CPTSD.\n\n`;
    prompt += `Show the bird mascot in a symbolic scene. `;
    prompt += `Focus on light, hope, and gentle progress, not pain.\n\n`;
    prompt += `The bird mascot should have: ${birdMood}\n\n`;
    prompt += `No humans, no graphic elements, no text. `;
    prompt += `Flat vector style, Instagram-friendly.`;
  }

  return prompt;
}

/**
 * Helper function to add delay between API calls to avoid rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate images for a post using OpenAI DALL-E
 */
export async function generatePostImages(options: GenerateImageOptions): Promise<GeneratedImageAsset[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Please configure OpenAI API key in .env.local');
  }

  const variants = options.variants || ['FEED', 'STORY'];
  const tone = options.tone || 'educational';
  const importance = options.importance || 'normal';
  
  // Use model selection logic based on importance, or use override
  const imageModel = pickImageModel(importance, options.model);

  const assets: GeneratedImageAsset[] = [];

  // For carousel posts, parse slides and generate one image per slide
  if (options.postType === 'CAROUSEL') {
    // Check for manual slide prompts first, then fall back to parsing script
    let slides: Array<{ slideNumber: number; imageDescription: string; text: string }> = [];
    
    if (options.manualSlidePrompts && options.manualSlidePrompts.length > 0) {
      // Use manual slide prompts
      console.log(`Using ${options.manualSlidePrompts.length} manual slide prompts...`);
      slides = options.manualSlidePrompts.map((prompt) => ({
        slideNumber: prompt.slideNumber,
        imageDescription: prompt.imageDescription,
        text: prompt.imageDescription, // Use description as text for now
      }));
    } else {
      // Parse from script
      slides = parseCarouselSlides(options.script);
    }
    
    if (slides.length > 0) {
      console.log(`Generating ${slides.length} carousel slide images...`);
      
      // Generate one image per slide (use FEED format for carousel)
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        try {
          // Add delay to avoid rate limiting (1 second between requests)
          if (i > 0) {
            await delay(1000);
          }
          
          const prompt = await createImagePrompt(
            options.script,
            options.caption,
            tone,
            options.finchImageUrl,
            slide.imageDescription,
            'FEED' // Carousel slides use feed format
          );

          let imageUrl: string;
          let revisedPrompt: string | undefined = prompt;

          // If Finch image is available and model is DALL-E 2, use edit API for image-to-image generation
          if (options.finchImageUrl && imageModel === 'dall-e-2') {
            try {
              console.log(`🎨 Using DALL-E 2 edit with Finch reference image for slide ${slide.slideNumber}...`);
              imageUrl = await generateImageWithReference([options.finchImageUrl], prompt, true);
              revisedPrompt = prompt; // Keep original prompt for metadata
            } catch (editError) {
              console.warn(`⚠️ Image edit failed for slide ${slide.slideNumber}, falling back to standard generation:`, editError);
              // Fallback to standard DALL-E 2 generation
              const genResponse = await getOpenAI().images.generate({
                model: 'dall-e-2',
                prompt: prompt,
                size: '1024x1024',
                n: 1,
              });
              imageUrl = genResponse.data?.[0]?.url || '';
              revisedPrompt = undefined; // DALL-E 2 doesn't return revised_prompt
            }
          } else {
            // Standard generation without reference image
            const genResponse = await getOpenAI().images.generate({
              model: imageModel as 'dall-e-3' | 'dall-e-2',
              prompt: prompt,
              size: '1024x1024',
              quality: imageModel === 'dall-e-3' ? 'standard' : undefined,
              style: imageModel === 'dall-e-3' ? 'natural' : undefined,
              n: 1,
            });
            imageUrl = genResponse.data?.[0]?.url || '';
            revisedPrompt = (genResponse.data?.[0] as any)?.revised_prompt;
          }

          const response = { data: [{ url: imageUrl, revised_prompt: revisedPrompt }] };

          if (response.data && response.data[0]) {
            const image = response.data[0];
            assets.push({
              kind: 'IMAGE_CAROUSEL_SLIDE',
              size: '1080x1080',
              url: image.url || '',
              thumbnailUrl: image.url,
              slideNumber: slide.slideNumber,
              metadata: {
                prompt: prompt,
                model: imageModel,
                revised_prompt: image.revised_prompt,
                importance: importance,
                slideDescription: slide.imageDescription,
                generationParams: {
                  size: '1024x1024',
                  ...(imageModel === 'dall-e-3' && { quality: 'standard', style: 'natural' }),
                },
              },
            });
          }
        } catch (error) {
          console.error(`Error generating slide ${slide.slideNumber} image:`, error);
          // Continue with other slides even if one fails
          console.warn(`Failed to generate image for slide ${slide.slideNumber}, continuing with other slides`);
        }
      }
      
      // If we generated carousel slides, return them
      if (assets.length > 0) {
        return assets;
      }
      
      // If no slides were parsed or generated, fall through to default behavior
      console.warn('No carousel slides parsed, falling back to default image generation');
    }
  }

  // Generate feed image (1080x1080, square)
  if (variants.includes('FEED')) {
    try {
      const prompt = await createImagePrompt(options.script, options.caption, tone, options.finchImageUrl, undefined, 'FEED');

      const feedResponse = await getOpenAI().images.generate({
        model: imageModel as 'dall-e-3' | 'dall-e-2',
        prompt: prompt,
        size: '1024x1024', // DALL-E 3 supports 1024x1024 (square) and 1792x1024 (landscape)
        quality: imageModel === 'dall-e-3' ? 'standard' : undefined, // Only DALL-E 3 supports quality
        style: imageModel === 'dall-e-3' ? 'natural' : undefined, // Only DALL-E 3 supports style
        n: 1,
      });

      if (feedResponse.data && feedResponse.data[0]) {
        const image = feedResponse.data[0];
        assets.push({
          kind: 'IMAGE_FEED',
          size: '1080x1080',
          url: image.url || '',
          thumbnailUrl: image.url, // Use same URL as thumbnail for now
          metadata: {
            prompt: prompt,
            model: imageModel,
            revised_prompt: image.revised_prompt,
            importance: importance,
            generationParams: {
              size: '1024x1024',
              ...(imageModel === 'dall-e-3' && { quality: 'standard', style: 'natural' }),
            },
          },
        });
      }
    } catch (error) {
      console.error('Error generating feed image:', error);
      throw new Error(
        `Failed to generate feed image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Generate story image (1080x1920, vertical/portrait)
  // Note: DALL-E 3 doesn't support 9:16 aspect ratio directly, so we'll use 1024x1792 (closest)
  // In production, you might want to use a different model or crop/resize
  if (variants.includes('STORY')) {
    try {
      const prompt = await createImagePrompt(options.script, options.caption, tone, options.finchImageUrl, undefined, 'STORY');

      // DALL-E 3 supports: 1024x1024 (square), 1792x1024 (landscape), 1024x1792 (portrait)
      // Note: 1024x1792 is closest to Instagram story format (1080x1920, 9:16)
      // In production, you might want to crop/resize the result to exact dimensions
      const storyResponse = await getOpenAI().images.generate({
        model: imageModel as 'dall-e-3' | 'dall-e-2',
        prompt: prompt,
        size: '1024x1792', // Vertical/portrait format (closest to 9:16 for stories)
        quality: imageModel === 'dall-e-3' ? 'standard' : undefined, // Only DALL-E 3 supports quality
        style: imageModel === 'dall-e-3' ? 'natural' : undefined, // Only DALL-E 3 supports style
        n: 1,
      });

      if (storyResponse.data && storyResponse.data[0]) {
        const image = storyResponse.data[0];
        assets.push({
          kind: 'IMAGE_STORY',
          size: '1080x1920',
          url: image.url || '',
          thumbnailUrl: image.url,
          metadata: {
            prompt: prompt,
            model: imageModel,
            revised_prompt: image.revised_prompt,
            importance: importance,
            generationParams: {
              size: '1024x1792',
              ...(imageModel === 'dall-e-3' && { quality: 'standard', style: 'natural' }),
            },
          },
        });
      }
    } catch (error) {
      console.error('Error generating story image:', error);
      // Don't fail completely if story generation fails, just log it
      // You might want to throw here depending on requirements
      console.warn('Story image generation failed, continuing with feed image only');
    }
  }

  // Generate reel video placeholder (for REEL post type)
  // Note: Actual video generation would require additional services (e.g., RunwayML, Pika Labs, etc.)
  // For now, we'll create a placeholder asset that can be used later
  if (variants.includes('REEL') || options.postType === 'REEL') {
    try {
      // Generate a story-sized image as a placeholder for reel video
      // In production, this could be replaced with actual video generation
      const basePrompt = await createImagePrompt(options.script, options.caption, tone, options.finchImageUrl, undefined, 'STORY');
      const prompt = basePrompt + 
        ' This is for a vertical video reel format. Create a dynamic, motion-friendly composition that would work well as a video background. Ensure the bird mascot is clearly visible and could be animated in post-production.';

      const reelResponse = await getOpenAI().images.generate({
        model: imageModel as 'dall-e-3' | 'dall-e-2',
        prompt: prompt,
        size: '1024x1792', // Vertical format for reels
        quality: imageModel === 'dall-e-3' ? 'standard' : undefined, // Only DALL-E 3 supports quality
        style: imageModel === 'dall-e-3' ? 'vivid' : undefined, // Use vivid for more dynamic look suitable for video
        n: 1,
      });

      if (reelResponse.data && reelResponse.data[0]) {
        const image = reelResponse.data[0];
        assets.push({
          kind: 'VIDEO_REEL_DRAFT', // Mark as video draft - can be used as background for video editing
          size: '1080x1920',
          url: image.url || '',
          thumbnailUrl: image.url,
          metadata: {
            prompt: prompt,
            model: imageModel,
            revised_prompt: image.revised_prompt,
            importance: importance,
            generationParams: {
              size: '1024x1792',
              ...(imageModel === 'dall-e-3' && { quality: 'standard', style: 'vivid' }),
            },
          },
        });
      }
    } catch (error) {
      console.error('Error generating reel image:', error);
      console.warn('Reel image generation failed, continuing with other assets');
    }
  }

  if (assets.length === 0) {
    throw new Error('No images were generated successfully');
  }

  return assets;
}

/**
 * Generate images for a post with controlled composition types
 * This is the new variant-based generation system
 */
export interface ImageVariant {
  compositionType: CompositionType;
  targetFormat: TargetFormat;
  importance?: ImageImportance;
  extraStyleFlags?: string[];
  actionDescription?: string; // Required for BIRD_ACTION_SCENE
}

export interface GenerateImagesForPostArgs {
  postId: string;
  script: string;
  caption: string;
  hashtags?: string;
  tone?: 'validating' | 'educational' | 'gentle' | 'hopeful' | 'grounding';
  variants: ImageVariant[];
}

export async function generateImagesForPost(args: GenerateImagesForPostArgs): Promise<GeneratedImageAsset[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Please configure OpenAI API key in .env.local');
  }

  const { postId, script, caption, hashtags, tone = 'gentle', variants } = args;

  if (variants.length === 0) {
    throw new Error('At least one variant must be specified');
  }

  // Extract summary from caption or script
  const summary = extractPostSummary(script, caption);

  const assets: GeneratedImageAsset[] = [];

  // Generate each variant
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    
    // Add delay between requests to avoid rate limiting
    if (i > 0) {
      await delay(1000);
    }

    // Determine model based on importance
    const importance = variant.importance || 'normal';
    const imageModel = pickImageModel(importance);

    // Build prompt using the prompt builder
    const promptOptions: ImagePromptOptions = {
      compositionType: variant.compositionType,
      targetFormat: variant.targetFormat,
      summary,
      tone,
      actionDescription: variant.actionDescription,
      extraStyleFlags: variant.extraStyleFlags,
    };

    const prompt = buildImagePrompt(promptOptions);

    try {

      // Determine size based on target format and model
      // DALL-E 2 only supports: 256x256, 512x512, 1024x1024
      // DALL-E 3 supports: 1024x1024, 1792x1024 (landscape), 1024x1792 (portrait)
      let size: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
      const sizeLabel = variant.targetFormat === 'FEED_SQUARE' ? '1080x1080' : '1080x1920';
      const kind = variant.targetFormat === 'FEED_SQUARE' ? 'IMAGE_FEED' : 'IMAGE_STORY';

      if (imageModel === 'dall-e-3') {
        // DALL-E 3 supports vertical format
        size = variant.targetFormat === 'FEED_SQUARE' ? '1024x1024' : '1024x1792';
      } else {
        // DALL-E 2 only supports square formats, use 1024x1024 for both
        // The prompt will still indicate vertical composition intent
        size = '1024x1024';
      }

      // Generate image
      const response = await getOpenAI().images.generate({
        model: imageModel,
        prompt: prompt,
        size: size,
        quality: imageModel === 'dall-e-3' ? 'standard' : undefined,
        style: imageModel === 'dall-e-3' ? 'natural' : undefined,
        n: 1,
      });

      if (response.data && response.data[0]) {
        const image = response.data[0];
        assets.push({
          kind: kind as 'IMAGE_FEED' | 'IMAGE_STORY',
          size: sizeLabel, // Target size label (for display)
          url: image.url || '',
          thumbnailUrl: image.url,
          compositionType: variant.compositionType,
          metadata: {
            prompt: prompt,
            promptUsed: prompt, // Store for consistency
            model: imageModel,
            revised_prompt: image.revised_prompt,
            importance: importance,
            actionDescription: variant.actionDescription,
            extraStyleFlags: variant.extraStyleFlags,
            generationParams: {
              size: size, // Actual generated size (may differ from target for DALL-E 2)
              ...(imageModel === 'dall-e-3' && { quality: 'standard', style: 'natural' }),
            },
          },
        });
      }
    } catch (error) {
      console.error(`Error generating variant ${variant.compositionType} (${variant.targetFormat}):`, error);
      
      // Log the prompt if it was a safety/content policy violation
      if (error instanceof Error && (error.message.includes('safety') || error.message.includes('content_policy'))) {
        console.warn(`⚠️ Prompt rejected by safety system. Prompt was: ${prompt.substring(0, 200)}...`);
        console.warn(`Full prompt length: ${prompt.length} characters`);
      }
      
      // Continue with other variants even if one fails
      console.warn(`Failed to generate image for variant ${variant.compositionType}, continuing with other variants`);
    }
  }

  if (assets.length === 0) {
    throw new Error('No images were generated successfully');
  }

  return assets;
}

