import "reflect-metadata";

/**
 * Metadata key for storing reference information
 */
export const REFERENCE_METADATA_KEY = "orbital:reference";

/**
 * Options for the Reference decorator
 */
export interface ReferenceOptions {
  /**
   * The collection/model name that this field references
   */
  collection: string;

  /**
   * Whether this reference is required (true) or optional (false)
   * Default: true
   */
  required?: boolean;

  /**
   * Field in the referenced collection to match against
   * Default: "_id"
   */
  foreignField?: string;

  /**
   * Custom name for the reference
   * Default: camelCase singular of collection name
   */
  name?: string;
}

/**
 * Reference metadata stored for a property
 */
export interface ReferenceMetadata extends ReferenceOptions {
  /**
   * The property name this reference is attached to
   */
  propertyKey: string;

  /**
   * Whether this reference is required (true) or optional (false)
   */
  required: boolean;

  /**
   * Field in the referenced collection to match against
   */
  foreignField: string;

  /**
   * Name for the reference, used for model references
   */
  name: string;
}

/**
 * Convert a string to camelCase singular form
 * @param str The string to convert
 * @returns The camelCase singular form
 */
function toCamelCaseSingular(str: string): string {
  // Remove trailing 's' if it exists (simple pluralization)
  const singular = str.endsWith("s") ? str.slice(0, -1) : str;

  // Convert to camelCase
  return singular.charAt(0).toLowerCase() + singular.slice(1);
}

/**
 * Decorator that marks a property as a reference to another collection
 *
 * This decorator stores metadata about the reference that can be used
 * for validation and relationship management.
 *
 * @param options Reference configuration options
 * @returns PropertyDecorator
 *
 * @example
 * ```ts
 * class AreaModel {
 *   @Reference({ collection: 'worlds' })
 *   worldId: string;
 *
 *   @Reference({ collection: 'areas', required: false })
 *   parentId?: string | null;
 * }
 * ```
 */
export function Reference(options: ReferenceOptions): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    if (typeof propertyKey !== "string") {
      throw new Error(
        `@Reference can only be applied to string properties, got symbol on ${target.constructor.name}`
      );
    }

    // Set defaults for optional parameters
    const metadata: ReferenceMetadata = {
      propertyKey,
      collection: options.collection,
      required: options.required !== false, // Default to true if not specified
      foreignField: options.foreignField || "_id", // Default to _id if not specified
      name: options.name || toCamelCaseSingular(options.collection), // Default to camelCase singular of collection
    };

    // Get existing references or initialize empty array
    const existingReferences: ReferenceMetadata[] =
      Reflect.getMetadata(REFERENCE_METADATA_KEY, target.constructor) || [];

    // Add this reference to the array
    existingReferences.push(metadata);

    // Store updated references on the constructor
    Reflect.defineMetadata(
      REFERENCE_METADATA_KEY,
      existingReferences,
      target.constructor
    );
  };
}

/**
 * Get all reference metadata for a class
 * @param target The class to get reference metadata for
 * @returns Array of reference metadata
 */
export function getReferences(target: any): ReferenceMetadata[] {
  return Reflect.getMetadata(REFERENCE_METADATA_KEY, target) || [];
}
