import { z } from 'zod';

const envSchema = z.object({
  // Database (MongoDB connection string)
  MONGODB_URI: z.string().url().optional(),
  
  // OpenAI Configuration
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional().default('gpt-4o-mini'),
  OPENAI_BASE_URL: z.string().url().optional().or(z.literal('')),
  
  // Authentication
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url().optional().default('http://localhost:3003'),
  NEXTAUTH_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  // During build time, provide placeholder values
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                      (process.env.NODE_ENV === 'production' && 
                       (!process.env.ADMIN_EMAIL || !process.env.NEXTAUTH_SECRET));

  const envForValidation = { ...process.env };
  
  if (isBuildTime) {
    envForValidation.MONGODB_URI = envForValidation.MONGODB_URI || 'mongodb://localhost:27017/cptsd-journal';
    envForValidation.ADMIN_EMAIL = envForValidation.ADMIN_EMAIL || 'build@example.com';
    envForValidation.ADMIN_PASSWORD = envForValidation.ADMIN_PASSWORD || 'build-placeholder-password-123';
    envForValidation.NEXTAUTH_SECRET = envForValidation.NEXTAUTH_SECRET || 'build-placeholder-secret-min-32-chars-long';
  } else {
    if (!envForValidation.MONGODB_URI) {
      envForValidation.MONGODB_URI = 'mongodb://localhost:27017/cptsd-journal';
    }
  }

  const parsed = envSchema.safeParse(envForValidation);

  if (!parsed.success) {
    if (!isBuildTime) {
      console.error('❌ Invalid environment variables:');
      console.error(parsed.error.format());
      throw new Error('Invalid environment variables');
    } else {
      console.warn('⚠️  Using placeholder environment variables during build');
      cachedEnv = {
        MONGODB_URI: envForValidation.MONGODB_URI,
        OPENAI_API_KEY: envForValidation.OPENAI_API_KEY,
        OPENAI_MODEL: envForValidation.OPENAI_MODEL || 'gpt-4o-mini',
        OPENAI_BASE_URL: envForValidation.OPENAI_BASE_URL,
        ADMIN_EMAIL: envForValidation.ADMIN_EMAIL!,
        ADMIN_PASSWORD: envForValidation.ADMIN_PASSWORD!,
        NEXTAUTH_URL: envForValidation.NEXTAUTH_URL || 'http://localhost:3003',
        NEXTAUTH_SECRET: envForValidation.NEXTAUTH_SECRET!,
      } as Env;
      return cachedEnv;
    }
  }

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

export function getAuthConfig() {
  const env = getEnv();
  return {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    nextAuthUrl: env.NEXTAUTH_URL,
    nextAuthSecret: env.NEXTAUTH_SECRET,
  };
}

export function getOpenAIConfig() {
  const env = getEnv();
  return {
    apiKey: env.OPENAI_API_KEY || '',
    model: env.OPENAI_MODEL || 'gpt-4o-mini',
    baseURL: env.OPENAI_BASE_URL,
  };
}

