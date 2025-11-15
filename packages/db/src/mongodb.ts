import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Allow build-time placeholder for Next.js build process
// Validation happens at runtime when actually connecting
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI);

if (!MONGODB_URI && !isBuildTime) {
  console.warn('⚠️  MONGODB_URI is not set. Database operations will fail.');
  console.warn('   Please set MONGODB_URI in .env.local');
  console.warn('   Get a free MongoDB Atlas database: https://www.mongodb.com/cloud/atlas/register');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached: {
  conn: typeof import('mongoose') | null;
  promise: Promise<typeof import('mongoose')> | null;
} = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  // During build time, MongoDB may not be available - handle gracefully
  if (isBuildTime) {
    // Return a mock connection to allow build to proceed
    // Actual connection will happen at runtime
    return cached.conn || mongoose;
  }

  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Please set it in .env.local\n' +
      'Get a free MongoDB Atlas database: https://www.mongodb.com/cloud/atlas/register'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('✅ Connected to MongoDB');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

// Declare global type for mongoose cache
declare global {
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  } | undefined;
}

