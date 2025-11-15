import OpenAI from 'openai';
import { getTokenLimitParams } from './openaiHelpers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Download an image from URL and convert to File object for OpenAI API
 * In Node.js, we need to create a File from a Blob
 */
async function downloadImageAsFile(imageUrl: string): Promise<File> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image from ${imageUrl}: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Determine file extension from URL or content type
  const contentType = response.headers.get('content-type') || 'image/png';
  const extension = contentType.includes('png') ? 'png' : contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
  
  // Create a File-like object for OpenAI SDK
  // OpenAI SDK accepts File objects - in Node.js 18+, we can use global File
  // For compatibility, we'll create it from the buffer
  const blob = new Blob([buffer], { type: contentType });
  const file = new File([blob], `image.${extension}`, { type: contentType });
  
  return file;
}

/**
 * Generate image using DALL-E 2 edit or variation when input images are provided
 * Falls back to DALL-E 3 generation if edit/variation is not available
 */
export async function generateImageWithReference(
  imageUrls: string[],
  userPrompt: string,
  useEdit: boolean = true
): Promise<string> {
  if (!imageUrls || imageUrls.length === 0) {
    throw new Error('No reference images provided for image-to-image generation');
  }

  try {
    // Use the first image as the reference
    const referenceImageUrl = imageUrls[0];
    console.log(`📸 Using reference image: ${referenceImageUrl}`);
    console.log(`📝 Edit prompt: ${userPrompt}`);

    // Download the image and convert to File
    const imageFile = await downloadImageAsFile(referenceImageUrl);

    let imageUrl: string;

    if (useEdit) {
      // Use DALL-E 2 edit API to modify the image based on prompt
      console.log('🎨 Using DALL-E 2 image edit API...');
      const response = await openai.images.edit({
        image: imageFile,
        prompt: userPrompt,
        n: 1,
        size: '1024x1024',
      });

      if (response.data && response.data[0]?.url) {
        imageUrl = response.data[0].url;
        console.log(`✅ Generated edited image: ${imageUrl}`);
      } else {
        throw new Error('No image URL returned from edit API');
      }
    } else {
      // Use DALL-E 2 variations API to create variations of the image
      console.log('🔄 Using DALL-E 2 image variations API...');
      const response = await openai.images.createVariation({
        image: imageFile,
        n: 1,
        size: '1024x1024',
      });

      if (response.data && response.data[0]?.url) {
        imageUrl = response.data[0].url;
        console.log(`✅ Generated image variation: ${imageUrl}`);
      } else {
        throw new Error('No image URL returned from variations API');
      }
    }

    return imageUrl;
  } catch (error) {
    console.error('❌ Error generating image with reference:', error);
    throw error;
  }
}

/**
 * Analyze images using GPT-4o Vision and create detailed descriptions
 * This is used as a fallback when image edit/variations are not suitable
 */
export async function analyzeImagesForPrompt(
  imageUrls: string[],
  userPrompt: string,
  context?: string
): Promise<string> {
  if (!imageUrls || imageUrls.length === 0) {
    return userPrompt;
  }

  try {
    // Build content array with text and images
    const content: Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    > = [
      {
        type: 'text',
        text: `Analyze the provided image(s) and create a detailed, descriptive prompt for image generation.

${context ? `Context: ${context}\n\n` : ''}
User's request: ${userPrompt}

Please:
1. Describe what you see in the image(s) in detail (characters, style, colors, composition, mood, etc.)
2. Identify key visual elements, art style, and important details
3. If there are characters or specific objects, describe them precisely
4. Note the color palette, lighting, and overall aesthetic
5. Create an enhanced prompt that incorporates both the image analysis and the user's request

The enhanced prompt should be suitable for DALL-E 3 image generation and should maintain the visual style and key elements from the input image(s) while incorporating the user's request.`,
      },
    ];

    // Add all images
    imageUrls.forEach((url) => {
      content.push({
        type: 'image_url',
        image_url: { url },
      });
    });

    // Use GPT-4o (multimodal) to analyze images
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4o supports vision
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at analyzing images and creating detailed prompts for image generation. Focus on visual details, style, composition, and key elements.',
        },
        {
          role: 'user',
          content: content as any,
        },
      ],
      temperature: 0.7,
      ...getTokenLimitParams('gpt-4o', 1000),
    });

    const enhancedPrompt =
      response.choices[0]?.message?.content || userPrompt;

    console.log(`✅ Analyzed ${imageUrls.length} image(s) and created enhanced prompt`);
    console.log(`📝 Original prompt: ${userPrompt.substring(0, 100)}...`);
    console.log(`📝 Enhanced prompt: ${enhancedPrompt.substring(0, 100)}...`);

    return enhancedPrompt;
  } catch (error) {
    console.error('❌ Error analyzing images with GPT-4o:', error);
    // Fallback to original prompt if analysis fails
    console.warn('⚠️ Falling back to original prompt without image analysis');
    return userPrompt;
  }
}

