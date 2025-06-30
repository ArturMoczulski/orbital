// Jest setup for end-to-end tests
// Add E2E-test-specific configuration or global mocks here

// The .env.test file is already loaded by jest.e2e.config.js
// Log the NATS URL being used for debugging
console.log(`[E2E Test Setup] Using NATS_URL: ${process.env.NATS_URL}`);

// Note: We're not starting the microservice here because:
// 1. The e2e tests connect directly to NATS and send messages
// 2. The microservice needs to be started separately before running the tests
// 3. Dynamic imports in Jest setup files require --experimental-vm-modules flag
