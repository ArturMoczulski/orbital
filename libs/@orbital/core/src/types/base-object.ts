import { faker } from "@faker-js/faker";

/**
 * BaseObject provides automatic assignment of partial data into instance properties.
 */
export class BaseObject<T> {
  constructor(data?: Partial<T>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}
