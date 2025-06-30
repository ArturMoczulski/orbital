import { z } from "zod";
import { zodSchemaRegistry } from "../decorators/zod-schema.decorator";

/**
 * BaseObject provides automatic assignment of partial data into instance properties.
 */
export class BaseObject<T> {
  constructor(data?: Partial<T>) {
    if (data) {
      Object.assign(this, data);
    }

    // Validation can be performed by calling validate() when needed
  }

  /**
   * Converts this object to a plain JavaScript object without methods or non-enumerable properties.
   * This is useful for serialization, especially when saving to databases.
   *
   * @returns A plain JavaScript object representation of this instance
   */
  // Define this method on the prototype to ensure it's available to all instances
  toPlainObject(): Record<string, any> {
    // Create a plain object with all enumerable properties
    const plainObject: Record<string, any> = {};

    // Copy all enumerable properties
    for (const key in this) {
      const value = this[key];

      // Handle different types of values
      plainObject[key] = this.convertValueToPlain(value);
    }

    return plainObject;
  }

  /**
   * Helper method to convert a value to its plain representation
   * Handles nested objects, arrays, and primitive values
   *
   * @param value The value to convert
   * @returns The plain representation of the value
   */
  public convertValueToPlain(value: any): any {
    // Handle null or undefined
    if (value == null) {
      return value;
    }

    // Handle arrays by mapping each element
    if (Array.isArray(value)) {
      return value.map((item) => this.convertValueToPlain(item));
    }

    // Handle objects with toPlainObject method
    if (
      typeof value === "object" &&
      "toPlainObject" in value &&
      typeof value.toPlainObject === "function"
    ) {
      return value.toPlainObject();
    }

    // Handle other objects (like Date, Map, etc.)
    if (typeof value === "object" && value.constructor !== Object) {
      // For built-in objects like Date, we'll return them as-is
      // They should be handled by the JSON serialization process
      return value;
    }

    // Handle plain objects recursively
    if (typeof value === "object") {
      const plainObj: Record<string, any> = {};
      for (const key in value) {
        plainObj[key] = this.convertValueToPlain(value[key]);
      }
      return plainObj;
    }

    // Return primitive values as-is
    return value;
  }

  /**
   * Validates the current instance against the class's Zod schema.
   * This method uses the static zSchema() method to get the schema.
   *
   * @throws ZodError if validation fails
   * @returns this instance if validation succeeds
   */
  // Ensure this method is properly defined on the prototype
  validateSchema(): this {
    try {
      const constructor = this.constructor as typeof BaseObject;
      const schema = constructor.zSchema();

      // Parse the current instance data
      schema.parse(this);

      return this;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("No Zod schema registered")
      ) {
        // If there's no schema registered, we'll skip validation
        return this;
      }

      // Wrap validation errors with more context
      throw new Error(
        `Validation failed in ${this.constructor.name}: ${error}`
      );
    }
  }

  /**
   * Returns the Zod schema associated with this class.
   * This method looks up the schema in the zodSchemaRegistry.
   *
   * @returns The Zod schema for this class
   * @throws Error if no schema is registered for this class
   */
  /**
   * Returns the Zod schema associated with this class.
   * This method looks up the schema in the zodSchemaRegistry.
   * If no schema is found for this class, it walks up the prototype chain
   * to find a schema from a parent class.
   *
   * @returns The Zod schema for this class
   * @throws Error if no schema is registered for this class or any of its ancestors
   */
  static zSchema(): z.ZodType<any> {
    // Start with the current class
    let currentConstructor: any = this;
    let schema: z.ZodType<any> | undefined;

    // Walk up the prototype chain until we find a schema or reach Object
    while (currentConstructor && currentConstructor !== Object) {
      schema = zodSchemaRegistry.get(currentConstructor);
      if (schema) {
        return schema;
      }

      // Move up to the parent class
      currentConstructor = Object.getPrototypeOf(currentConstructor);
    }

    // If we get here, no schema was found
    throw new Error(
      `No Zod schema registered for class ${this.name} or any of its parent classes. Use the @ZodSchema decorator to register a schema.`
    );
  }

  /**
   * Returns the JSON Schema representation of this class's Zod schema.
   * This is useful for generating documentation or for LLM prompts.
   *
   * @returns The JSON Schema for this class
   */
  static toJsonSchema(): object {
    // This requires zod-to-json-schema package to be installed
    // For now, we'll just return a simple object with the schema's description
    const schema = this.zSchema();

    // Get the description directly from the schema's _def property
    // This is how Zod stores the description internally
    let description = `Schema for ${this.name}`;
    if (
      schema &&
      typeof schema === "object" &&
      "_def" in schema &&
      schema._def &&
      typeof schema._def === "object" &&
      (schema._def as any).description
    ) {
      description = (schema._def as any).description;
    }

    return {
      type: "object",
      description: description,
      properties: {},
    };
  }
}
