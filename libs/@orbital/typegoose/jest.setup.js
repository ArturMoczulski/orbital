/**
 * Common Jest setup for all test types
 * This file is loaded after the Jest environment is set up but before tests are run
 */

// Set up global mocks and configurations that apply to all test types

// Increase timeout for all tests
jest.setTimeout(60000);

// Silence console output during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Add any other global setup needed for all test types
