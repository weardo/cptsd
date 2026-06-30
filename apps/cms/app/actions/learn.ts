'use server';

import connectDB from '@/lib/mongodb';
import { LearnSection, LearnItemType, Article, Resource } from '@cptsd/db';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

export async function getLearnSections() {
  try {
    await connectDB();

    const sections = await LearnSection.find()
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return {
      success: true,
      sections: sections.map((section) => ({
        id: (section._id as any).toString(),
        title: section.title,
        description: section.description || null,
        order: section.order,
        items: section.items.map((item: any) => ({
          id: item._id.toString(),
          type: item.type,
          title: item.title || null,
          description: item.description || null,
          articleId: item.articleId ? item.articleId.toString() : null,
          articleSlug: item.articleSlug || null,
          resourceId: item.resourceId ? item.resourceId.toString() : null,
          externalUrl: item.externalUrl || null,
          order: item.order,
        })),
        status: section.status,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      })),
    };
  } catch (error) {
    console.error('Error fetching learn sections:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch learn sections',
      sections: [],
    };
  }
}

export async function getLearnSection(id: string) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: 'Invalid section ID' };
    }

    const section = await LearnSection.findById(id).lean();

    if (!section) {
      return { success: false, error: 'Section not found' };
    }

    return {
      success: true,
      section: {
        id: (section._id as any).toString(),
        title: section.title,
        description: section.description || null,
        order: section.order,
        items: section.items.map((item: any) => ({
          id: item._id.toString(),
          type: item.type,
          title: item.title || null,
          description: item.description || null,
          articleId: item.articleId ? item.articleId.toString() : null,
          articleSlug: item.articleSlug || null,
          resourceId: item.resourceId ? item.resourceId.toString() : null,
          externalUrl: item.externalUrl || null,
          order: item.order,
        })),
        status: section.status,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      },
    };
  } catch (error) {
    console.error('Error fetching learn section:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch learn section',
    };
  }
}

export async function createLearnSection(formData: FormData) {
  try {
    await connectDB();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const order = parseInt(formData.get('order') as string) || 0;
    const status = (formData.get('status') as 'DRAFT' | 'PUBLISHED') || 'DRAFT';

    const section = await LearnSection.create({
      title,
      description: description || undefined,
      order,
      status,
      items: [],
    });

    revalidatePath('/learn');
    revalidatePath('/studio/learn');

    return {
      success: true,
      section: {
        id: (section._id as any).toString(),
        title: section.title,
        description: section.description || null,
        order: section.order,
        items: [],
        status: section.status,
      },
    };
  } catch (error) {
    console.error('Error creating learn section:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create learn section',
    };
  }
}

export async function updateLearnSection(id: string, formData: FormData) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: 'Invalid section ID' };
    }

    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const order = formData.get('order') as string | null;
    const status = formData.get('status') as string | null;

    const updateData: any = {};

    if (title !== null) updateData.title = title;
    if (description !== null) updateData.description = description || undefined;
    if (order !== null) updateData.order = parseInt(order) || 0;
    if (status !== null) updateData.status = status;

    const section = await LearnSection.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!section) {
      return { success: false, error: 'Section not found' };
    }

    revalidatePath('/learn');
    revalidatePath('/studio/learn');
    revalidatePath(`/studio/learn/${id}`);

    return {
      success: true,
      section: {
        id: (section._id as any).toString(),
        title: section.title,
        description: section.description || null,
        order: section.order,
        items: section.items.map((item: any) => ({
          id: item._id.toString(),
          type: item.type,
          title: item.title || null,
          description: item.description || null,
          articleId: item.articleId ? item.articleId.toString() : null,
          articleSlug: item.articleSlug || null,
          resourceId: item.resourceId ? item.resourceId.toString() : null,
          externalUrl: item.externalUrl || null,
          order: item.order,
        })),
        status: section.status,
      },
    };
  } catch (error) {
    console.error('Error updating learn section:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update learn section',
    };
  }
}

