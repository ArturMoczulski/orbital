// TreeExplorer Dialog Cypress Helpers
// This file provides interactable classes for TreeExplorer dialogs in Cypress tests

/// <reference types="cypress" />

import { z } from "zod";
import {
  FormDialogInteractable,
  ZodObjectSchema,
} from "../../../cypress/interactables/MaterialUI/FormDialog/FormDialog.interactable";
import { TreeExplorerInteractable } from "./TreeExplorer.interactable";

/**
 * TreeExplorerAddDialog class represents the Add dialog in the TreeExplorer
 * and provides methods for interacting with it
 */
export class AddBranchDialogInteractable<
  Schema extends ZodObjectSchema = ZodObjectSchema,
  CustomActions extends string | number | symbol = never,
> extends FormDialogInteractable<Schema> {
  private explorer: TreeExplorerInteractable<CustomActions, Schema>;

  /**
   * Constructor for TreeExplorerAddDialog
   * @param explorer The parent TreeExplorerInteractable instance
   * @param schema The Zod schema for the form
   */
  constructor(
    explorer: TreeExplorerInteractable<CustomActions, Schema>,
    schema: Schema
  ) {
    super({
      dataTestId: "TreeExplorerAddDialog", // Dialog test ID
      formTestId: "AddForm", // Form test ID
      schema, // Schema for the form
      componentName: "Dialog",
    });
    this.explorer = explorer;
  }

  /**
   * Override the open method to use the appropriate button based on state
   */
  override open(): Cypress.Chainable<void> {
    // Check if we're in empty state and use the appropriate button
    return this.explorer.get().then(($el) => {
      if ($el.find('[data-testid="EmptyState"]').length > 0) {
        this.explorer.buttons.addEmpty().click({ force: true });
      } else {
        this.explorer.buttons.add().click({ force: true });
      }

      // Return a chainable to satisfy TypeScript and maintain proper chaining
      return cy.wrap(null).then(() => {}) as unknown as Cypress.Chainable<void>;
    });
  }

  /**
   * Submit the form and return the parent explorer for chaining
   * @param data The data to fill the form with
   */
  submitAndReturnExplorer(
    data: Partial<z.infer<Schema>>
  ): TreeExplorerInteractable<CustomActions, Schema> {
    // Use the parent submit method to fill and submit the form
    this.submit(data);

    // Return the parent explorer for chaining
    return this.explorer;
  }
}
