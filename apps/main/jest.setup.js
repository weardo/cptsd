// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://test:test@localhost:27017/test';
