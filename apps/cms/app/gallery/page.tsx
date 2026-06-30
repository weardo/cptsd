import { getPosts } from '@/app/actions/posts';

import MediaGallery from '@/components/MediaGallery';
import connectDB from '@/lib/mongodb';
import { GeneratedAsset, StandaloneGeneration, Post, Article, Topic } from '@cptsd/db';
import mongoose from 'mongoose';

// Force dynamic rendering to avoid MongoDB connection during build
export const dynamic = 'force-dynamic';

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ postId?: string; kind?: string }>;
}) {
  await connectDB();
  
  const params = await searchParams;
  const postId = params.postId;
  const kind = params.kind;

  // Build query
  const query: any = {};
  if (postId) {
    // Validate MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(postId)) {
      query.postId = new mongoose.Types.ObjectId(postId);
    }
  }
  if (kind) {
    query.kind = kind;
  }

  // Fetch all assets with post/blog information
  const assets = await GeneratedAsset.find(query)
    .populate('postId')
    .populate('blogId')
    .sort({ createdAt: -1 })
    .lean();

  // Fetch standalone generations (only those with images)
  // Fetch all and filter in memory since $size doesn't work with comparisons
  const standaloneGenerations = await StandaloneGeneration.find({
    contentType: { $in: ['image', 'both'] },
    generatedImages: { $exists: true, $ne: [] },
  })
    .sort({ createdAt: -1 })
    .lean();
  
  // Filter to only those with actual images (since $size doesn't work with comparisons)
  const generationsWithImages = standaloneGenerations.filter((gen: any) => 
    Array.isArray(gen.generatedImages) && gen.generatedImages.length > 0
  );

  // Fetch all posts for filtering
  const postsResult = await getPosts();
  const posts = postsResult.success ? postsResult.posts : [];

  // Transform post/blog assets for client component
  const transformedAssets = assets.map((asset: any) => {
    const post = asset.postId as any;
    const blog = asset.blogId as any;
    
    // Determine source and related entity
    let source: 'post' | 'blog' = 'post';
    let relatedEntity: any = null;
    let relatedId = '';
    
    if (blog && typeof blog === 'object') {
      source = 'blog';
      relatedEntity = {
        id: blog._id.toString(),
        _id: blog._id.toString(),
        title: blog.title || '',
        slug: blog.slug || '',
        status: blog.status || '',
      };
      relatedId = blog._id.toString();
    } else if (post && typeof post === 'object') {
      source = 'post';
      relatedEntity = {
        id: post._id.toString(),
        _id: post._id.toString(),
        rawIdea: post.rawIdea || '',
        postType: post.postType,
        status: post.status,
      };
      relatedId = post._id.toString();
    } else if (asset.postId) {
      relatedId = typeof asset.postId === 'object' ? asset.postId._id.toString() : asset.postId.toString();
    } else if (asset.blogId) {
      source = 'blog';
      relatedId = typeof asset.blogId === 'object' ? asset.blogId._id.toString() : asset.blogId.toString();
    }
    
    return {
      id: asset._id.toString(),
      _id: asset._id.toString(),
      postId: relatedId,
      blogId: source === 'blog' ? relatedId : '',
      kind: asset.kind,
      size: asset.size,
      url: asset.url,
      thumbnailUrl: asset.thumbnailUrl || asset.url,
      slideNumber: asset.slideNumber || null,
      metadata: asset.metadata ? {
        prompt: asset.metadata.prompt,
        model: asset.metadata.model,
        revised_prompt: asset.metadata.revised_prompt,
        slideDescription: asset.metadata.slideDescription,
        generationParams: asset.metadata.generationParams,
      } : null,
      post: source === 'post' ? relatedEntity : null,
      blog: source === 'blog' ? relatedEntity : null,
      source,
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
  });

  // Transform standalone generation images into assets
  const standaloneAssets = generationsWithImages.flatMap((generation: any) => {
    if (!generation.generatedImages || generation.generatedImages.length === 0) {
      return [];
    }
    
    return generation.generatedImages.map((imageUrl: string, index: number) => ({
      id: `${generation._id.toString()}-${index}`,
      _id: `${generation._id.toString()}-${index}`,
      postId: '', // No post ID for standalone generations
      kind: 'IMAGE_FEED' as const, // Default kind for standalone images
      size: '1024x1024', // Default size for DALL-E 3
      url: imageUrl,
      thumbnailUrl: imageUrl,
      slideNumber: null,
      metadata: {
        prompt: generation.prompt,
        model: generation.openaiModel,
        generationParams: generation.metadata?.generationParams || {},
      },
      post: null,
      source: 'standalone' as const,
      standaloneGeneration: {
        id: generation._id.toString(),
        prompt: generation.prompt,
        systemPrompt: generation.systemPrompt,
        contentType: generation.contentType,
        generatedText: generation.generatedText,
        createdAt: generation.createdAt instanceof Date 
          ? generation.createdAt.toISOString() 
          : new Date(generation.createdAt).toISOString(),
      },
      createdAt: generation.createdAt instanceof Date 
        ? generation.createdAt.toISOString() 
        : typeof generation.createdAt === 'string' 
          ? generation.createdAt 
          : new Date(generation.createdAt).toISOString(),
      updatedAt: generation.updatedAt instanceof Date 
        ? generation.updatedAt.toISOString() 
        : typeof generation.updatedAt === 'string' 
          ? generation.updatedAt 
          : new Date(generation.updatedAt).toISOString(),
    }));
  });

  // Combine and sort all assets by creation date
  const allAssets = [...transformedAssets, ...standaloneAssets].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Media Gallery</h1>
        <MediaGallery assets={allAssets} posts={posts} />
      </div>
    </div>
  );
}

