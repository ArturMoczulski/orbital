import { WithoutId } from "@orbital/core";

/**
 * Utility type to add the _id field to a type and make all fields optional
 * @template T The type to add _id to
 */
export type WithId<T> = Partial<T> & { _id: string };

// Re-export WithoutId from @orbital/core for backward compatibility
export { WithoutId };
