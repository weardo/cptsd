'use server';

import connectDB from '@/lib/mongodb';
import GeneratedAsset, { AssetKind, CompositionType } from '@cptsd/db/models/GeneratedAsset';
import Post from '@cptsd/db/models/Post';
import Topic from '@cptsd/db/models/Topic';
import { generatePostImages, GenerateImageOptions, generateImagesForPost, ImageVariant } from '@/lib/imageGeneration';
import { uploadToS3 } from '@/lib/s3';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { TargetFormat } from '@/lib/imagePromptBuilder';
import JSZip from 'jszip';

/**
 * Generate visual assets for a post
 */
export async function generatePostAssets(
  postId: string,
  variants: Array<'FEED' | 'STORY' | 'REEL'> = ['FEED', 'STORY'],
  model?: string,
  importance: 'test' | 'normal' | 'hero' = 'normal'
) {
  try {
    await connectDB();

    const post = await Post.findById(postId).populate('topicId').lean();

    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    const postDoc = post as any;
    const topic = postDoc.topicId;

    if (!post.script || !post.caption) {
      return {
        success: false,
        error: 'Post must have generated script and caption before generating visuals. Please generate content first.',
      };
    }

    // Determine tone from post (we'll need to infer or default)
    // Since Post model doesn't have a tone field, we'll default to 'educational'
    // In the future, you might want to add a tone field to Post model
    const tone: 'educational' | 'validating' | 'gentle-cta' = 'educational';

    // Determine variants based on post type
    let finalVariants = variants;
    if (post.postType === 'REEL' && !variants.includes('REEL')) {
      finalVariants = [...variants, 'REEL'];
    }

    // Generate images using OpenAI
    const generatedImages = await generatePostImages({
      postId,
      script: post.script,
      caption: post.caption,
      hashtags: post.hashtags || undefined,
      finchImageUrl: post.finchScreenshotUrl || undefined,
      tone,
      postType: post.postType as any,
      variants: finalVariants,
      manualSlidePrompts: postDoc.manualSlidePrompts || undefined, // Include manual slide prompts if available
      model, // Pass model parameter
      importance, // Pass importance for model selection
    });

    // Download images from OpenAI and upload to S3 to avoid expiration issues
    const savedAssets = await Promise.all(
      generatedImages.map(async (imageAsset) => {
        let storedUrl = imageAsset.url;
        let storedThumbnailUrl = imageAsset.thumbnailUrl;
        
        try {
          // Download image from OpenAI URL (which expires after ~2 hours)
          const imageResponse = await fetch(imageAsset.url);
          if (imageResponse.ok) {
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
            
            // Generate filename based on post ID and asset kind
            const fileName = `generated-${postId}-${imageAsset.kind.toLowerCase()}-${imageAsset.slideNumber || 'main'}.png`;
            
            // Upload to S3
            storedUrl = await uploadToS3(imageBuffer, fileName, 'generated-images');
            
            // If there's a thumbnail, use the same URL (or could generate a thumbnail separately)
            storedThumbnailUrl = storedUrl;
            
            console.log(`✅ Downloaded and stored image: ${storedUrl}`);
          } else {
            console.warn(`⚠️ Failed to download image from ${imageAsset.url}, using OpenAI URL`);
          }
        } catch (error) {
          console.error(`❌ Error downloading/storing image:`, error);
          // Fallback to OpenAI URL if download/storage fails
          // The URL will eventually expire, but at least the image will work for now
        }
        
        const asset = await GeneratedAsset.create({
          postId: new mongoose.Types.ObjectId(postId),
          kind: imageAsset.kind as AssetKind, // This now includes VIDEO_REEL_DRAFT and IMAGE_CAROUSEL_SLIDE
          size: imageAsset.size,
          url: storedUrl, // S3 URL (or OpenAI URL as fallback)
          thumbnailUrl: storedThumbnailUrl,
          slideNumber: imageAsset.slideNumber, // For carousel slides
          metadata: {
            ...imageAsset.metadata,
            slideDescription: imageAsset.metadata?.slideDescription,
            originalOpenAiUrl: imageAsset.url, // Store original URL in metadata for reference
          },
        });

        // Type assertion for Mongoose document
        const assetDoc = asset as any;

        return {
          id: assetDoc._id.toString(),
          _id: assetDoc._id.toString(),
          postId: assetDoc.postId.toString(),
          kind: assetDoc.kind,
          size: assetDoc.size,
          url: assetDoc.url,
          thumbnailUrl: assetDoc.thumbnailUrl,
          metadata: assetDoc.metadata,
          createdAt: assetDoc.createdAt instanceof Date 
            ? assetDoc.createdAt.toISOString() 
            : new Date(assetDoc.createdAt).toISOString(),
          updatedAt: assetDoc.updatedAt instanceof Date 
            ? assetDoc.updatedAt.toISOString() 
            : new Date(assetDoc.updatedAt).toISOString(),
        };
      })
    );

    revalidatePath('/posts');
    revalidatePath(`/posts/${postId}`);
    revalidatePath('/');

    return {
      success: true,
      assets: savedAssets,
    };
  } catch (error) {
    console.error('Error generating post assets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate assets',
    };
  }
}

