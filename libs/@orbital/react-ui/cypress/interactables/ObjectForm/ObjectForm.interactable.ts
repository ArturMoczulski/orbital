import {
  FormInputInteractable,
  FormInputInteractableOptions,
  inputField,
} from "../AutoForm/FormInput.interactable";
import {
  CypressInteractable,
  CypressInteractableOptions,
} from "../Cypress.interactable";

/**
 * Options for ObjectFormInteractable
 */
export interface ObjectFormInteractableOptions
  extends CypressInteractableOptions {
  /**
   * Optional index for when multiple forms with the same selector exist
   */
  index?: number;

  /**
   * The type of object in the form
   */
  objectType: string;
}

/**
 * Interactable for the ObjectForm component
 */
export class ObjectFormInteractable extends CypressInteractable {
  /**
   * The object type for this form
   */
  protected objectType: string;

  /**
   * Constructor for ObjectFormInteractable
   * @param options Additional options for the interactable
   */
  constructor(options: ObjectFormInteractableOptions) {
    super({
      dataTestId: "ObjectForm",
      index: options.index,
      parentElement: options.parentElement,
    });

    // Store the object type
    this.objectType = options.objectType;
  }

  /**
   * Get the submit button
   */
  get submitButton() {
    return this.get().find("[type=submit]");
  }

  /**
   * Submit the form
   */
  submit() {
    this.submitButton.click();
    return this;
  }

  field<T extends FormInputInteractable<any> = FormInputInteractable<any>>(
    fieldName: string,
    customInteractable?: new (options: FormInputInteractableOptions) => T
  ): Cypress.Chainable<T> {
    // Create a parent element function that returns the fieldset element
    const parentElement = () => {
      return this.get();
    };

    // Use the inputField factory to create the appropriate field interactable
    return inputField<T>(
      {
        fieldName,
        parentElement,
      },
      customInteractable
    );
  }

  /**
   * Get the value of a field within the form
   */
  getFieldValue(fieldName: string): Cypress.Chainable<any> {
    return this.field(fieldName).then((field) => {
      if (field) {
        return field.getValue();
      }
      return cy.wrap(null);
    });
  }

  /**
   * Set the value of a field within the form
   */
  setFieldValue(fieldName: string, value: any): Cypress.Chainable<this> {
    return this.field(fieldName).then((field) => {
      if (field) {
        field.setValue(value);
      }
      return cy.wrap(this);
    });
  }

  /**
   * Check if the form is disabled
   */
  isDisabled(): Cypress.Chainable<boolean> {
    return this.get().then(($form) => {
      // Check if the form has the disabled attribute
      const formDisabled =
        $form.attr("disabled") === "disabled" ||
        $form.attr("disabled") === "true";

      // Check if the submit button is disabled
      const submitDisabled =
        $form.find("[type=submit]").attr("disabled") !== undefined;

      return cy.wrap(formDisabled || submitDisabled);
    });
  }

  /**
   * Check if the form is in read-only mode
   */
  isReadOnly(): Cypress.Chainable<boolean> {
    return this.get().then(($form) => {
      // Check if the form has the readonly attribute
      const formReadOnly =
        $form.attr("readonly") === "readonly" ||
        $form.attr("readonly") === "true";

      // Check if all input fields are readonly
      const allInputsReadOnly =
        $form.find("input").length > 0 &&
        $form.find("input").filter(function () {
          return !Cypress.$(this).attr("readonly");
        }).length === 0;

      return cy.wrap(formReadOnly || allInputsReadOnly);
    });
  }

  /**
   * Get the current form data
   */
  /**
   * Get the current form data
   * @returns A Cypress.Chainable that resolves to a record of form field values
   */
  getFormData(): Cypress.Chainable<Record<string, any>> {
    // Create a function that collects form data
    const collectFormData = () => {
      return new Cypress.Promise<Record<string, any>>((resolve) => {
        // Get the form element
        this.get().then(($form) => {
          const formData: Record<string, any> = {};

          // Get all input fields
          $form.find("input, select, textarea").each((_, element) => {
            const $element = Cypress.$(element);
            const name = $element.attr("name");

            if (name) {
              // Get the value based on the input type
              let value;

              if ($element.attr("type") === "checkbox") {
                value = $element.prop("checked");
              } else if ($element.attr("type") === "radio") {
                if ($element.prop("checked")) {
                  value = $element.val();
                }
              } else {
                value = $element.val();
              }

              if (value !== undefined) {
                formData[name] = value;
              }
            }
          });

          // Remove any id field if present, as we only support _id now
          if (formData.id) {
            console.log(
              "Found legacy id field in form data, removing it as only _id is supported"
            );
            delete formData.id;
          }

          // Resolve the promise with the form data
          resolve(formData);
        });
      });
    };

    // Return a chainable that will resolve to the form data
    return cy.wrap(null).then(() => collectFormData());
  }
}

/**
 * Create an ObjectForm interactable
 * @param options Options for the interactable
 */
export function objectForm(
  options: ObjectFormInteractableOptions
): ObjectFormInteractable {
  return new ObjectFormInteractable(options);
}

// Export the factory function and class
export default objectForm;
