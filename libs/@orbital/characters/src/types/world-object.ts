import { Entity } from "./entity";
import type { Position } from "@orbital/core";

/**
 * Base class for all objects in the world.
 */
export class WorldObject extends Entity {
  /** Creation timestamp */
  createdAt!: Date;

  /** Arbitrary tags for categorization */
  tags?: string[];

  /** Reference to current location identifier */
  currentLocation?: string;

  /** 3D position of the object in the world */
  position!: Position;
}
