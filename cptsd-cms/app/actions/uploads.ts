'use server';

import { uploadToS3 } from '@/lib/s3';

export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 10MB limit',
      };
    }
    
    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only images are allowed.',
      };
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const url = await uploadToS3(buffer, file.name, 'finch-screenshots');
    
    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

export async function uploadBlogImage(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 10MB limit',
      };
    }
    
    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only images are allowed.',
      };
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const url = await uploadToS3(buffer, file.name, 'blog-images');
    
    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error('Error uploading blog image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}

export async function uploadGalleryImage(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 10MB limit',
      };
    }
    
    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only images are allowed.',
      };
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to S3
    const url = await uploadToS3(buffer, file.name, 'gallery-uploads');
    
    // Save to GeneratedAsset for gallery
    const { default: connectDB } = await import('@/lib/mongodb');
    const { default: GeneratedAsset } = await import('@/models/GeneratedAsset');
    const { AssetKind } = await import('@/models/GeneratedAsset');
    const mongoose = await import('mongoose');
    
    await connectDB();
    
    const asset = await GeneratedAsset.create({
      // No postId or blogId for manually uploaded gallery images
      kind: AssetKind.IMAGE_FEED,
      size: '1080x1080', // Default size
      url,
      thumbnailUrl: url,
      metadata: {
        prompt: 'Manually uploaded image',
        model: 'manual-upload',
      },
    });
    
    return {
      success: true,
      url,
      assetId: String(asset._id),
    };
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}

