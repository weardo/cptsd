// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/cptsd-journal-test';
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || 'test-secret-min-32-chars-long-required';
process.env.NEXTAUTH_URL =
  process.env.NEXTAUTH_URL || 'http://localhost:3003';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'testpassword123';
