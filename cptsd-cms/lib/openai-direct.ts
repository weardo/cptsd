import connectDB from './mongodb';
import Post from '@cptsd/db/models/Post';
import Topic from '@cptsd/db/models/Topic';
import { generateContent, GenerateContentRequest } from './openai';

/**
 * Generate content for a post using OpenAI and update the database
 * Replaces n8n webhook integration
 */
export async function generateContentForPost(
  postId: string,
  tone: 'educational' | 'validating' | 'gentle-cta' = 'educational',
  model?: string,
  systemPrompt?: string
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

  // Generate content using OpenAI
  const response = await generateContent({
    topicName: topic.name,
    topicSlug: topic.slug,
    postType: post.postType as 'CAROUSEL' | 'REEL' | 'STORY' | 'MEME',
    rawIdea: post.rawIdea,
    tone,
    finchScreenshotUrl: post.finchScreenshotUrl || null,
    model,
    systemPrompt,
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

