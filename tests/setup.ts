// Jest setup file
// This file runs before each test file

// Set up test environment
process.env['NODE_ENV'] = 'test';

// Enable garbage collection for performance tests
if (global.gc) {
  global.gc();
}

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
}); 