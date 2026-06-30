#!/bin/bash
# Fix admin user email and password to match .env file

set -e

echo "🔧 Fixing admin user credentials..."

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ .env file not found"
    exit 1
fi

# Check if we're in a Docker container or on the host
if [ -f /.dockerenv ] || [ -n "$DOCKER_CONTAINER" ]; then
    # Running inside Docker - use node directly
    NODE_CMD="node"
else
    # Running on host - use docker-compose exec
    NODE_CMD="docker-compose exec -T app node"
fi

# Create temporary script
cat > /tmp/fix-admin.js << 'EOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ Missing required environment variables');
    console.error('MONGODB_URI:', MONGODB_URI ? '✅' : '❌');
    console.error('ADMIN_EMAIL:', ADMIN_EMAIL ? '✅' : '❌');
    console.error('ADMIN_PASSWORD:', ADMIN_PASSWORD ? '✅' : '❌');
    process.exit(1);
}

// User schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function fixAdminUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all admin users (might be multiple with old emails)
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
            // Create new user
            console.log(`➕ Creating new admin user: ${ADMIN_EMAIL}`);
            adminUser = await User.create({
                email: ADMIN_EMAIL,
                password: hashedPassword,
                name: 'Admin',
            });
            console.log('✅ Admin user created successfully');
        }

        // Delete old admin users with different emails (optional cleanup)
        const oldUsers = await User.find({ email: { $ne: ADMIN_EMAIL } });
        if (oldUsers.length > 0) {
            console.log(`🗑️  Removing ${oldUsers.length} old user(s) with different emails`);
            for (const oldUser of oldUsers) {
                await User.deleteOne({ _id: oldUser._id });
                console.log(`   Removed: ${oldUser.email}`);
            }
        }

        console.log('');
        console.log('✅ Admin user fixed successfully!');
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log('');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Failed to fix admin user:', error);
        process.exit(1);
    }
}

fixAdminUser();
EOF

# Copy script to container if needed
if [ ! -f /.dockerenv ]; then
    docker cp /tmp/fix-admin.js cms_app_1:/tmp/fix-admin.js 2>/dev/null || true
    docker-compose exec -T app sh -c "cd /app && node /tmp/fix-admin.js" || {
        echo "Trying alternative method..."
        # Alternative: Run via docker-compose exec
        docker-compose exec -T app node -e "$(cat /tmp/fix-admin.js)" || {
            echo "Running script directly in container..."
            docker-compose exec app sh -c "cd /app && cat > /tmp/fix-admin.js" < /tmp/fix-admin.js
            docker-compose exec app node /tmp/fix-admin.js
        }
    }
else
    node /tmp/fix-admin.js
fi

rm -f /tmp/fix-admin.js


