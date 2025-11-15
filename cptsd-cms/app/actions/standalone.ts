'use server';

import OpenAI from 'openai';
import connectDB from '@/lib/mongodb';
import StandaloneGeneration from '@/models/StandaloneGeneration';
import { uploadToS3, deleteFromS3 } from '@/lib/s3';
import { getS3Config } from '@/lib/config';
import { revalidatePath } from 'next/cache';
import { analyzeImagesForPrompt, generateImageWithReference } from '@/lib/imageAnalysis';
import { getTokenLimitParams } from '@/lib/openaiHelpers';

const s3Config = getS3Config();

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

export async function generateStandaloneContent(formData: FormData) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OPENAI_API_KEY is not set. Please configure OpenAI API key in .env.local',
      };
    }

    const prompt = formData.get('prompt') as string;
    const systemPrompt = (formData.get('systemPrompt') as string) || 'You are a helpful AI assistant.';
    const model = (formData.get('model') as string) || 'gpt-4o';
    const contentType = (formData.get('contentType') as string) || 'text';
    const attachmentsJson = formData.get('attachments') as string;

    let attachments: Array<{ type: string; url: string }> = [];
    if (attachmentsJson) {
      try {
        attachments = JSON.parse(attachmentsJson);
      } catch (e) {
        console.error('Error parsing attachments:', e);
      }
    }

    if (!prompt) {
      return {
        success: false,
        error: 'Prompt is required',
      };
    }

    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
    }> = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Build user message with text and images
    if (contentType === 'image' || contentType === 'both') {
      // For image generation, use DALL-E
      if (contentType === 'image' || (contentType === 'both' && attachments.some((a) => a.type === 'image'))) {
        const imageUrls = attachments.filter((a) => a.type === 'image').map((a) => a.url);

        const userContent: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [
          {
            type: 'text',
            text: prompt,
          },
        ];

        // Add image URLs from attachments
        imageUrls.forEach((url) => {
          userContent.push({
            type: 'image_url',
            image_url: { url },
          });
        });

        messages.push({
          role: 'user',
          content: userContent,
        });
      } else {
        messages.push({
          role: 'user',
          content: prompt,
        });
      }
    } else {
      messages.push({
        role: 'user',
        content: prompt,
      });
    }

    let generatedContent = '';
    let generatedImages: string[] = [];

    // Generate text content
    if (contentType === 'text' || contentType === 'both') {
      const response = await getOpenAI().chat.completions.create({
        model: model,
        messages: messages as any,
        temperature: 0.7,
        ...getTokenLimitParams(model, 2000),
      });

      generatedContent = response.choices[0]?.message?.content || '';
    }

    // Generate images if requested
    // Note: DALL-E 3 only supports n=1 (one image at a time)
    const originalImageUrls: string[] = [];
    if (contentType === 'image' || contentType === 'both') {
      try {
        // Get image URLs from attachments if available
        const imageUrls = attachments.filter((a) => a.type === 'image').map((a) => a.url);
        
        if (imageUrls.length > 0) {
          // Use DALL-E 2 image edit API when reference images are provided
          console.log(`🎨 Generating image using reference image(s) with DALL-E 2 edit API...`);
          try {
            const editedImageUrl = await generateImageWithReference(
              imageUrls,
              prompt,
              true // useEdit = true
            );
            originalImageUrls.push(editedImageUrl);
          } catch (editError) {
            console.warn('⚠️ Image edit failed, falling back to variations or enhanced prompt:', editError);
            
            // Try variations as fallback
            try {
              const variationImageUrl = await generateImageWithReference(
                imageUrls,
                prompt,
                false // useEdit = false (use variations)
              );
              originalImageUrls.push(variationImageUrl);
            } catch (variationError) {
              console.warn('⚠️ Image variations failed, falling back to GPT-4o Vision + DALL-E 3:', variationError);
              
              // Final fallback: Use GPT-4o Vision to analyze and enhance prompt, then DALL-E 3
              const enhancedPrompt = await analyzeImagesForPrompt(
                imageUrls,
                prompt,
                contentType === 'both' ? generatedContent : undefined
              );
              
              const imageResponse = await getOpenAI().images.generate({
                model: 'dall-e-3',
                prompt: enhancedPrompt,
                size: '1024x1024',
                quality: 'standard',
                style: 'natural',
                n: 1,
              });
              
              if (imageResponse.data) {
                imageResponse.data.forEach((image) => {
                  if (image.url) {
                    originalImageUrls.push(image.url);
                  }
                });
              }
            }
          }
        } else {
          // No reference images - use DALL-E 3 directly
          const imageResponse = await getOpenAI().images.generate({
            model: 'dall-e-3',
            prompt: prompt,
            size: '1024x1024',
            quality: 'standard',
            style: 'natural',
            n: 1,
          });

          if (imageResponse.data) {
            imageResponse.data.forEach((image) => {
              if (image.url) {
                originalImageUrls.push(image.url);
              }
            });
          }
        }
      } catch (imageError) {
        console.error('Error generating images:', imageError);
        // Don't fail completely if image generation fails
      }
    }

    // Download and store images in S3 to avoid expiration
    const storedImageUrls: string[] = [];
    generatedImages = []; // Initialize array for return value
    for (const imageUrl of originalImageUrls) {
      try {
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const fileName = `standalone-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
          const s3Url = await uploadToS3(imageBuffer, fileName, 'standalone-generations');
          storedImageUrls.push(s3Url);
          generatedImages.push(s3Url);
          console.log(`✅ Downloaded and stored standalone image: ${s3Url}`);
        } else {
          console.warn(`⚠️ Failed to download image from ${imageUrl}, using OpenAI URL`);
          storedImageUrls.push(imageUrl);
          generatedImages.push(imageUrl);
        }
      } catch (error) {
        console.error(`❌ Error downloading/storing image:`, error);
        // Fallback to OpenAI URL if download/storage fails
        storedImageUrls.push(imageUrl);
        generatedImages.push(imageUrl);
      }
    }

    // Save generation to database
    let savedGeneration: any = null;
    try {
      await connectDB();
      const generation = await StandaloneGeneration.create({
        prompt,
        systemPrompt: systemPrompt || undefined,
        openaiModel: model,
        contentType: contentType as 'text' | 'image' | 'both',
        generatedText: generatedContent || undefined,
        generatedImages: storedImageUrls,
        attachments: attachments.length > 0 ? attachments : undefined,
        metadata: {
          originalImageUrls: originalImageUrls.length > 0 ? originalImageUrls : undefined,
          generationParams: {
            size: '1024x1024',
            quality: 'standard',
            style: 'natural',
          },
        },
      });

      // Convert to plain object to avoid circular references
      const generationDoc = generation as any;
      savedGeneration = {
        id: generationDoc._id.toString(),
        _id: generationDoc._id.toString(),
        prompt: String(generationDoc.prompt || ''),
        systemPrompt: generationDoc.systemPrompt ? String(generationDoc.systemPrompt) : null,
        model: String(generationDoc.openaiModel || ''),
        contentType: String(generationDoc.contentType || ''),
        generatedText: generationDoc.generatedText ? String(generationDoc.generatedText) : null,
        generatedImages: Array.isArray(generationDoc.generatedImages) 
          ? generationDoc.generatedImages.map((url: any) => String(url))
          : [],
        attachments: Array.isArray(generationDoc.attachments)
          ? generationDoc.attachments.map((att: any) => ({
              type: String(att.type || ''),
              url: String(att.url || ''),
            }))
          : null,
        createdAt: generationDoc.createdAt instanceof Date 
          ? generationDoc.createdAt.toISOString() 
          : new Date(generationDoc.createdAt).toISOString(),
        updatedAt: generationDoc.updatedAt instanceof Date 
          ? generationDoc.updatedAt.toISOString() 
          : new Date(generationDoc.updatedAt).toISOString(),
      };
    } catch (saveError) {
      console.error('Error saving standalone generation:', saveError);
      // Don't fail the generation if save fails
    }

    return {
      success: true,
      content: generatedContent,
      images: generatedImages,
      savedGeneration,
    };
  } catch (error) {
    console.error('Error generating standalone content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate content',
    };
  }
}

/**
 * Get all standalone generations
 */
export async function getStandaloneGenerations() {
  try {
    await connectDB();

    const generations = await StandaloneGeneration.find()
      .sort({ createdAt: -1 })
      .lean()
      .limit(50); // Limit to last 50 generations

    // Transform to plain objects
    const transformedGenerations = generations.map((generation: any) => ({
      id: generation._id.toString(),
      _id: generation._id.toString(),
      prompt: generation.prompt || '',
      systemPrompt: generation.systemPrompt || null,
      model: generation.openaiModel || '',
      contentType: generation.contentType || 'text',
      generatedText: generation.generatedText || null,
      generatedImages: Array.isArray(generation.generatedImages)
        ? generation.generatedImages.map((url: any) => String(url))
        : [],
      attachments: Array.isArray(generation.attachments)
        ? generation.attachments.map((att: any) => ({
            type: String(att.type || ''),
            url: String(att.url || ''),
          }))
        : [],
      metadata: generation.metadata || null,
      createdAt: generation.createdAt instanceof Date 
        ? generation.createdAt.toISOString() 
        : new Date(generation.createdAt).toISOString(),
      updatedAt: generation.updatedAt instanceof Date 
        ? generation.updatedAt.toISOString() 
        : new Date(generation.updatedAt).toISOString(),
    }));

    return {
      success: true,
      generations: transformedGenerations,
    };
  } catch (error) {
    console.error('Error fetching standalone generations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch generations',
      generations: [],
    };
  }
}

/**
 * Delete a standalone generation and its images
 */
export async function deleteStandaloneGeneration(generationId: string) {
  try {
    await connectDB();

    const generation = await StandaloneGeneration.findById(generationId).lean();

    if (!generation) {
      return { success: false, error: 'Generation not found' };
    }

    // Delete images from S3 if they exist
    const generationDoc = generation as any;
    if (generationDoc.generatedImages && Array.isArray(generationDoc.generatedImages)) {
      for (const imageUrl of generationDoc.generatedImages) {
        // Only delete if it's an S3 URL (not OpenAI URL)
        if (imageUrl && typeof imageUrl === 'string') {
          const isS3Url = imageUrl.includes(s3Config.endpoint || '') || 
                         imageUrl.includes('.s3.') ||
                         imageUrl.includes('standalone-generations');
          if (isS3Url) {
            try {
              await deleteFromS3(imageUrl);
            } catch (error) {
              console.error(`Error deleting image ${imageUrl}:`, error);
              // Continue even if image deletion fails
            }
          }
        }
      }
    }

    // Delete the generation record
    await StandaloneGeneration.findByIdAndDelete(generationId);

    revalidatePath('/generate');
    revalidatePath('/gallery');

    return { success: true };
  } catch (error) {
    console.error('Error deleting standalone generation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete generation',
    };
  }
}

