import connectDB from '../lib/mongodb';
import User from '../models/User';
import bcrypt from 'bcryptjs';

/**
 * Reset admin user password
 * Usage: npx tsx scripts/reset-admin-password.ts <new-password>
 */
async function resetAdminPassword() {
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error('Usage: npx tsx scripts/reset-admin-password.ts <new-password>');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    await connectDB();
    
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      console.error('Admin user not found. Please initialize it first with /api/init');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    adminUser.password = hashedPassword;
    await adminUser.save();

    console.log('✅ Admin password reset successfully!');
    console.log(`Email: admin@example.com`);
    console.log(`Password: ${newPassword}`);
  } catch (error) {
    console.error('❌ Failed to reset password:', error);
    process.exit(1);
  }
}

resetAdminPassword();


