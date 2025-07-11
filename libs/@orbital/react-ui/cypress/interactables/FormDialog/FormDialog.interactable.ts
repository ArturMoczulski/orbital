// FormDialog.interactable.ts
// This file provides interactable classes for form dialogs in Cypress tests

/// <reference types="cypress" />

import { z } from "zod";
import { AutoFormInteractable } from "../AutoForm/AutoForm.interactable";
import {
  DialogInteractable,
  DialogInteractableOptions,
} from "../MaterialUI/Dialog.interactable";

/**
 * Type alias for any Zod object schema
 */
export type ZodObjectSchema = z.ZodObject<any, any, any, any>;

/**
 * Options for FormDialogInteractable
 */
export interface FormDialogInteractableOptions
  extends DialogInteractableOptions {
  /**
   * The data-testid of the form within the dialog
   */
  formTestId: string;

  /**
   * The Zod schema for the form
   */
  schema: ZodObjectSchema;
}

/**
 * FormDialogInteractable class represents a dialog with a form
 * and provides methods for interacting with the form
 */
export class FormDialogInteractable<
  Schema extends ZodObjectSchema = ZodObjectSchema,
> extends DialogInteractable {
  private readonly formTestId: string;
  private readonly schema: Schema;

  /**
   * Constructor for FormDialogInteractable
   * @param options The options for the FormDialogInteractable
   */
  constructor(options: FormDialogInteractableOptions) {
    super(options);
    this.formTestId = options.formTestId;
    this.schema = options.schema as Schema;
  }

  /**
   * Get the form within the dialog as an AutoFormInteractable
   * @returns An AutoFormInteractable instance for the form
   */
  form(): AutoFormInteractable<z.infer<Schema>> {
    // Make sure the dialog is visible before trying to get the form
    this.get({}).should("be.visible");

    // Log the form test ID for debugging
    cy.log(`Looking for form with test ID: ${this.formTestId}`);

    // Verify the form exists within the dialog
    this.get({}).find(`[data-testid="${this.formTestId}"]`).should("exist");

    // Create and return the AutoFormInteractable with the correct options
    return new AutoFormInteractable({
      dataTestId: this.formTestId,
      parentElement: () => this.get({}),
    });
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

export default FormDialogInteractable;
