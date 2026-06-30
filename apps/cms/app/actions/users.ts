'use server';

import connectDB from '@/lib/mongodb';
import { User } from '@cptsd/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

/**
 * Change current user's password
 */
export async function changePassword(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    await connectDB();

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    const validated = changePasswordSchema.parse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    const user = await User.findById(session.user.id);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Verify current password
    if (!user.password) {
      return {
        success: false,
        error: 'User has no password set',
      };
    }

    const isValid = await bcrypt.compare(validated.currentPassword, user.password);
    if (!isValid) {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    revalidatePath('/settings');

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error) {
    console.error('Error changing password:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change password',
    };
  }
}

/**
 * Get all users
 */
export async function getUsers() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
        users: [],
      };
    }

    await connectDB();

    const users = await User.find({}).select('-password').lean();

    return {
      success: true,
      users: users.map((user: any) => ({
        id: user._id.toString(),
        email: user.email,
        name: user.name || '',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
      users: [],
    };
  }
}

/**
 * Create a new user
 */
export async function createUser(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    await connectDB();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    const validated = createUserSchema.parse({
      email,
      password,
      name,
    });

    // Check if user already exists
    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists',
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await User.create({
      email: validated.email,
      password: hashedPassword,
      name: validated.name,
    });

    revalidatePath('/settings');

    const userDoc = user as any;

    return {
      success: true,
      message: 'User created successfully',
      user: {
        id: userDoc._id.toString(),
        email: userDoc.email,
        name: userDoc.name,
      },
    };
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    await connectDB();

    // Prevent deleting yourself
    if (session.user.id === userId) {
      return {
        success: false,
        error: 'You cannot delete your own account',
      };
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    revalidatePath('/settings');

    return {
      success: true,
      message: 'User deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        user: null,
      };
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('-password').lean();
    if (!user) {
      return {
        success: false,
        user: null,
      };
    }

    return {
      success: true,
      user: {
        id: (user as any)._id.toString(),
        email: (user as any).email,
        name: (user as any).name || '',
      },
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return {
      success: false,
      user: null,
    };
  }
}

