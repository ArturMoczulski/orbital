import { prop } from "@typegoose/typegoose";
import { PositionModel } from "./position.model";

/**
 * Interface for memory properties
 */
export interface MemoryProps {
  timestamp: Date;
  description: string;
  valence: number;
  locationId?: string;
  coordinates?: PositionModel;
  tags?: string[];
}

/**
 * TypeGoose model for embedded Memory sub-document.
 * Implements MemoryProps directly to avoid circular dependencies.
 */
export class MemoryModel implements MemoryProps {
  @prop({ required: true })
  timestamp!: Date;

  @prop({ required: true })
  description!: string;

  @prop({ required: true })
  valence!: number;

  @prop()
  locationId?: string;

  @prop({ type: () => PositionModel, _id: false })
  coordinates?: PositionModel;

  @prop({ type: () => [String] })
  tags?: string[];

  constructor(data: Partial<MemoryProps> = {}) {
    if (data.timestamp !== undefined) this.timestamp = data.timestamp;
    if (data.description !== undefined) this.description = data.description;
    if (data.valence !== undefined) this.valence = data.valence;
    if (data.locationId !== undefined) this.locationId = data.locationId;
    if (data.coordinates !== undefined) {
      this.coordinates = new PositionModel(data.coordinates);
    }
    if (data.tags !== undefined) this.tags = data.tags;
  }

  /**
   * Converts this object to a plain JavaScript object without methods or non-enumerable properties.
   * This is useful for serialization, especially when saving to databases.
   *
   * @returns A plain JavaScript object representation of this instance
   */
  toPlainObject(): Record<string, any> {
    return {
      timestamp: this.timestamp,
      description: this.description,
      valence: this.valence,
      locationId: this.locationId,
      coordinates: this.coordinates?.toPlainObject(),
      tags: this.tags,
    };
  }
}
