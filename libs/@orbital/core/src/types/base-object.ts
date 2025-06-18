import { randomUUID } from "crypto";
/**
 * BaseObject provides automatic assignment of partial data into instance properties.
 */
export class BaseObject<T> {
  /** Unique identifier, defaults to a random UUID */
  public id: string;
  constructor(data?: Partial<T & { id: string }>) {
    // Initialize id first, allowing override from data
    this.id = data?.id ?? randomUUID();
    if (data) {
      Object.assign(this, data);
    }
  }
}
