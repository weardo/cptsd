'use server';

import connectDB from '@/lib/mongodb';
import { SupportiveMessage, SupportiveMessagePetType as PetType } from '@cptsd/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import mongoose from 'mongoose';

const messageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(200, 'Message must be 200 characters or less'),
  petType: z.nativeEnum(PetType),
  priority: z.number().min(1).max(10).default(5),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  startDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  endDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

export async function createSupportiveMessage(formData: FormData) {
  try {
    await connectDB();

    const data = {
      message: formData.get('message') as string,
      petType: formData.get('petType') as PetType,
      priority: formData.get('priority') ? parseInt(formData.get('priority') as string) : 5,
      isActive: formData.get('isActive') === 'true' || formData.get('isActive') === 'on',
      tags: formData.get('tags')
        ? (formData.get('tags') as string)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
      endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
    };

    const validated = messageSchema.parse(data);

    const message = await SupportiveMessage.create({
      ...validated,
      usageCount: 0,
    });

    revalidatePath('/supportive-messages');
    revalidatePath('/');

    return {
      success: true,
      message: {
        id: (message._id as mongoose.Types.ObjectId).toString(),
        message: message.message,
        petType: message.petType,
        priority: message.priority,
        isActive: message.isActive,
        tags: message.tags,
        startDate: message.startDate,
        endDate: message.endDate,
        usageCount: message.usageCount,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      },
    };
  } catch (error) {
    console.error('Error creating supportive message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create supportive message',
    };
  }
}

export async function updateSupportiveMessage(id: string, formData: FormData) {
  try {
    await connectDB();

    const data = {
      message: formData.get('message') as string,
      petType: formData.get('petType') as PetType,
      priority: formData.get('priority') ? parseInt(formData.get('priority') as string) : 5,
      isActive: formData.get('isActive') === 'true' || formData.get('isActive') === 'on',
      tags: formData.get('tags')
        ? (formData.get('tags') as string)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
      endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
    };

    const validated = messageSchema.parse(data);

    const message = await SupportiveMessage.findByIdAndUpdate(
      id,
      { ...validated },
      { new: true, runValidators: true }
    );

    if (!message) {
      return {
        success: false,
        error: 'Message not found',
      };
    }

    revalidatePath('/supportive-messages');
    revalidatePath(`/supportive-messages/${id}`);

    return {
      success: true,
      message: {
        id: (message._id as mongoose.Types.ObjectId).toString(),
        message: message.message,
        petType: message.petType,
        priority: message.priority,
        isActive: message.isActive,
        tags: message.tags,
        startDate: message.startDate,
        endDate: message.endDate,
        usageCount: message.usageCount,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      },
    };
  } catch (error) {
    console.error('Error updating supportive message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update supportive message',
    };
  }
}

export async function deleteSupportiveMessage(id: string) {
  try {
    await connectDB();

    const message = await SupportiveMessage.findByIdAndDelete(id);

    if (!message) {
      return {
        success: false,
        error: 'Message not found',
      };
    }

    revalidatePath('/supportive-messages');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting supportive message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete supportive message',
    };
  }
}

export async function getAllSupportiveMessages() {
  try {
    await connectDB();

    const messages = await SupportiveMessage.find({})
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    return messages.map((msg) => ({
      id: msg._id.toString(),
      message: msg.message,
      petType: msg.petType,
      priority: msg.priority,
      isActive: msg.isActive,
      tags: msg.tags || [],
      startDate: msg.startDate,
      endDate: msg.endDate,
      usageCount: msg.usageCount || 0,
      lastShownAt: msg.lastShownAt,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching supportive messages:', error);
    return [];
  }
}

export async function getSupportiveMessageById(id: string) {
  try {
    await connectDB();

    const message = await SupportiveMessage.findById(id).lean();

    if (!message) {
      return null;
    }

    return {
      id: message._id.toString(),
      message: message.message,
      petType: message.petType,
      priority: message.priority,
      isActive: message.isActive,
      tags: message.tags || [],
      startDate: message.startDate,
      endDate: message.endDate,
      usageCount: message.usageCount || 0,
      lastShownAt: message.lastShownAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching supportive message:', error);
    return null;
  }
}

