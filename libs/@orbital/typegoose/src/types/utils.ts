/**
 * Utility type to remove the _id field from a type
 * @template T The type to remove _id from
 */
export type WithoutId<T> = Omit<T, "_id">;

/**
 * Utility type to remove the _id field from a type and make all fields optional
 * @template T The type to remove _id from
 */
export type PartialWithoutId<T> = Partial<Omit<T, "_id">>;
