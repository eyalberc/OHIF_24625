/**
 * Jest Configuration for Virtual Series Integration Tests
 * 
 * Task 4.7: Functional and Integration Testing
 */

module.exports = {
  displayName: 'Virtual Series Integration Tests',
  testMatch: [
    '**/VirtualSeriesFunctionalTests.test.js',
    '**/VirtualSeriesIntegration.test.js'
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.integration.setup.js'],
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/utils/**/*.js',
    'src/getDataSourcesModule.*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@ohif/core$': '<rootDir>/__mocks__/@ohif/core.js'
  },
  testTimeout: 30000, // 30 seconds for integration tests
  maxWorkers: 4,
  verbose: true,
  bail: false, // Continue running tests even if some fail
  forceExit: true,
  detectOpenHandles: true,
  resetMocks: true,
  clearMocks: true,
  restoreMocks: true
}; 