import connectDB from '@cptsd/db/mongodb';
import { User } from '@cptsd/db';
import bcrypt from 'bcryptjs';
import { getAuthConfig } from './config';

/**
 * Initialize admin user if it doesn't exist
 */
export async function initializeAdminUser() {
  const config = getAuthConfig();
  
  try {
    await connectDB();
    
    const existingUser = await User.findOne({ email: config.email });
    
    if (existingUser) {
      console.log(`[Init] Admin user already exists: ${config.email}`);
      return;
    }
    
    const hashedPassword = await bcrypt.hash(config.password, 10);
    
    await User.create({
      email: config.email,
      password: hashedPassword,
      name: 'Admin',
    });
    
    console.log(`[Init] Admin user created: ${config.email}`);
  } catch (error: any) {
    console.error('[Init] Failed to initialize admin user:', error.message);
  }
}



