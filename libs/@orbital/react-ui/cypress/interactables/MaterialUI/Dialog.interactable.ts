import {
  ModalInteractable,
  ModalInteractableOptions,
} from "./Modal.interactable";

/**
 * Options for DialogInteractable
 */
export interface DialogInteractableOptions extends ModalInteractableOptions {}

/**
 * Interactable for Material UI Dialog components
 * Extends ModalInteractable to provide methods specific to Dialog components
 */
export class DialogInteractable extends ModalInteractable {
  constructor(options: DialogInteractableOptions) {
    super({
      ...options,
      componentName: options.componentName || "Dialog",
    });
  }

  /**
   * Gets the content of the dialog
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the content element of the dialog
   */
  getContent(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get({}).find(".MuiDialogContent-root");
  }

  /**
   * Gets the title of the dialog
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the title element of the dialog
   */
  getTitle(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get({}).find(".MuiDialogTitle-root");
  }

  /**
   * Gets the actions section of the dialog
   * @returns Cypress.Chainable<JQuery<HTMLElement>> - the actions element of the dialog
   */
  getActions(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get({}).find(".MuiDialogActions-root");
  }

  /**
   * Clicks on an element within the dialog by its data-testid
   * @param dataTestId - the data-testid of the element to click
   * @returns this - for method chaining
   */
  clickOnElement(dataTestId: string): this {
    this.get({}).find(`[data-testid="${dataTestId}"]`).click();
    return this;
  }
}

/**
 * Helper function to create a DialogInteractable instance
 * @param options Optional configuration options for the DialogInteractable
 * @returns DialogInteractable instance
 */
export function dialog(
  options?: Partial<DialogInteractableOptions>
): DialogInteractable {
  return new DialogInteractable({
    componentName: "Dialog",
    ...options,
  });
}

export default DialogInteractable;