/**
 * Get all generated assets for a post
 */
export async function getPostAssets(postId: string) {
  try {
    await connectDB();

    // Sort by slideNumber for carousel slides, otherwise by creation date
    const assets = await GeneratedAsset.find({ postId: new mongoose.Types.ObjectId(postId) })
      .sort({ slideNumber: 1, createdAt: -1 })
      .lean();

    return {
      success: true,
      assets: assets.map((asset: any) => {
        // Ensure metadata is a plain object
        let plainMetadata: any = null;
        if (asset.metadata) {
          plainMetadata = {
            ...(asset.metadata.prompt && { prompt: String(asset.metadata.prompt) }),
            ...(asset.metadata.model && { model: String(asset.metadata.model) }),
            ...(asset.metadata.revised_prompt && { revised_prompt: String(asset.metadata.revised_prompt) }),
            ...(asset.metadata.importance && { importance: String(asset.metadata.importance) }),
            ...(asset.metadata.actionDescription && { actionDescription: String(asset.metadata.actionDescription) }),
            ...(asset.metadata.extraStyleFlags && { extraStyleFlags: asset.metadata.extraStyleFlags }),
            ...(asset.metadata.slideDescription && { slideDescription: String(asset.metadata.slideDescription) }),
            ...(asset.metadata.generationParams && {
              generationParams: asset.metadata.generationParams ? {
                ...(asset.metadata.generationParams.size && { size: String(asset.metadata.generationParams.size) }),
                ...(asset.metadata.generationParams.quality && { quality: String(asset.metadata.generationParams.quality) }),
                ...(asset.metadata.generationParams.style && { style: String(asset.metadata.generationParams.style) }),
              } : null,
            }),
          };
        }

        return {
          id: asset._id.toString(),
          _id: asset._id.toString(),
          postId: asset.postId.toString(),
          kind: asset.kind,
          size: asset.size,
          url: asset.url,
          thumbnailUrl: asset.thumbnailUrl || null,
          slideNumber: asset.slideNumber || null,
          compositionType: asset.compositionType || null,
          metadata: plainMetadata,
          createdAt: asset.createdAt instanceof Date 
            ? asset.createdAt.toISOString() 
            : typeof asset.createdAt === 'string' 
              ? asset.createdAt 
              : new Date(asset.createdAt).toISOString(),
          updatedAt: asset.updatedAt instanceof Date 
            ? asset.updatedAt.toISOString() 
            : typeof asset.updatedAt === 'string' 
              ? asset.updatedAt 
              : new Date(asset.updatedAt).toISOString(),
        };
      }),
    };
  } catch (error) {
    console.error('Error fetching post assets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch assets',
      assets: [],
    };
  }
}

/**
 * Delete a generated asset
 */
