import { z } from 'zod';

const envSchema = z.object({
  // Database (MongoDB connection string)
  // For MongoDB Atlas free tier: https://www.mongodb.com/cloud/atlas/register
  MONGODB_URI: z.string().url().optional(),
  
  // S3 Configuration
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  
  // OpenAI Configuration (for direct AI content generation)
  OPENAI_API_KEY: z.string().optional(),
  
  // Authentication
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url().optional().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  // During build time, provide placeholder values to allow build to complete
  // These will be validated at runtime when the app actually runs
  // Check if we're in a build context (Next.js build phase or missing required env vars)
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                      (process.env.NODE_ENV === 'production' && 
                       (!process.env.S3_ACCESS_KEY_ID || !process.env.ADMIN_EMAIL || !process.env.NEXTAUTH_SECRET));

  // Create a temporary env object with defaults for build time
  const envForValidation = { ...process.env };
  
  if (isBuildTime) {
    // Provide placeholder values during build
    envForValidation.MONGODB_URI = envForValidation.MONGODB_URI || 'mongodb://localhost:27017/cptsd-cms';
    envForValidation.S3_ACCESS_KEY_ID = envForValidation.S3_ACCESS_KEY_ID || 'build-placeholder';
    envForValidation.S3_SECRET_ACCESS_KEY = envForValidation.S3_SECRET_ACCESS_KEY || 'build-placeholder';
    envForValidation.S3_BUCKET_NAME = envForValidation.S3_BUCKET_NAME || 'build-placeholder';
    envForValidation.ADMIN_EMAIL = envForValidation.ADMIN_EMAIL || 'build@example.com';
    envForValidation.ADMIN_PASSWORD = envForValidation.ADMIN_PASSWORD || 'build-placeholder-password-123';
    envForValidation.NEXTAUTH_SECRET = envForValidation.NEXTAUTH_SECRET || 'build-placeholder-secret-min-32-chars-long';
  } else {
    // Use a dummy URL for validation when MONGODB_URI is not set (runtime)
    if (!envForValidation.MONGODB_URI) {
      envForValidation.MONGODB_URI = 'mongodb://localhost:27017/cptsd-cms';
    }
  }

  const parsed = envSchema.safeParse(envForValidation);

  if (!parsed.success) {
    // Only throw error at runtime, not during build
    if (!isBuildTime) {
      console.error('❌ Invalid environment variables:');
      console.error(parsed.error.format());
      throw new Error('Invalid environment variables');
    } else {
      // During build, use the placeholder values we set
      console.warn('⚠️  Using placeholder environment variables during build');
      // Create a valid env object from placeholders
      cachedEnv = {
        MONGODB_URI: envForValidation.MONGODB_URI,
        S3_ENDPOINT: envForValidation.S3_ENDPOINT,
        S3_REGION: envForValidation.S3_REGION || 'us-east-1',
        S3_ACCESS_KEY_ID: envForValidation.S3_ACCESS_KEY_ID!,
        S3_SECRET_ACCESS_KEY: envForValidation.S3_SECRET_ACCESS_KEY!,
        S3_BUCKET_NAME: envForValidation.S3_BUCKET_NAME!,
        OPENAI_API_KEY: envForValidation.OPENAI_API_KEY,
        ADMIN_EMAIL: envForValidation.ADMIN_EMAIL!,
        ADMIN_PASSWORD: envForValidation.ADMIN_PASSWORD!,
        NEXTAUTH_URL: envForValidation.NEXTAUTH_URL || 'http://localhost:3000',
        NEXTAUTH_SECRET: envForValidation.NEXTAUTH_SECRET!,
      } as Env;
      return cachedEnv;
    }
  }

  // Use actual values or placeholders
  cachedEnv = {
    ...parsed.data,
    MONGODB_URI: process.env.MONGODB_URI || parsed.data.MONGODB_URI,
  } as Env;
  
  return cachedEnv;
}

export function getDatabaseConfig() {
  const env = getEnv();
  return {
    uri: env.MONGODB_URI || '',
  };
}

// Export individual config objects for easier access
export function getS3Config() {
  const env = getEnv();
  return {
    endpoint: env.S3_ENDPOINT && env.S3_ENDPOINT.length > 0 ? env.S3_ENDPOINT : undefined,
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    bucket: env.S3_BUCKET_NAME,
  };
}

// n8n config removed - using direct OpenAI integration instead
// Kept for backwards compatibility if needed
export function getN8nConfig() {
  return {
    baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
    webhookPath: '/webhook/generate-content',
  };
}

export function getAuthConfig() {
  const env = getEnv();
  return {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    nextAuthUrl: env.NEXTAUTH_URL,
    nextAuthSecret: env.NEXTAUTH_SECRET,
  };
}

