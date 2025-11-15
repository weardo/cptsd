// Simple script to reset admin password
// Reads .env.local manually since we can't use dotenv package
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

// Import User model (simplified for script)
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true },
    password: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function resetAdminPassword() {
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error('Usage: node scripts/reset-admin-password.js <new-password>');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    loadEnv();

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in .env.local');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const adminUser = await User.findOne({ email: 'admin@example.com' });

    if (!adminUser) {
      console.error(
        'Admin user not found. Please initialize it first with /api/init'
      );
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    adminUser.password = hashedPassword;
    await adminUser.save();

    console.log('✅ Admin password reset successfully!');
    console.log(`Email: admin@example.com`);
    console.log(`New Password: ${newPassword}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Failed to reset password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
