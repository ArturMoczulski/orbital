import { prop } from "@typegoose/typegoose";

/**
 * Interface for position properties
 */
export interface PositionProps {
  x: number;
  y: number;
  z: number;
}

/**
 * TypeGoose model for embedded Position sub-document.
 * Represents a 3D position with x, y, z coordinates.
 * Implements PositionProps directly to avoid circular dependencies.
 */
export class PositionModel implements PositionProps {
  @prop({ required: true })
  x!: number;

  @prop({ required: true })
  y!: number;

  @prop({ required: true })
  z!: number;

  constructor(data: Partial<PositionProps> = {}) {
    this.x = data.x ?? 0;
    this.y = data.y ?? 0;
    this.z = data.z ?? 0;
  }

  /**
   * Converts this object to a plain JavaScript object without methods or non-enumerable properties.
   * This is useful for serialization, especially when saving to databases.
   *
   * @returns A plain JavaScript object representation of this instance
   */
  toPlainObject(): Record<string, any> {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
    };
  }
}
