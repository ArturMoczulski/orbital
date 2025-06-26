// Jest setup for end-to-end tests
// Add E2E-test-specific configuration or global mocks here

// Load environment variables from .env.test
require("dotenv").config({ path: ".env.test" });

// Log environment variables for debugging
console.log("NATS_URL:", process.env.NATS_URL);
console.log("BASE_URL:", process.env.BASE_URL);
