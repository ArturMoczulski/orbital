// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Register the cypress-terminal-report log collector
require("cypress-terminal-report/src/installLogsCollector")({
  collectTypes: [
    "cons:log",
    "cons:info",
    "cons:warn",
    "cons:error",
    "cy:log",
    "cy:command",
  ],
});

import { mount } from "cypress/react";

// Register cypress-grep for filtering tests
import registerCypressGrep from "@cypress/grep/src/support";
registerCypressGrep();

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add("mount", mount);

// Example use:
// cy.mount(<MyComponent />)
