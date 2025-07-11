import { z } from "zod";

/**
 * Types of database relationships
 */
export enum RelationshipType {
  /**
   * Belongs-to relationship
   * This model contains a foreign key pointing to another model
   * (Similar to the "belongs_to" association in Rails)
   */
  BELONGS_TO = "BELONGS_TO",

  /**
   * Has-one relationship
   * This model is referenced by exactly one instance of another model
   * (Similar to the "has_one" association in Rails)
   */
  HAS_ONE = "HAS_ONE",

  /**
   * Has-many relationship
   * This model is referenced by multiple instances of another model
   * (Similar to the "has_many" association in Rails)
   */
  HAS_MANY = "HAS_MANY",

  /**
   * Many-to-many relationship
   * This model and another model reference each other through a join table
   * (Similar to the "has_and_belongs_to_many" association in Rails)
   */
  MANY_TO_MANY = "MANY_TO_MANY",

  /**
   * Recursive relationship
   * This model references itself (e.g., for hierarchical data)
   * (Similar to self-referential associations in Rails)
   */
  RECURSIVE = "RECURSIVE",
}

/**
 * Options for the reference method
 */
export interface ReferenceOptions {
  /**
   * The schema that this field references
   */
  schema: z.ZodType<any>;

  /**
   * Field in the referenced schema to match against
   * Default: "_id"
   */
  foreignField?: string;

  /**
   * Custom name for the reference
   * Default: derived from schema description or type
   */
  name?: string;

  /**
   * Type of relationship
   * Default: BELONGS_TO for ZodString, HAS_MANY for ZodArray
   */
  type?: RelationshipType;
}

/**
 * Reference metadata stored for a property
 */
export interface ReferenceMetadata
  extends Omit<ReferenceOptions, "name" | "foreignField" | "type"> {
  /**
   * Field in the referenced schema to match against
   */
  foreignField: string;

  /**
   * Name for the reference, used for model references
   */
  name: string;

  /**
   * Type of relationship
   */
  type: RelationshipType;
}

/**
 * Helper to extract a schema name from its description or infer from structure
 * @param schema The Zod schema to extract a name from
 * @returns The extracted name in lowercase
 */
export function getSchemaName(schema: z.ZodType<any>): string {
  // Try to get name from schema description
  if (schema._def.description) {
    const match =
      schema._def.description.match(/^A (.+?) in the/i) ||
      schema._def.description.match(/^A (.+?) with/i) ||
      schema._def.description.match(/^A (.+?)$/i);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  // If schema is an object with a name field, use that as fallback naming convention
  if (schema instanceof z.ZodObject && schema.shape.name) {
    return "item";
  }

  // Default fallback
  return "reference";
}

// Extend ZodStringDef and ZodArrayDef to include reference metadata
declare module "zod" {
  interface ZodStringDef {
    reference?: ReferenceMetadata;
  }

  interface ZodArrayDef {
    reference?: ReferenceMetadata;
  }

  // Add reference method to ZodString interface
  interface ZodString {
    reference(options: ReferenceOptions): ZodString;
  }

  // Add reference method to ZodArray interface
  interface ZodArray<
    T extends z.ZodType<any, any, any>,
    Cardinality extends "many" | "atleastone" = "many",
  > {
    reference(options: ReferenceOptions): ZodArray<T, Cardinality>;
  }
}

/**
 * Add reference metadata to a ZodString
 * @param zodString The ZodString to add reference metadata to
 * @param options The reference options
 * @returns A new ZodString with reference metadata
 */
export function addStringReference(
  zodString: z.ZodString,
  options: ReferenceOptions
): z.ZodString {
  // Determine relationship name if not provided
  const relationshipName = options.name || getSchemaName(options.schema);

  // Default to BELONGS_TO for string fields (foreign keys)
  const relationType = options.type || RelationshipType.BELONGS_TO;

  // Create a new ZodString with the reference metadata
  return new z.ZodString({
    ...zodString._def,
    reference: {
      schema: options.schema,
      foreignField: options.foreignField || "_id",
      name: relationshipName,
      type: relationType,
    },
  });
}

/**
 * Add reference metadata to a ZodArray
 * @param zodArray The ZodArray to add reference metadata to
 * @param options The reference options
 * @returns A new ZodArray with reference metadata
 */
export function addArrayReference<T extends z.ZodTypeAny>(
  zodArray: z.ZodArray<T>,
  options: ReferenceOptions
): z.ZodArray<T> {
  // Determine relationship name if not provided
  const relationshipName = options.name || getSchemaName(options.schema);

  // Default to HAS_MANY for array fields
  const relationType = options.type || RelationshipType.HAS_MANY;

  // Create a new ZodArray with the reference metadata
  return new z.ZodArray({
    ...zodArray._def,
    reference: {
      schema: options.schema,
      foreignField: options.foreignField || "_id",
      name: relationshipName,
      type: relationType,
    },
  });
}

// Add the reference method to ZodString prototype
// @ts-ignore - Ignore TypeScript errors for this method
z.ZodString.prototype.reference = function (
  options: ReferenceOptions
): z.ZodString {
  return addStringReference(this, options);
};

// Add the reference method to ZodArray prototype
// @ts-ignore - Ignore TypeScript errors for this method
z.ZodArray.prototype.reference = function (
  options: ReferenceOptions
): z.ZodArray<any> {
  return addArrayReference(this, options);
};

// Make sure these are exported
export { z };

/**
 * Check if a schema has reference metadata
 * @param schema The schema to check
 * @returns True if the schema has reference metadata
 */
export function hasReference(schema: z.ZodTypeAny): boolean {
  return (
    (schema instanceof z.ZodString && "reference" in schema._def) ||
    (schema instanceof z.ZodArray && "reference" in schema._def)
  );
}

/**
 * Get reference metadata from a schema
 * @param schema The schema to get reference metadata from
 * @returns The reference metadata, or undefined if none exists
 */
export function getReference(
  schema: z.ZodTypeAny
): ReferenceMetadata | undefined {
  if (schema instanceof z.ZodString && "reference" in schema._def) {
    return schema._def.reference as ReferenceMetadata;
  }
  if (schema instanceof z.ZodArray && "reference" in schema._def) {
    return schema._def.reference as ReferenceMetadata;
  }
  return undefined;
}
