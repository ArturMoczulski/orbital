import { faker } from "@faker-js/faker";

/**
 * BaseObject provides automatic assignment of partial data into instance properties.
 */
export class BaseObject<T> {
  constructor(data?: Partial<T>) {
    if (data) {
      // Use direct property assignment instead of Object.assign
      // to ensure proper assignment in test environment
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          (this as any)[key] = data[key];
        }
      }
    }
  }
}
