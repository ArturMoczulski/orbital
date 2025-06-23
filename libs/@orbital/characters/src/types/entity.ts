/**
 * Base entity with a unique identifier.
 */
export class Entity {
  _id!: string;
  /**
   * Returns a JSON-stringified representation of this entity.
   */
  public toString(): string {
    return JSON.stringify(this);
  }
}
