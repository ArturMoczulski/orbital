/**
 * Simple interface for identifiable objects to avoid dependency on @orbital/core
 */
interface IdentifiableObject {
  _id: string;
  [key: string]: any;
}

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
      if (value && typeof value === "object" && "_id" in value) {
        result[key] = this.toPersistence(value);
      }
      // Handle arrays of domain objects
      else if (
        Array.isArray(value) &&
        value.length > 0 &&
        value[0] &&
        typeof value[0] === "object" &&
        "_id" in value[0]
      ) {
        result[key] = value.map((item: any) =>
          item && typeof item === "object" && "_id" in item
            ? this.toPersistence(item)
            : item
        );
      }
      // Handle arrays of IDs (strings)
      else if (Array.isArray(value) && key.endsWith("Ids")) {
        result[key] = value.map((item: any) => String(item));
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
  static toDomain<TDomainEntity>(
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