export async function deleteAsset(assetId: string) {
  try {
    await connectDB();

    const asset = await GeneratedAsset.findById(assetId).lean();

    if (!asset) {
      return { success: false, error: 'Asset not found' };
    }

    await GeneratedAsset.findByIdAndDelete(assetId);

    revalidatePath('/posts');
    revalidatePath(`/posts/${asset.postId}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting asset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete asset',
    };
  }
}

/**
 * Download all assets for a post as ZIP
 */
export async function downloadAssetsAsZip(postId: string) {
  try {
    await connectDB();

    const assets = await GeneratedAsset.find({ postId: new mongoose.Types.ObjectId(postId) }).lean();

    if (assets.length === 0) {
      return { success: false, error: 'No assets found for this post' };
    }

    // Return asset URLs with filenames for client-side ZIP creation
    // The client will download and zip these files
    const assetData = assets.map((a: any) => ({
      url: a.url,
      filename: `${a.kind}_${a.size}_${a._id.toString().slice(-8)}.png`,
      kind: a.kind,
      size: a.size,
    }));
    
    return {
      success: true,
      assets: assetData,
    };
  } catch (error) {
    console.error('Error preparing ZIP download:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare ZIP download',
    };
  }
}

/**
 * Generate images with controlled composition types
 * This is the new variant-based generation system
 */
export async function generatePostAssetsWithVariants(
  postId: string,
  variants: ImageVariant[],
  tone?: 'validating' | 'educational' | 'gentle' | 'hopeful' | 'grounding'
) {
  try {
    await connectDB();

    const post = await Post.findById(postId).populate('topicId').lean();

    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    if (!post.script || !post.caption) {
      return {
        success: false,
        error: 'Post must have generated script and caption before generating visuals. Please generate content first.',
      };
    }

    // Generate images using the new variant system
    const generatedImages = await generateImagesForPost({
      postId,
      script: post.script,
      caption: post.caption,
      hashtags: post.hashtags || undefined,
      tone: tone || 'gentle',
      variants,
    });

    // Download images from OpenAI and upload to S3 to avoid expiration issues
    const savedAssets = await Promise.all(
      generatedImages.map(async (imageAsset) => {
        let storedUrl = imageAsset.url;
        let storedThumbnailUrl = imageAsset.thumbnailUrl;

        try {
          // Download image from OpenAI URL (which expires after ~2 hours)
          const imageResponse = await fetch(imageAsset.url);
          if (imageResponse.ok) {
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

            // Generate filename based on post ID, composition type, and format
            const compositionLabel = imageAsset.compositionType?.toLowerCase().replace(/_/g, '-') || 'image';
            const formatLabel = imageAsset.kind === 'IMAGE_FEED' ? 'feed' : 'story';
            const fileName = `generated-${postId}-${compositionLabel}-${formatLabel}.png`;

            // Upload to S3
            storedUrl = await uploadToS3(imageBuffer, fileName, 'generated-images');

            // If there's a thumbnail, use the same URL (or could generate a thumbnail separately)
            storedThumbnailUrl = storedUrl;

            console.log(`✅ Downloaded and stored image: ${storedUrl}`);
          } else {
            console.warn(`⚠️ Failed to download image from ${imageAsset.url}, using OpenAI URL`);
          }
        } catch (error) {
          console.error(`❌ Error downloading/storing image:`, error);
          // Fallback to OpenAI URL if download/storage fails
        }

        const asset = await GeneratedAsset.create({
          postId: new mongoose.Types.ObjectId(postId),
          kind: imageAsset.kind as AssetKind,
          size: imageAsset.size,
          url: storedUrl, // S3 URL (or OpenAI URL as fallback)
          thumbnailUrl: storedThumbnailUrl,
          compositionType: imageAsset.compositionType,
          metadata: {
            ...imageAsset.metadata,
            promptUsed: imageAsset.metadata.promptUsed || imageAsset.metadata.prompt,
            originalOpenAiUrl: imageAsset.url, // Store original URL in metadata for reference
          },
        });

        // Convert Mongoose document to plain object to avoid Client Component issues
        const assetDoc = asset.toObject ? asset.toObject() : JSON.parse(JSON.stringify(asset));

        // Ensure metadata is a plain object
        let plainMetadata: any = null;
        if (assetDoc.metadata) {
          plainMetadata = {
            ...(assetDoc.metadata.prompt && { prompt: String(assetDoc.metadata.prompt) }),
            ...(assetDoc.metadata.promptUsed && { promptUsed: String(assetDoc.metadata.promptUsed) }),
            ...(assetDoc.metadata.model && { model: String(assetDoc.metadata.model) }),
            ...(assetDoc.metadata.revised_prompt && { revised_prompt: String(assetDoc.metadata.revised_prompt) }),
            ...(assetDoc.metadata.importance && { importance: String(assetDoc.metadata.importance) }),
            ...(assetDoc.metadata.actionDescription && { actionDescription: String(assetDoc.metadata.actionDescription) }),
            ...(assetDoc.metadata.extraStyleFlags && { extraStyleFlags: Array.isArray(assetDoc.metadata.extraStyleFlags) ? assetDoc.metadata.extraStyleFlags.map(String) : [] }),
            ...(assetDoc.metadata.slideDescription && { slideDescription: String(assetDoc.metadata.slideDescription) }),
            ...(assetDoc.metadata.generationParams && {
              generationParams: assetDoc.metadata.generationParams ? {
                ...(assetDoc.metadata.generationParams.size && { size: String(assetDoc.metadata.generationParams.size) }),
                ...(assetDoc.metadata.generationParams.quality && { quality: String(assetDoc.metadata.generationParams.quality) }),
                ...(assetDoc.metadata.generationParams.style && { style: String(assetDoc.metadata.generationParams.style) }),
              } : null,
            }),
          };
        }

        return {
          id: assetDoc._id.toString(),
          _id: assetDoc._id.toString(),
          postId: assetDoc.postId.toString(),
          kind: assetDoc.kind,
          size: assetDoc.size,
          url: assetDoc.url,
          thumbnailUrl: assetDoc.thumbnailUrl || null,
          compositionType: assetDoc.compositionType || null,
          metadata: plainMetadata,
          createdAt: assetDoc.createdAt instanceof Date
            ? assetDoc.createdAt.toISOString()
            : typeof assetDoc.createdAt === 'string'
              ? assetDoc.createdAt
              : new Date(assetDoc.createdAt).toISOString(),
          updatedAt: assetDoc.updatedAt instanceof Date
            ? assetDoc.updatedAt.toISOString()
            : typeof assetDoc.updatedAt === 'string'
              ? assetDoc.updatedAt
              : new Date(assetDoc.updatedAt).toISOString(),
        };
      })
    );

    revalidatePath('/posts');
    revalidatePath(`/posts/${postId}`);
    revalidatePath('/');

    return {
      success: true,
      assets: savedAssets,
    };
  } catch (error) {
    console.error('Error generating post assets with variants:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate assets',
    };
  }
}

/**
 * Upload externally generated images and attach them to a post
 * Supports multiple image files or a ZIP file containing images
 */
export async function uploadExternalImages(
  postId: string,
  formData: FormData
) {
  try {
    await connectDB();

    const post = await Post.findById(postId).lean();
    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    const files = formData.getAll('files') as File[];
    const zipFile = formData.get('zipFile') as File | null;

    const imagesToProcess: Array<{ buffer: Buffer; fileName: string }> = [];

    // Handle ZIP file
    if (zipFile && (zipFile.type === 'application/zip' || zipFile.name?.endsWith('.zip'))) {
      try {
        const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
        const zip = await JSZip.loadAsync(zipBuffer);

        // Extract all image files from ZIP
        for (const [fileName, file] of Object.entries(zip.files)) {
          if (!file.dir && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
            const fileData = await file.async('nodebuffer');
            imagesToProcess.push({
              buffer: Buffer.from(fileData),
              fileName: fileName.split('/').pop() || fileName,
            });
          }
        }
      } catch (zipError) {
        console.error('Error extracting ZIP:', zipError);
        return {
          success: false,
          error: 'Failed to extract ZIP file. Please ensure it contains valid image files.',
        };
      }
    }

    // Handle individual image files
    for (const file of files) {
      if (file && file.size > 0) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.type)) {
          const arrayBuffer = await file.arrayBuffer();
          imagesToProcess.push({
            buffer: Buffer.from(arrayBuffer),
            fileName: file.name,
          });
        }
      }
    }

    if (imagesToProcess.length === 0) {
      return {
        success: false,
        error: 'No valid images found. Please upload image files or a ZIP file containing images.',
      };
    }

    // Upload each image to S3 and create GeneratedAsset records
    const savedAssets = await Promise.all(
      imagesToProcess.map(async (image, index) => {
        try {
          // Determine image kind based on filename or default to FEED
          let kind: AssetKind = AssetKind.IMAGE_FEED;
          let size = '1080x1080';
          
          // Try to infer from filename
          const fileNameLower = image.fileName.toLowerCase();
          if (fileNameLower.includes('story') || fileNameLower.includes('vertical') || fileNameLower.includes('1920')) {
            kind = AssetKind.IMAGE_STORY;
            size = '1080x1920';
          } else if (fileNameLower.includes('feed') || fileNameLower.includes('square') || fileNameLower.includes('1080')) {
            kind = AssetKind.IMAGE_FEED;
            size = '1080x1080';
          }

          // Upload to S3
          const fileName = `external-${postId}-${Date.now()}-${index}-${image.fileName}`;
          const url = await uploadToS3(image.buffer, fileName, 'generated-images');

          // Create GeneratedAsset record
          const asset = await GeneratedAsset.create({
            postId: new mongoose.Types.ObjectId(postId),
            kind,
            size,
            url,
            thumbnailUrl: url,
            metadata: {
              prompt: 'Externally generated image',
              model: 'external',
              importance: 'normal',
            },
          });

          // Convert to plain object
          const assetDoc = asset.toObject ? asset.toObject() : JSON.parse(JSON.stringify(asset));

          // Ensure metadata is a plain object
          let plainMetadata: any = null;
          if (assetDoc.metadata) {
            plainMetadata = {
              ...(assetDoc.metadata.prompt && { prompt: String(assetDoc.metadata.prompt) }),
              ...(assetDoc.metadata.model && { model: String(assetDoc.metadata.model) }),
              ...(assetDoc.metadata.importance && { importance: String(assetDoc.metadata.importance) }),
            };
          }

          return {
            id: assetDoc._id.toString(),
            _id: assetDoc._id.toString(),
            postId: assetDoc.postId.toString(),
            kind: assetDoc.kind,
            size: assetDoc.size,
            url: assetDoc.url,
            thumbnailUrl: assetDoc.thumbnailUrl || null,
            compositionType: assetDoc.compositionType || null,
            metadata: plainMetadata,
            createdAt: assetDoc.createdAt instanceof Date
              ? assetDoc.createdAt.toISOString()
              : typeof assetDoc.createdAt === 'string'
                ? assetDoc.createdAt
                : new Date(assetDoc.createdAt).toISOString(),
            updatedAt: assetDoc.updatedAt instanceof Date
              ? assetDoc.updatedAt.toISOString()
              : typeof assetDoc.updatedAt === 'string'
                ? assetDoc.updatedAt
                : new Date(assetDoc.updatedAt).toISOString(),
          };
        } catch (error) {
          console.error(`Error processing image ${image.fileName}:`, error);
          return null;
        }
      })
    );

    // Filter out failed uploads
    const validAssets = savedAssets.filter((asset) => asset !== null);

    if (validAssets.length === 0) {
      return {
        success: false,
        error: 'Failed to upload images. Please try again.',
      };
    }

    revalidatePath('/posts');
    revalidatePath(`/posts/${postId}`);
    revalidatePath('/');

    return {
      success: true,
      assets: validAssets,
      message: `Successfully uploaded ${validAssets.length} image(s)`,
    };
  } catch (error) {
    console.error('Error uploading external images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload images',
    };
  }
}

