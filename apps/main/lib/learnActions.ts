import connectDB from './mongodb';
import { LearnSection, Resource } from '@cptsd/db';
import mongoose from 'mongoose';

export async function getPublishedLearnSections() {
  try {
    await connectDB();

    const sections = await LearnSection.find({
      status: 'PUBLISHED',
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Collect all resource IDs that need to be fetched
    const resourceIds: mongoose.Types.ObjectId[] = [];
    sections.forEach((section: any) => {
      section.items.forEach((item: any) => {
        if (item.type === 'RESOURCE' && item.resourceId) {
          resourceIds.push(new mongoose.Types.ObjectId(item.resourceId));
        }
      });
    });

    // Fetch all resources in one query
    const resourcesMap = new Map();
    if (resourceIds.length > 0) {
      const resources = await Resource.find({
        _id: { $in: resourceIds },
      })
        .select('title description url')
        .lean();
      
      resources.forEach((resource: any) => {
        resourcesMap.set(resource._id.toString(), resource);
      });
    }

    return sections.map((section: any) => ({
      id: section._id.toString(),
      title: section.title,
      description: section.description || null,
      order: section.order,
      items: section.items
        .sort((a: any, b: any) => a.order - b.order)
        .map((item: any) => {
          // Get title/description from resource if not set
          let title = item.title;
          let description = item.description;
          let resourceUrl = null;
          
          if (item.type === 'RESOURCE' && item.resourceId) {
            const resourceIdStr = item.resourceId.toString();
            const resource = resourcesMap.get(resourceIdStr);
            if (resource) {
              title = title || resource.title;
              description = description || resource.description;
              resourceUrl = resource.url || null;
            }
          }

          return {
            id: item._id.toString(),
            type: item.type,
            title: title || null,
            description: description || null,
            articleSlug: item.articleSlug || null,
            resourceId: item.resourceId ? item.resourceId.toString() : null,
            resourceUrl: resourceUrl,
            externalUrl: item.externalUrl || null,
          };
        }),
    }));
  } catch (error) {
    if (error instanceof Error && error.message.includes('MONGODB_URI is not set')) {
      console.warn('⚠️  MongoDB not configured. Returning empty learn sections.');
      return [];
    }
    console.error('Error fetching learn sections:', error);
    return [];
  }
}


