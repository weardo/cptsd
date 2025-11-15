import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock process.env before importing config
const originalEnv = process.env;

describe('Config', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate required environment variables', () => {
    process.env = {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      S3_ACCESS_KEY_ID: 'test-key',
      S3_SECRET_ACCESS_KEY: 'test-secret',
      S3_BUCKET_NAME: 'test-bucket',
      ADMIN_EMAIL: 'admin@test.com',
      ADMIN_PASSWORD: 'testpassword123',
      NEXTAUTH_SECRET: 'test-secret-min-32-chars-long-required',
    };

    expect(() => {
      require('./config').getEnv();
    }).not.toThrow();
  });

  it('should throw error if required variables are missing', () => {
    process.env = {};

    expect(() => {
      require('./config').getEnv();
    }).toThrow('Invalid environment variables');
  });

  it('should handle optional S3_ENDPOINT', () => {
    process.env = {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      S3_ACCESS_KEY_ID: 'test-key',
      S3_SECRET_ACCESS_KEY: 'test-secret',
      S3_BUCKET_NAME: 'test-bucket',
      ADMIN_EMAIL: 'admin@test.com',
      ADMIN_PASSWORD: 'testpassword123',
      NEXTAUTH_SECRET: 'test-secret-min-32-chars-long-required',
      S3_ENDPOINT: '',
    };

    expect(() => {
      const config = require('./config');
      const s3Config = config.getS3Config();
      expect(s3Config.endpoint).toBeUndefined();
    }).not.toThrow();
  });

  it('should handle optional N8N_BASE_URL', () => {
    process.env = {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      S3_ACCESS_KEY_ID: 'test-key',
      S3_SECRET_ACCESS_KEY: 'test-secret',
      S3_BUCKET_NAME: 'test-bucket',
      ADMIN_EMAIL: 'admin@test.com',
      ADMIN_PASSWORD: 'testpassword123',
      NEXTAUTH_SECRET: 'test-secret-min-32-chars-long-required',
    };

    expect(() => {
      const config = require('./config');
      const n8nConfig = config.getN8nConfig();
      expect(n8nConfig.baseUrl).toBe('http://localhost:5678');
    }).not.toThrow();
  });
});