export async function deleteLearnSection(id: string) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: 'Invalid section ID' };
    }

    await LearnSection.findByIdAndDelete(id);

    revalidatePath('/learn');
    revalidatePath('/studio/learn');

    return { success: true };
  } catch (error) {
    console.error('Error deleting learn section:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete learn section',
    };
  }
}

export async function addLearnItem(sectionId: string, formData: FormData) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return { success: false, error: 'Invalid section ID' };
    }

    const type = formData.get('type') as LearnItemType;
    let title = formData.get('title') as string | null;
    let description = formData.get('description') as string | null;
    const articleId = formData.get('articleId') as string | null;
    const articleSlug = formData.get('articleSlug') as string | null;
    const resourceId = formData.get('resourceId') as string | null;
    const externalUrl = formData.get('externalUrl') as string | null;
    const order = parseInt(formData.get('order') as string) || 0;

    const section = await LearnSection.findById(sectionId);

    if (!section) {
      return { success: false, error: 'Section not found' };
    }

    // Auto-populate title/description from article or resource if not provided
    if (type === 'ARTICLE' && articleId && (!title || !description)) {
      const article = await Article.findById(articleId).lean();
      if (article) {
        if (!title) title = article.title;
        if (!description) description = article.excerpt || article.summary || article.metaDescription || null;
      }
    } else if (type === 'RESOURCE' && resourceId && (!title || !description)) {
      const resource = await Resource.findById(resourceId).lean();
      if (resource) {
        if (!title) title = resource.title;
        if (!description) description = resource.description || null;
      }
    }

    const newItem: any = {
      type,
      title: title || undefined,
      description: description || undefined,
      order,
    };

    if (type === 'ARTICLE') {
      if (articleId) {
        newItem.articleId = new mongoose.Types.ObjectId(articleId);
      }
      if (articleSlug) {
        newItem.articleSlug = articleSlug;
      }
    } else if (type === 'RESOURCE') {
      if (resourceId) {
        newItem.resourceId = new mongoose.Types.ObjectId(resourceId);
      }
    } else if (type === 'EXTERNAL_LINK') {
      if (externalUrl) {
        newItem.externalUrl = externalUrl;
      }
    }

    section.items.push(newItem);
    await section.save();

    revalidatePath('/learn');
    revalidatePath(`/studio/learn/${sectionId}`);

    return {
      success: true,
      item: {
        id: (section.items[section.items.length - 1] as any)._id.toString(),
        type: newItem.type,
        title: newItem.title || null,
        description: newItem.description || null,
        articleId: newItem.articleId ? newItem.articleId.toString() : null,
        articleSlug: newItem.articleSlug || null,
        resourceId: newItem.resourceId ? newItem.resourceId.toString() : null,
        externalUrl: newItem.externalUrl || null,
        order: newItem.order,
      },
    };
  } catch (error) {
    console.error('Error adding learn item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add learn item',
    };
  }
}

