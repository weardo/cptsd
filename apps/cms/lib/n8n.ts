import { getN8nConfig } from './config';
import connectDB from './mongodb';
import { Post, Topic } from '@cptsd/db';

export type N8nGenerateContentRequest = {
  postId: string;
  topicName: string;
  topicSlug: string;
  postType: 'CAROUSEL' | 'REEL' | 'STORY' | 'MEME';
  rawIdea: string;
  tone: 'educational' | 'validating' | 'gentle-cta';
  finchScreenshotUrl?: string | null;
};

export type N8nGenerateContentResponse = {
  script: string;
  caption: string;
  hashtags: string[] | string;
  ai_background_urls?: string[];
  zip_url?: string;
};

/**
 * Call n8n webhook to generate content
 */
export async function callN8nGenerateContent(
  request: N8nGenerateContentRequest
): Promise<N8nGenerateContentResponse> {
  const config = getN8nConfig();
  const webhookUrl = `${config.baseUrl}${config.webhookPath}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `n8n webhook failed with status ${response.status}: ${errorText}`
      );
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data.script || !data.caption) {
      throw new Error('Invalid response from n8n: missing script or caption');
    }
    
    return {
      script: data.script,
      caption: data.caption,
      hashtags: data.hashtags || [],
      ai_background_urls: data.ai_background_urls || [],
      zip_url: data.zip_url,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('n8n webhook request timed out after 5 minutes');
      }
      throw error;
    }
    
    throw new Error('Unknown error calling n8n webhook');
  }
}

/**
 * Generate content for a post using n8n and update the database
 */
export async function generateContentForPost(
  postId: string,
  tone: 'educational' | 'validating' | 'gentle-cta' = 'educational'
) {
  await connectDB();
  
  const post = await Post.findById(postId).populate('topicId').lean();
  
  if (!post) {
    throw new Error('Post not found');
  }
  
  if (!post.rawIdea) {
    throw new Error('Post must have a rawIdea to generate content');
  }
  
  const topic = (post as any).topicId;
  if (!topic || typeof topic !== 'object') {
    throw new Error('Post topic not found');
  }
  
  // Call n8n webhook
  const response = await callN8nGenerateContent({
    postId: post._id.toString(),
    topicName: topic.name,
    topicSlug: topic.slug,
    postType: post.postType as 'CAROUSEL' | 'REEL' | 'STORY' | 'MEME',
    rawIdea: post.rawIdea,
    tone,
    finchScreenshotUrl: post.finchScreenshotUrl || null,
  });
  
  // Update post with generated content
  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    {
      script: response.script,
      caption: response.caption,
      hashtags: Array.isArray(response.hashtags)
        ? response.hashtags.join(' ')
        : response.hashtags || '',
      aiBackgroundUrls: response.ai_background_urls || [],
      zipUrl: response.zip_url || '',
      status: 'GENERATED',
    },
    { new: true, runValidators: true }
  )
    .populate('topicId')
    .lean();
  
  if (!updatedPost) {
    throw new Error('Failed to update post');
  }
  
  const updatedTopic = (updatedPost as any).topicId;
  
  // Return transformed post
  return {
    id: updatedPost._id.toString(),
    _id: updatedPost._id.toString(),
    topicId: typeof updatedTopic === 'object' ? updatedTopic._id.toString() : updatedTopic.toString(),
    topic: typeof updatedTopic === 'object' ? {
      id: updatedTopic._id.toString(),
      _id: updatedTopic._id.toString(),
      name: updatedTopic.name,
      slug: updatedTopic.slug,
      description: updatedTopic.description,
    } : null,
    postType: updatedPost.postType,
    status: updatedPost.status,
    rawIdea: updatedPost.rawIdea,
    script: updatedPost.script,
    caption: updatedPost.caption,
    hashtags: updatedPost.hashtags,
    finchScreenshotUrl: updatedPost.finchScreenshotUrl,
    aiBackgroundUrls: updatedPost.aiBackgroundUrls,
    zipUrl: updatedPost.zipUrl,
    platforms: updatedPost.platforms,
    createdAt: updatedPost.createdAt,
    updatedAt: updatedPost.updatedAt,
    authorId: updatedPost.authorId?.toString(),
  };
}
