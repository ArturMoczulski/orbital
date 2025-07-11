// ***********************************************************
// This file is processed and loaded automatically before your E2E test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands
import "../commands/index";

// Suppress uncaught exceptions
Cypress.on("uncaught:exception", (err) => {
  // Returning false here prevents Cypress from failing the test
  if (
    err.message.includes("ResizeObserver") ||
    err.message.includes("act(...)") ||
    err.message.includes("React state update")
  ) {
    return false;
  }
  return true;
});
