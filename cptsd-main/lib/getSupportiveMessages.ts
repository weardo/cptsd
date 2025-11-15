import { connectDB, SupportiveMessage, SupportiveMessagePetType as PetType } from '@cptsd/db';
import type { PetType as LocalPetType } from './petLibrary';

/**
 * Get active supportive messages for a specific pet type
 * Filters by:
 * - Active status
 * - Pet type (or 'all')
 * - Date range (if specified)
 * - Returns messages sorted by priority
 */
export async function getSupportiveMessagesForPet(
  petType: LocalPetType,
  options?: {
    limit?: number;
    includeTags?: string[];
    excludeTags?: string[];
  }
): Promise<string[]> {
  try {
    await connectDB();

    const now = new Date();

    // Build query
    const query: any = {
      isActive: true,
      $or: [{ petType: PetType.ALL }, { petType: petType as any }],
      $and: [
        {
          $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }],
        },
        {
          $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }],
        },
      ],
    };

    // Filter by tags if specified
    // If includeTags is provided, match messages that have those tags OR have no tags
    // This allows messages without tags to still be shown
    if (options?.includeTags && options.includeTags.length > 0) {
      // Add tag filtering to $and clause to combine with existing conditions
      query.$and.push({
        $or: [
          { tags: { $in: options.includeTags } },
          { tags: { $exists: false } },
          { tags: { $size: 0 } },
        ],
      });
    }

    if (options?.excludeTags && options.excludeTags.length > 0) {
      query.$and.push({
        $or: [
          { tags: { $nin: options.excludeTags } },
          { tags: { $exists: false } },
          { tags: { $size: 0 } },
        ],
      });
    }

    // Fetch messages sorted by priority
    const messages = await SupportiveMessage.find(query)
      .sort({ priority: -1, usageCount: 1 }) // Higher priority first, then less used
      .limit(options?.limit || 50)
      .lean();

    // Update usage count (fire and forget)
    if (messages.length > 0) {
      const ids = messages.map((m) => m._id);
      SupportiveMessage.updateMany(
        { _id: { $in: ids } },
        { $inc: { usageCount: 1 }, $set: { lastShownAt: now } }
      ).catch((err) => console.error('Error updating usage count:', err));
    }

    return messages.map((m) => m.message);
  } catch (error) {
    // Gracefully handle errors - return empty array
    if (error instanceof Error && error.message.includes('MONGODB_URI is not set')) {
      console.warn('⚠️  MongoDB not configured. Using fallback messages.');
      return [];
    }
    console.error('Error fetching supportive messages:', error);
    return [];
  }
}

/**
 * Get all active supportive messages (for admin/stats)
 */
export async function getAllActiveSupportiveMessages() {
  try {
    await connectDB();

    const messages = await SupportiveMessage.find({ isActive: true })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    return messages.map((msg) => ({
      id: msg._id.toString(),
      message: msg.message,
      petType: msg.petType,
      priority: msg.priority,
      tags: msg.tags || [],
      usageCount: msg.usageCount || 0,
      lastShownAt: msg.lastShownAt,
    }));
  } catch (error) {
    console.error('Error fetching all supportive messages:', error);
    return [];
  }
}

