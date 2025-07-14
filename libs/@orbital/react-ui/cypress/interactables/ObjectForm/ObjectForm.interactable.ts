import {
  CypressInteractable,
  CypressInteractableOptions,
} from "../Cypress.interactable";
import {
  arrayObjectFieldset,
  ArrayObjectFieldsetInteractable,
} from "./ArrayObjectFieldset.interactable";
import {
  objectFieldset,
  ObjectFieldsetInteractable,
} from "./ObjectFieldset.interactable";

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

  /**
   * Get all object fieldsets within the form
   */
  objectFieldsets(): Cypress.Chainable<ObjectFieldsetInteractable[]> {
    return this.get().then(($form) => {
      const fieldsets: ObjectFieldsetInteractable[] = [];

      // Find all ObjectFieldset elements
      $form.find('[data-testid="ObjectFieldset"]').each((index, element) => {
        const $element = Cypress.$(element);
        const objectType = $element.attr("data-object-type") || this.objectType;
        const objectId = $element.attr("data-object-id");

        fieldsets.push(objectFieldset(objectType, undefined, objectId, index));
      });

      return cy.wrap(fieldsets);
    });
  }

  /**
   * Get a specific object fieldset by index or object ID
   */
  objectFieldset(
    indexOrId: number | string
  ): Cypress.Chainable<ObjectFieldsetInteractable> {
    if (typeof indexOrId === "number") {
      // If a number is provided, use it as an index
      return cy.wrap(
        objectFieldset(this.objectType, () => this.get(), undefined, indexOrId)
      );
    } else {
      // If a string is provided, use it as an ID
      return cy.wrap(
        objectFieldset(this.objectType, () => this.get(), indexOrId)
      );
    }
  }

  /**
   * Get all array object fieldsets within the form
   */
  arrayObjectFieldsets(): Cypress.Chainable<ArrayObjectFieldsetInteractable[]> {
    return this.get().then(($form) => {
      const fieldsets: ArrayObjectFieldsetInteractable[] = [];

      // Find all ArrayObjectFieldset elements
      $form.find('[data-testid="ArrayObjectFieldset"]').each((index) => {
        fieldsets.push(
          arrayObjectFieldset({
            objectType: this.objectType,
            parentElement: () => this.get(),
            index,
          })
        );
      });

      return cy.wrap(fieldsets);
    });
  }

  /**
   * Get a specific array object fieldset by index
   */
  arrayObjectFieldset(
    index: number
  ): Cypress.Chainable<ArrayObjectFieldsetInteractable> {
    return cy.wrap(
      arrayObjectFieldset({
        objectType: this.objectType,
        parentElement: () => this.get(),
        index,
      })
    );
  }

  /**
   * Get a field within the form by name
   * This will search all fieldsets for the field
   */
  field(fieldName: string): Cypress.Chainable<any> {
    return this.get().then(($form) => {
      // Look for the field in the form
      const $field = $form.find(
        `[name="${fieldName}"], [data-field-name="${fieldName}"]`
      );

      if ($field.length > 0) {
        // If found directly in the form, return it
        return cy.wrap($field);
      } else {
        // Otherwise, search in all fieldsets
        return this.objectFieldsets().then((fieldsets) => {
          // Create a promise chain to check each fieldset
          const checkFieldsets = (index: number): Cypress.Chainable<any> => {
            if (index >= fieldsets.length) {
              // If we've checked all fieldsets and found nothing, return null
              return cy.wrap(null);
            }

            // Check if the current fieldset has the field
            return fieldsets[index].hasField(fieldName).then((hasField) => {
              if (hasField) {
                // If it has the field, return the field
                return fieldsets[index].field(fieldName);
              } else {
                // Otherwise, check the next fieldset
                return checkFieldsets(index + 1);
              }
            });
          };

          return checkFieldsets(0);
        });
      }
    });
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
