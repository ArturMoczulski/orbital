import {
  FormInputInteractable,
  FormInputInteractableOptions,
} from "../AutoForm/FormInput.interactable";
import {
  CypressInteractable,
  CypressInteractableOptions,
} from "../Cypress.interactable";
import { DialogInteractable } from "../MaterialUI/Dialog.interactable";
import { ObjectFormInteractable } from "./ObjectForm.interactable";

/**
 * Options for ObjectFormDialogInteractable
 */
export interface ObjectFormDialogInteractableOptions
  extends CypressInteractableOptions {
  /**
   * Optional index for when multiple dialogs with the same selector exist
   */
  index?: number;

  /**
   * The type of object in the form
   */
  objectType: string;
}

/**
 * Interactable for the ObjectFormDialog component
 * Uses composition to delegate to DialogInteractable and ObjectFormInteractable
 */
export class ObjectFormDialogInteractable extends CypressInteractable {
  /**
   * The object type for this form
   */
  protected objectType: string;

  /**
   * The DialogInteractable instance for dialog operations
   */
  protected dialogInteractable: DialogInteractable;

  /**
   * The ObjectFormInteractable instance for form operations
   */
  protected formInteractable: ObjectFormInteractable;

  /**
   * Constructor for ObjectFormDialogInteractable
   * @param options Additional options for the interactable
   */
  constructor(options: ObjectFormDialogInteractableOptions) {
    super({
      dataTestId: "ObjectFormDialog",
      index: options.index,
      parentElement: options.parentElement,
    });

    // Store the object type
    this.objectType = options.objectType;

    // Create the dialog interactable
    this.dialogInteractable = new DialogInteractable({
      index: options.index,
      parentElement: options.parentElement,
    });

    // Create the form interactable with the dialog content as parent
    this.formInteractable = new ObjectFormInteractable({
      objectType: options.objectType,
      parentElement: () => this.getContent(),
    });
  }

  /**
   * Get the dialog element
   * Delegates to the dialog interactable
   */
  get(options?: any): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.dialogInteractable.get(options);
  }

  /**
   * Get the content of the dialog
   * Delegates to the dialog interactable
   */
  getContent(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.dialogInteractable.getContent();
  }

  /**
   * Get the title of the dialog
   * Delegates to the dialog interactable
   */
  getTitle(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.dialogInteractable.getTitle();
  }

  /**
   * Get the actions section of the dialog
   * Delegates to the dialog interactable
   */
  getActions(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.dialogInteractable.getActions();
  }

  /**
   * Get the form interactable
   */
  getForm(): ObjectFormInteractable {
    return this.formInteractable;
  }

  /**
   * Get the submit button in the dialog actions
   */
  getSubmitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get().find('[data-testid="ObjectFormDialogSubmitButton"]');
  }

  /**
   * Get the cancel button in the dialog actions
   */
  getCancelButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.get().find('[data-testid="ObjectFormDialogCancelButton"]');
  }

  /**
   * Submit the form using the dialog's submit button
   */
  submit(): this {
    this.getSubmitButton().click();
    return this;
  }

  /**
   * Cancel the form using the dialog's cancel button
   */
  cancel(): this {
    this.getCancelButton().click();
    return this;
  }

  /**
   * Get a field within the form
   * Delegates to the form interactable
   */
  field<T extends FormInputInteractable<any> = FormInputInteractable<any>>(
    fieldName: string,
    customInteractable?: new (options: FormInputInteractableOptions) => T
  ): Cypress.Chainable<T> {
    return this.formInteractable.field(fieldName, customInteractable);
  }

  /**
   * Get the value of a field within the form
   * Delegates to the form interactable
   */
  getFieldValue(fieldName: string): Cypress.Chainable<any> {
    return this.formInteractable.getFieldValue(fieldName);
  }

  /**
   * Set the value of a field within the form
   * Delegates to the form interactable
   */
  setFieldValue(fieldName: string, value: any): Cypress.Chainable<this> {
    return this.formInteractable.setFieldValue(fieldName, value).then(() => {
      return cy.wrap(this);
    });
  }

  /**
   * Check if the form is disabled
   * Delegates to the form interactable
   */
  isDisabled(): Cypress.Chainable<boolean> {
    return this.formInteractable.isDisabled();
  }

  /**
   * Check if the form is in read-only mode
   * Delegates to the form interactable
   */
  isReadOnly(): Cypress.Chainable<boolean> {
    return this.formInteractable.isReadOnly();
  }

  /**
   * Get the current form data
   * Delegates to the form interactable
   */
  getFormData(): Cypress.Chainable<Record<string, any>> {
    return this.formInteractable.getFormData();
  }

  /**
   * Fill the form with the provided data and submit it
   * @param data The data to fill the form with
   */
  fillAndSubmit(data: Record<string, any>): this {
    // Fill each field in the form
    Object.entries(data).forEach(([fieldName, value]) => {
      this.setFieldValue(fieldName, value);
    });

    // Submit the form
    this.submit();

    return this;
  }
}

/**
 * Create an ObjectFormDialog interactable
 * @param options Options for the interactable
 */
export function objectFormDialog(
  options: ObjectFormDialogInteractableOptions
): ObjectFormDialogInteractable {
  return new ObjectFormDialogInteractable(options);
}

// Export the factory function and class
export default objectFormDialog;
