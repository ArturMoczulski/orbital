// ObjectFormDialog.interactable.ts
// This file provides an interactable class for ObjectFormDialog in Cypress tests

/// <reference types="cypress" />

import { SchemaWithObjects } from "../../../src/components/ObjectForm/ObjectForm";
import { DialogInteractable } from "../MaterialUI/Dialog.interactable";
import { objectForm, ObjectFormInteractable } from "./ObjectForm.interactable";

/**
 * Options for ObjectFormDialogInteractable
 */
export interface ObjectFormDialogInteractableOptions {
  /**
   * The data-testid of the dialog
   */
  dataTestId?: string;

  /**
   * The schema for the form
   */
  schema: SchemaWithObjects;

  /**
   * The type of object this form is for
   */
  objectType: string;
}

/**
 * ObjectFormDialogInteractable class represents a dialog with an ObjectForm
 * and provides methods for interacting with the form
 */
export class ObjectFormDialogInteractable extends DialogInteractable {
  private readonly schema: SchemaWithObjects;
  private readonly objectType: string;

  /**
   * Constructor for ObjectFormDialogInteractable
   * @param options The options for the ObjectFormDialogInteractable
   */
  constructor(options: ObjectFormDialogInteractableOptions) {
    super({
      componentName: "Dialog",
      dataTestId: options.dataTestId || "ObjectFormDialog",
    });
    this.schema = options.schema;
    this.objectType = options.objectType;
  }

  /**
   * Get the form within the dialog as an ObjectFormInteractable
   * @returns An ObjectFormInteractable instance for the form
   */
  form(): ObjectFormInteractable {
    // Make sure the dialog is visible before trying to get the form
    this.get({}).should("be.visible");

    // Verify the form exists within the dialog
    this.get({}).find(`[data-testid="ObjectForm"]`).should("exist");

    // Create and return the ObjectFormInteractable with the correct options
    return objectForm({
      dataTestId: "ObjectForm",
      parentElement: () => this.get(),
      objectType: this.objectType,
    });
  }

  /**
   * Fill and submit the form
   * @param data The data to fill the form with
   */
  submit(data: Record<string, any>): this {
    // Fill the form fields
    Object.entries(data).forEach(([key, value]) => {
      this.form().setFieldValue(key, value);
    });

    // Submit the form
    this.form().submit();

    // Wait for the dialog to close
    this.waitForClose();

    return this;
  }

  /**
   * Click the cancel button to close the dialog
   */
  cancel(): this {
    // Make sure the dialog is visible
    this.get({}).should("be.visible");

    // Click the cancel button
    this.get({}).contains("button", "Cancel").click();

    // Wait for the dialog to close
    this.waitForClose();

    return this;
  }
}

/**
 * Factory function to create an ObjectFormDialogInteractable
 * @param options The options for the ObjectFormDialogInteractable
 * @returns An ObjectFormDialogInteractable instance
 */
export function objectFormDialog(
  options: ObjectFormDialogInteractableOptions
): ObjectFormDialogInteractable {
  return new ObjectFormDialogInteractable(options);
}

export default objectFormDialog;
