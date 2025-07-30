module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  
  // Memory configuration to prevent heap out of memory errors
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',
  
  // Increase timeout for performance tests
  testTimeout: 30000,
}; 