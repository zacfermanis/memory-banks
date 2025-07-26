module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 60000, // Increased timeout for performance tests
  // Memory and performance optimizations
  maxWorkers: 1, // Run tests sequentially to avoid memory conflicts
  workerIdleMemoryLimit: '1GB', // Increased memory limit
  // Disable coverage for performance tests to reduce memory usage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/performance/'
  ],
  // Force garbage collection between tests
  testEnvironmentOptions: {
    node: {
      maxOldSpaceSize: 4096
    }
  }
}; 