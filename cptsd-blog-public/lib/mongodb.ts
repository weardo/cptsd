import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Allow build-time placeholder for Next.js build process
// Validation happens at runtime when actually connecting
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI);

if (!MONGODB_URI && !isBuildTime) {
  throw new Error('MONGODB_URI is not set');
}

let cached: {
  conn: typeof import('mongoose') | null;
  promise: Promise<typeof import('mongoose')> | null;
} = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
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

declare global {
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  } | undefined;
}

