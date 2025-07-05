// DialogInteractable.ts
// This file provides interactable classes for dialogs in Cypress tests

/// <reference types="cypress" />

import { CypressInteractable } from "./Cypress.interactable";

/**
 * DialogInteractable class represents a dialog component
 * and provides methods for interacting with it
 */
export class DialogInteractable<
  T extends string = string,
> extends CypressInteractable<T> {
  /**
   * Constructor for DialogInteractable
   * @param componentType The data-testid of the dialog
   * @param parentElement Optional parent element to scope the dialog within
   */
  constructor(
    componentType: T,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
  ) {
    super(componentType, parentElement);
  }

  /**
   * Check if the dialog is open
   * This method safely checks for the existence of the dialog element
   * @returns A boolean indicating whether the dialog is open
   */
  isOpen(): Cypress.Chainable<boolean> {
    // Use cy.get with { timeout: 0 } to prevent waiting for the element to exist
    // This allows us to check if the element exists without failing the test
    return cy.get("body").then(($body) => {
      // Use jQuery to check if the element exists in the DOM and is visible
      const $el = $body.find(this.selector());
      return $el.length > 0 && $el.css("display") !== "none";
    });
  }

  /**
   * Open the dialog
   * This method should be overridden by subclasses to implement specific open behavior
   */
  open(): this {
    // This is a base implementation that should be overridden
    cy.log(`Opening dialog: ${this.componentType}`);
    return this;
  }

  /**
   * Close the dialog
   * This method should be overridden by subclasses to implement specific close behavior
   */
  close(): this {
    // This is a base implementation that should be overridden
    cy.log(`Closing dialog: ${this.componentType}`);
    return this;
  }

  /**
   * Wait for the dialog to close
   * This method safely waits for the dialog to be removed from the DOM
   */
  waitForClose(timeout: number = 4000): this {
    // Use a simpler approach to wait for the dialog to be hidden
    cy.log(`Waiting for dialog to close: ${this.componentType}`);

    // Wait for the element to have display: none
    cy.get(this.selector(), { timeout }).should("have.css", "display", "none");

    return this;
  }
}

// No custom commands needed - we're using built-in Cypress commands
