// Simple script to fix admin user - run inside Docker container
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment from process.env (set by Docker)
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://admin:eZUTEX5ctzOu7DwXAFbeTHr3@mongodb:27017/cptsd-cms?authSource=admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'janjalkarabhishek3@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'XFwg6TsoOZoWY98D';

console.log('🔧 Fixing admin user...');
console.log('Email:', ADMIN_EMAIL);
console.log('MongoDB URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));

// User schema
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true },
    password: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function fixAdminUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} user(s) in database`);

    // Hash new password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Check if user with new email exists
    let adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (adminUser) {
      // Update existing user
      console.log(`📝 Updating existing user: ${ADMIN_EMAIL}`);
      adminUser.password = hashedPassword;
      adminUser.name = adminUser.name || 'Admin';
      await adminUser.save();
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new user or update old one
      const oldAdmin = await User.findOne({ email: { $regex: /admin/i } });
      if (oldAdmin) {
        console.log(`📝 Updating old admin user to new email: ${ADMIN_EMAIL}`);
        oldAdmin.email = ADMIN_EMAIL;
        oldAdmin.password = hashedPassword;
        oldAdmin.name = oldAdmin.name || 'Admin';
        await oldAdmin.save();
        adminUser = oldAdmin;
      } else {
        console.log(`➕ Creating new admin user: ${ADMIN_EMAIL}`);
        adminUser = await User.create({
          email: ADMIN_EMAIL,
          password: hashedPassword,
          name: 'Admin',
        });
      }
      console.log('✅ Admin user created/updated successfully');
    }

    console.log('');
    console.log('✅ Admin user fixed successfully!');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to fix admin user:', error);
    process.exit(1);
  }
}

fixAdminUser();