export async function updateLearnItem(sectionId: string, itemId: string, formData: FormData) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(sectionId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return { success: false, error: 'Invalid section or item ID' };
    }

    const section = await LearnSection.findById(sectionId);

    if (!section) {
      return { success: false, error: 'Section not found' };
    }

    const itemIndex = section.items.findIndex(
      (item: any) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return { success: false, error: 'Item not found' };
    }

    const type = formData.get('type') as LearnItemType | null;
    let title = formData.get('title') as string | null;
    let description = formData.get('description') as string | null;
    const articleId = formData.get('articleId') as string | null;
    const articleSlug = formData.get('articleSlug') as string | null;
    const resourceId = formData.get('resourceId') as string | null;
    const externalUrl = formData.get('externalUrl') as string | null;
    const order = formData.get('order') as string | null;

    const finalType = type !== null ? type : section.items[itemIndex].type;

    // Auto-populate title/description from article or resource if not provided
    if (finalType === 'ARTICLE' && articleId && (!title || !description)) {
      const article = await Article.findById(articleId).lean();
      if (article) {
        if (!title) title = article.title;
        if (!description) description = article.excerpt || article.summary || article.metaDescription || null;
      }
    } else if (finalType === 'RESOURCE' && resourceId && (!title || !description)) {
      const resource = await Resource.findById(resourceId).lean();
      if (resource) {
        if (!title) title = resource.title;
        if (!description) description = resource.description || null;
      }
    }

    if (type !== null) section.items[itemIndex].type = type;
    if (title !== null) section.items[itemIndex].title = title || undefined;
    if (description !== null) section.items[itemIndex].description = description || undefined;
    if (order !== null) section.items[itemIndex].order = parseInt(order) || 0;

    if (finalType === 'ARTICLE') {
      if (articleId !== null) {
        section.items[itemIndex].articleId = articleId ? new mongoose.Types.ObjectId(articleId) : undefined;
      }
      if (articleSlug !== null) {
        section.items[itemIndex].articleSlug = articleSlug || undefined;
      }
      section.items[itemIndex].resourceId = undefined;
      section.items[itemIndex].externalUrl = undefined;
    } else if (finalType === 'RESOURCE') {
      if (resourceId !== null) {
        section.items[itemIndex].resourceId = resourceId ? new mongoose.Types.ObjectId(resourceId) : undefined;
      }
      section.items[itemIndex].articleId = undefined;
      section.items[itemIndex].articleSlug = undefined;
      section.items[itemIndex].externalUrl = undefined;
    } else if (finalType === 'EXTERNAL_LINK') {
      if (externalUrl !== null) {
        section.items[itemIndex].externalUrl = externalUrl || undefined;
      }
      section.items[itemIndex].articleId = undefined;
      section.items[itemIndex].articleSlug = undefined;
      section.items[itemIndex].resourceId = undefined;
    }

    await section.save();

    revalidatePath('/learn');
    revalidatePath(`/studio/learn/${sectionId}`);

    return {
      success: true,
      item: {
        id: (section.items[itemIndex] as any)._id.toString(),
        type: section.items[itemIndex].type,
        title: section.items[itemIndex].title || null,
        description: section.items[itemIndex].description || null,
        articleId: section.items[itemIndex].articleId ? section.items[itemIndex].articleId.toString() : null,
        articleSlug: section.items[itemIndex].articleSlug || null,
        resourceId: section.items[itemIndex].resourceId ? section.items[itemIndex].resourceId.toString() : null,
        externalUrl: section.items[itemIndex].externalUrl || null,
        order: section.items[itemIndex].order,
      },
    };
  } catch (error) {
    console.error('Error updating learn item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update learn item',
    };
  }
}

export async function deleteLearnItem(sectionId: string, itemId: string) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(sectionId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return { success: false, error: 'Invalid section or item ID' };
    }

    const section = await LearnSection.findById(sectionId);

    if (!section) {
      return { success: false, error: 'Section not found' };
    }

    section.items = section.items.filter(
      (item: any) => item._id.toString() !== itemId
    );

    await section.save();

    revalidatePath('/learn');
    revalidatePath(`/studio/learn/${sectionId}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting learn item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete learn item',
    };
  }
}

export async function reorderLearnItems(sectionId: string, itemIds: string[]) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return { success: false, error: 'Invalid section ID' };
    }

    const section = await LearnSection.findById(sectionId);

    if (!section) {
      return { success: false, error: 'Section not found' };
    }

    // Reorder items based on the provided order
    const itemMap = new Map(section.items.map((item: any) => [item._id.toString(), item]));
    section.items = itemIds.map((id, index) => {
      const item = itemMap.get(id);
      if (item) {
        item.order = index;
        return item;
      }
      return null;
    }).filter(Boolean) as any[];

    await section.save();

    revalidatePath('/learn');
    revalidatePath(`/studio/learn/${sectionId}`);

    return { success: true };
  } catch (error) {
    console.error('Error reordering learn items:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder learn items',
    };
  }
}


