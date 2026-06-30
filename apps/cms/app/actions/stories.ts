'use server';

import connectDB from '@/lib/mongodb';
import { Story, StoryStatus } from '@cptsd/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const storySchema = z.object({
  pseudonym: z.string().min(1, 'Pseudonym is required'),
  title: z.string().optional(),
  body: z.string().min(50, 'Story must be at least 50 characters').max(10000, 'Story must be less than 10,000 characters'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

export async function getStories(filters?: {
  status?: StoryStatus;
  limit?: number;
  skip?: number;
}) {
  try {
    await connectDB();

    const query: any = {};
    if (filters?.status) {
      query.status = filters.status;
    }

    const stories = await Story.find(query)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 50)
      .skip(filters?.skip || 0)
      .lean();

    const total = await Story.countDocuments(query);

    return {
      success: true,
      stories: stories.map((story) => ({
        id: story._id.toString(),
        pseudonym: story.pseudonym,
        title: story.title || null,
        body: story.body,
        status: story.status,
        approvedAt: story.approvedAt ? story.approvedAt.toISOString() : null,
        approvedBy: story.approvedBy ? story.approvedBy.toString() : null,
        createdAt: story.createdAt.toISOString(),
        updatedAt: story.updatedAt.toISOString(),
      })),
      total,
    };
  } catch (error) {
    console.error('Error fetching stories:', error);
    return {
      success: false,
      stories: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch stories',
    };
  }
}

export async function getStoryById(id: string) {
  try {
    await connectDB();

    if (!id) {
      return { success: false, story: null, error: 'Story ID is required' };
    }

    const story = await Story.findById(id).lean();

    if (!story) {
      return { success: false, story: null, error: 'Story not found' };
    }

    return {
      success: true,
      story: {
        id: story._id.toString(),
        pseudonym: story.pseudonym,
        title: story.title || null,
        body: story.body,
        status: story.status,
        approvedAt: story.approvedAt ? story.approvedAt.toISOString() : null,
        approvedBy: story.approvedBy ? story.approvedBy.toString() : null,
        createdAt: story.createdAt.toISOString(),
        updatedAt: story.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error fetching story:', error);
    return {
      success: false,
      story: null,
      error: error instanceof Error ? error.message : 'Failed to fetch story',
    };
  }
}

export async function approveStory(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const story = await Story.findById(id);
    if (!story) {
      return { success: false, error: 'Story not found' };
    }

    story.status = StoryStatus.APPROVED;
    story.approvedAt = new Date();
    story.approvedBy = session.user.email || session.user.id;

    await story.save();

    revalidatePath('/studio/stories');
    revalidatePath('/stories');

    return { success: true };
  } catch (error) {
    console.error('Error approving story:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve story',
    };
  }
}

export async function rejectStory(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const story = await Story.findById(id);
    if (!story) {
      return { success: false, error: 'Story not found' };
    }

    story.status = StoryStatus.REJECTED;
    await story.save();

    revalidatePath('/studio/stories');
    revalidatePath('/stories');

    return { success: true };
  } catch (error) {
    console.error('Error rejecting story:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject story',
    };
  }
}

export async function updateStory(id: string, formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const story = await Story.findById(id);
    if (!story) {
      return { success: false, error: 'Story not found' };
    }

    const title = formData.get('title') as string | null;
    const body = formData.get('body') as string;

    if (title !== null) {
      story.title = title || undefined;
    }
    story.body = body;

    await story.save();

    revalidatePath(`/studio/stories/${id}`);
    revalidatePath('/studio/stories');
    revalidatePath('/stories');

    return { success: true };
  } catch (error) {
    console.error('Error updating story:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update story',
    };
  }
}

export async function deleteStory(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const story = await Story.findByIdAndDelete(id);
    if (!story) {
      return { success: false, error: 'Story not found' };
    }

    revalidatePath('/studio/stories');
    revalidatePath('/stories');

    return { success: true };
  } catch (error) {
    console.error('Error deleting story:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete story',
    };
  }
}

export async function hideStory(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const story = await Story.findById(id);
    if (!story) {
      return { success: false, error: 'Story not found' };
    }

    // Change status to REJECTED to hide it from public view
    story.status = StoryStatus.REJECTED;
    await story.save();

    revalidatePath(`/studio/stories/${id}`);
    revalidatePath('/studio/stories');
    revalidatePath('/stories');

    return { success: true };
  } catch (error) {
    console.error('Error hiding story:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to hide story',
    };
  }
}

export async function unhideStory(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const story = await Story.findById(id);
    if (!story) {
      return { success: false, error: 'Story not found' };
    }

    // Change status back to APPROVED to show it publicly
    story.status = StoryStatus.APPROVED;
    if (!story.approvedAt) {
      story.approvedAt = new Date();
      story.approvedBy = session.user.email || session.user.id;
    }
    await story.save();

    revalidatePath(`/studio/stories/${id}`);
    revalidatePath('/studio/stories');
    revalidatePath('/stories');

    return { success: true };
  } catch (error) {
    console.error('Error unhiding story:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unhide story',
    };
  }
}

