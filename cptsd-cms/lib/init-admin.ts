import connectDB from './mongodb';
import { initializeAdminUser } from './auth';

/**
 * Initialize admin user on app startup
 * This should be called once when the app starts
 */
export async function initAdminUser() {
  try {
    await connectDB();
    const user = await initializeAdminUser();
    console.log('✅ Admin user initialized:', user.email);
    return user;
  } catch (error) {
    console.error('❌ Failed to initialize admin user:', error);
    throw error;
  }
}

