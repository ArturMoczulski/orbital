// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// No need to import commands or global styles for now

// Import Cypress mount command
import { mount } from "cypress/react";

// Add the mount command to the global Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add("mount", mount);

// Prevent TypeScript errors when accessing Cypress.sinon
declare global {
  namespace Cypress {
    interface Chainable {
      sinon: any;
    }
  }
}

// Suppress uncaught exceptions from React components
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
