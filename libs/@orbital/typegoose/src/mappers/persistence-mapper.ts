import { IdentifiableObject } from "@orbital/core";

/**
 * PersistenceMapper provides automatic mapping between domain objects and persistence models
 * without requiring custom mappers for each class.
 */
export class PersistenceMapper {
  /**
   * Convert a domain object to a persistence model
   */
  static toPersistence<TDomainEntity extends Partial<IdentifiableObject>>(
    domainObject: TDomainEntity
  ): Record<string, any> {
    const result: Record<string, any> = {};

    // Get all properties from the domain object
    for (const key in domainObject) {
      const value = domainObject[key];

      if (value === undefined) {
        continue;
      }

      // Special handling for _id to ensure it's always a string
      if (key === "_id" && value !== null) {
        result[key] = String(value);
        continue;
      }

      // Handle nested domain objects
      if (value instanceof IdentifiableObject) {
        result[key] = this.toPersistence(value);
      }
      // Handle arrays of domain objects
      else if (
        Array.isArray(value) &&
        value.length > 0 &&
        value[0] instanceof IdentifiableObject
      ) {
        result[key] = value.map((item) =>
          item instanceof IdentifiableObject ? this.toPersistence(item) : item
        );
      }
      // Handle arrays of IDs (strings)
      else if (Array.isArray(value) && key.endsWith("Ids")) {
        result[key] = value.map((item) => String(item));
      }
      // Handle primitive values
      else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Convert a persistence model to a domain object
   */
  static toDomain<TDomainEntity extends IdentifiableObject>(
    DomainClass: new (data: any) => TDomainEntity,
    document: Document & { toObject?: () => any }
  ): TDomainEntity {
    // Convert the document to a plain object
    const plainData = document.toObject ? document.toObject() : document;

    // Ensure _id is a string
    if (plainData._id) {
      plainData._id = String(plainData._id);
    }

    // Create a new instance of the domain class with the document data
    const domainObject = new DomainClass(plainData);

    return domainObject;
  }
}
