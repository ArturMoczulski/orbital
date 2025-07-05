// FormDialog.interactable.ts
// This file provides interactable classes for form dialogs in Cypress tests

/// <reference types="cypress" />

import { z } from "zod";
import { AutoFormInteractable } from "../../src/components/AutoForm/AutoForm.cy.commands";
import { DialogInteractable } from "./Dialog.interactable";

/**
 * Type alias for any Zod object schema
 */
export type ZodObjectSchema = z.ZodObject<any, any, any, any>;

/**
 * FormDialogInteractable class represents a dialog with a form
 * and provides methods for interacting with the form
 */
export class FormDialogInteractable<
  Schema extends ZodObjectSchema = ZodObjectSchema,
> extends DialogInteractable<string> {
  private readonly formTestId: string;
  private readonly schema: Schema;

  /**
   * Constructor for FormDialogInteractable
   * @param componentType The data-testid of the dialog
   * @param formTestId The data-testid of the form within the dialog
   * @param schema The Zod schema for the form
   * @param parentElement Optional parent element to scope the dialog within
   */
  constructor(
    componentType: string,
    formTestId: string,
    schema: Schema,
    parentElement?: () => Cypress.Chainable<JQuery<HTMLElement>>
  ) {
    super(componentType, parentElement);
    this.formTestId = formTestId;
    this.schema = schema;
  }

  /**
   * Get the form within the dialog as an AutoFormInteractable
   * @returns An AutoFormInteractable instance for the form
   */
  form(): AutoFormInteractable<z.infer<Schema>> {
    // Make sure the dialog is visible before trying to get the form
    this.getElement().should("be.visible");

    // Log the form test ID for debugging
    cy.log(`Looking for form with test ID: ${this.formTestId}`);

    // Verify the form exists within the dialog
    this.getElement()
      .find(`[data-testid="${this.formTestId}"]`)
      .should("exist");

    // Create and return the AutoFormInteractable with a direct parent function
    // that always gets a fresh element to avoid stale element references
    return new AutoFormInteractable<z.infer<Schema>>(this.formTestId, () =>
      this.getElement()
    );
  }

  /**
   * Fill and submit the form
   * @param data The data to fill the form with
   */
  submit(data: Partial<z.infer<Schema>>): this {
    // Fill and submit the form
    this.form().submit(data);

    // Wait for the dialog to close
    this.waitForClose();

    return this;
  }
}
