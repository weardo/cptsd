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

  // Create a temporary env object with MONGODB_URI as optional
  const envForValidation = { ...process.env };
  if (!envForValidation.MONGODB_URI) {
    // Use a dummy URL for validation when MONGODB_URI is not set
    envForValidation.MONGODB_URI = 'mongodb://localhost:27017/cptsd-cms';
  }

  const parsed = envSchema.safeParse(envForValidation);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    throw new Error('Invalid environment variables');
  }

  // Use actual MONGODB_URI (may be undefined)
  cachedEnv = {
    ...parsed.data,
    MONGODB_URI: process.env.MONGODB_URI,
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

